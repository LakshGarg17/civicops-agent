"""
Workflow Agent for CivicOps.
Diffs required government procedure documents against user-provided documents,
and generates a personalized, prioritized action plan with clear task sequencing.
"""

import logging
import random
import re
from typing import Dict, Any, List, Optional, Tuple

from backend.models.workflow import WorkflowCase, WorkflowTask

logger = logging.getLogger("civicops.workflow_agent")

def normalize_doc_name(name: str) -> str:
    """Normalizes document title for robust matching and diffing."""
    if not name:
        return ""
    # Lowercase, remove parentheticals like (Completed & Signed), remove punctuation
    cleaned = re.sub(r"\(.*?\)", "", name).lower()
    cleaned = re.sub(r"[^\w\s]", " ", cleaned)
    return " ".join(cleaned.split())

def match_user_document(req_doc: str, user_docs: List[str]) -> bool:
    """
    Checks if a required document is satisfied by any document in user's available list.
    Supports fuzzy substring and key phrase matching.
    """
    norm_req = normalize_doc_name(req_doc)
    if not norm_req:
        return False

    req_tokens = set(norm_req.split())

    for u_doc in user_docs:
        norm_user = normalize_doc_name(u_doc)
        if not norm_user:
            continue
        
        # Direct substring match
        if norm_req in norm_user or norm_user in norm_req:
            return True
            
        # Significant token overlap
        user_tokens = set(norm_user.split())
        overlap = req_tokens.intersection(user_tokens)
        if len(overlap) >= 2 or (len(req_tokens) == 1 and len(overlap) == 1):
            return True

    return False

class WorkflowAgent:
    """
    Workflow Agent synthesizes Document Intelligence + Research Procedure outputs
    with the citizen's current document inventory to produce a tailored action plan.
    """

    def __init__(self):
        self._case_counter = 1000

    def generate_case_id(self) -> str:
        """Generates a formatted civic case identifier, e.g. 'CIV-1024'."""
        self._case_counter += random.randint(1, 15)
        return f"CIV-{self._case_counter}"

    def calculate_priority(self, notice_data: Dict[str, Any], research_data: Dict[str, Any]) -> str:
        """
        Determines priority based on deadlines, notice severity, and financial impact.
        """
        issue_text = f"{notice_data.get('issue', '')} {notice_data.get('notice_type', '')} {research_data.get('procedure_name', '')}".lower()
        deadline_text = f"{notice_data.get('deadline', '')} {research_data.get('deadline_information', '')}".lower()

        if any(w in issue_text for w in ["delinquent", "lien", "immediate", "citation", "penalty", "default"]):
            return "high"
        if any(w in deadline_text for w in ["15 days", "21 days", "urgent", "immediate"]):
            return "high"
        if any(w in issue_text for w in ["hearing", "summons", "suspension"]):
            return "critical"
        
        return "medium"

    def diff_documents(
        self,
        required_documents: List[str],
        user_documents: List[str]
    ) -> Tuple[List[str], List[str]]:
        """
        Diffs required documents against user provided documents.
        Returns (missing_documents, matched_documents).
        """
        missing = []
        matched = []

        for req in required_documents:
            if not req or req.strip().lower() == "not found":
                continue
            if match_user_document(req, user_documents):
                matched.append(req)
            else:
                missing.append(req)

        return missing, matched

    def build_workflow(
        self,
        document_data: Dict[str, Any],
        research_data: Dict[str, Any],
        user_documents: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """
        Builds personalized civic action plan.
        - Identifies missing documentation vs available user documents
        - Sequences upload tasks for missing items
        - Incorporates procedural action steps
        - Returns structured WorkflowCase dict conforming to Day 3 schema
        """
        user_docs = user_documents or []
        required_docs = research_data.get("required_documents", []) or []

        # 1. Diff required vs user available documents
        missing_docs, matched_docs = self.diff_documents(required_docs, user_docs)

        # 2. Determine goal, deadline, priority, case_id
        notice_type = document_data.get("notice_type", "Government Notice")
        if notice_type.lower() == "not found":
            notice_type = "Civic Notice"

        procedure_name = research_data.get("procedure_name", "Resolution Procedure")
        goal = f"Resolve {notice_type} — {procedure_name}"
        
        # Priority
        priority = self.calculate_priority(document_data, research_data)

        # Deadline
        deadline = document_data.get("deadline", "")
        if not deadline or deadline.lower() == "not found":
            deadline = research_data.get("deadline_information", "Not found")

        case_id = self.generate_case_id()

        # 3. Construct sequential tasks
        tasks: List[WorkflowTask] = []
        task_idx = 1

        # Completed baseline tasks
        tasks.append(
            WorkflowTask(
                id=f"task_{task_idx}",
                title="Analyze uploaded notice & extract key citations",
                status="completed",
                requires_user=False,
                description=f"Extracted notice type: {notice_type}, reference: {document_data.get('reference_number', 'N/A')}",
                category="review"
            )
        )
        task_idx += 1

        tasks.append(
            WorkflowTask(
                id=f"task_{task_idx}",
                title="Research official municipal procedure & requirements",
                status="completed",
                requires_user=False,
                description=f"Identified procedure: {procedure_name} under {research_data.get('authority', 'authority')}",
                category="review"
            )
        )
        task_idx += 1

        # Add upload tasks for missing documents
        if missing_docs:
            for missing_doc in missing_docs:
                tasks.append(
                    WorkflowTask(
                        id=f"task_{task_idx}",
                        title=f"Upload {missing_doc}",
                        status="pending",
                        requires_user=True,
                        description=f"Mandatory supporting document required by {research_data.get('authority', 'agency')}.",
                        category="document_upload"
                    )
                )
                task_idx += 1

        # Add verified procedural steps from research
        research_steps = research_data.get("steps", [])
        if research_steps:
            for step_desc in research_steps:
                # Determine if step involves submission or review
                step_lower = step_desc.lower()
                is_user_step = any(w in step_lower for w in ["sign", "attend", "inspect", "engineer"])
                cat = "submission" if "submit" in step_lower else "procedural"
                
                tasks.append(
                    WorkflowTask(
                        id=f"task_{task_idx}",
                        title=step_desc,
                        status="pending",
                        requires_user=is_user_step,
                        description=f"Submission method: {research_data.get('submission_method', 'Official Channel')}",
                        category=cat
                    )
                )
                task_idx += 1
        else:
            # Fallback procedural tasks if research steps were empty
            tasks.append(
                WorkflowTask(
                    id=f"task_{task_idx}",
                    title="Prepare formal petition package",
                    status="pending",
                    requires_user=False,
                    category="procedural"
                )
            )
            task_idx += 1
            tasks.append(
                WorkflowTask(
                    id=f"task_{task_idx}",
                    title="Submit application to authority",
                    status="pending",
                    requires_user=True,
                    category="submission"
                )
            )
            task_idx += 1
            tasks.append(
                WorkflowTask(
                    id=f"task_{task_idx}",
                    title="Monitor agency response and tracking confirmation",
                    status="pending",
                    requires_user=False,
                    category="monitoring"
                )
            )
            task_idx += 1

        workflow_case = WorkflowCase(
            case_id=case_id,
            goal=goal,
            priority=priority,
            deadline=deadline,
            tasks=tasks,
            missing_documents=missing_docs,
            matched_documents=matched_docs
        )

        return workflow_case.model_dump()
