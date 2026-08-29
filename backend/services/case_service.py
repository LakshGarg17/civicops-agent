"""
Case Service for CivicOps.
Manages persistent case lifecycle, multi-agent timeline tracking,
application preparation, and server-side human approval gate enforcement.
"""

import json
import logging
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

from backend.models.notice import NoticeStructuredData
from backend.models.research import ProcedureResearchData
from backend.models.workflow import WorkflowCase, WorkflowTask
from backend.models.application import ApplicationDocument, ApplicationUpdateRequest
from backend.models.case import (
    CivicCase,
    ApprovalRecord,
    SubmissionRecord,
    TimelineEvent
)
from backend.agents.action_agent import ActionAgent
from backend.tools.package_documents import PackageDocumentsTool
from backend.tools.submit_application import SubmitApplicationTool

logger = logging.getLogger("civicops.case_service")

DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
DATA_DIR.mkdir(parents=True, exist_ok=True)
CASES_FILE = DATA_DIR / "cases.json"

# Shared in-memory dictionary across service instances
_SHARED_CASES: Dict[str, CivicCase] = {}

class CaseService:
    """
    Service layer for Civic Case management with file-backed persistence.
    """

    def __init__(
        self,
        action_agent: Optional[ActionAgent] = None,
        package_tool: Optional[PackageDocumentsTool] = None,
        submit_tool: Optional[SubmitApplicationTool] = None
    ):
        self.action_agent = action_agent or ActionAgent()
        self.package_tool = package_tool or PackageDocumentsTool()
        self.submit_tool = submit_tool or SubmitApplicationTool()
        self._cases_cache: Dict[str, CivicCase] = _SHARED_CASES
        self._load_from_disk()

    def _load_from_disk(self) -> None:
        """Loads persisted cases from data/cases.json into memory."""
        if not CASES_FILE.exists():
            return
        try:
            with open(CASES_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    for cid, cdata in data.items():
                        try:
                            self._cases_cache[cid] = CivicCase(**cdata)
                        except Exception as parse_err:
                            logger.warning(f"Error parsing case {cid}: {parse_err}")
            logger.info(f"Loaded {len(self._cases_cache)} cases from {CASES_FILE}")
        except Exception as e:
            logger.error(f"Failed to load cases from disk: {e}")

    def _save_to_disk(self) -> None:
        """Saves memory cache to data/cases.json."""
        try:
            serializable = {cid: case.model_dump() for cid, case in self._cases_cache.items()}
            with open(CASES_FILE, "w", encoding="utf-8") as f:
                json.dump(serializable, f, indent=2)
        except Exception as e:
            logger.error(f"Failed to save cases to disk: {e}")

    def create_case(
        self,
        notice: NoticeStructuredData,
        research: ProcedureResearchData,
        workflow: WorkflowCase
    ) -> CivicCase:
        """
        Initializes a persistent case and sets up the initial multi-agent timeline.
        """
        case_id = workflow.case_id
        now_str = datetime.datetime.now().isoformat()

        # Build initial timeline
        timeline = [
            TimelineEvent(
                id="evt_1",
                agent_name="Document Agent",
                title="Analyzed Civic Notice",
                description=f"Extracted notice: {notice.notice_type}, Reference: {notice.reference_number}",
                status="completed",
                timestamp=now_str
            ),
            TimelineEvent(
                id="evt_2",
                agent_name="Research Agent",
                title="Researched Official Procedure",
                description=f"Identified procedure: {research.procedure_name} under {research.authority}",
                status="completed",
                timestamp=now_str
            ),
            TimelineEvent(
                id="evt_3",
                agent_name="Workflow Agent",
                title="Created Personalized Action Plan",
                description=f"Generated {len(workflow.tasks)} sequential tasks with {len(workflow.missing_documents)} document upload requirements.",
                status="completed",
                timestamp=now_str
            )
        ]

        civic_case = CivicCase(
            case_id=case_id,
            status="draft",
            notice=notice,
            research=research,
            workflow=workflow,
            application=None,
            approval_record=None,
            submission=None,
            timeline=timeline,
            created_at=now_str,
            updated_at=now_str
        )

        self._cases_cache[case_id] = civic_case
        self._save_to_disk()
        logger.info(f"CaseService: Created case {case_id}")
        return civic_case

    def get_case(self, case_id: str) -> Optional[CivicCase]:
        """Retrieves a case by case_id."""
        if case_id not in self._cases_cache:
            self._load_from_disk()
        return self._cases_cache.get(case_id)

    def list_cases(self) -> List[CivicCase]:
        """Lists all registered cases."""
        self._load_from_disk()
        return list(self._cases_cache.values())

    def prepare_application(
        self,
        case_id: str,
        applicant_name: Optional[str] = None,
        additional_notes: Optional[str] = ""
    ) -> CivicCase:
        """
        Uses ActionAgent to prepare a structured application for the case.
        """
        case = self.get_case(case_id)
        if not case:
            raise KeyError(f"Case '{case_id}' not found.")

        user_data = {
            "applicant_name": applicant_name or case.notice.citizen_name,
            "additional_notes": additional_notes,
            "user_documents": case.workflow.matched_documents
        }

        # Action Agent prepares next action
        proposal = self.action_agent.prepare_next_action(
            workflow=case.workflow.model_dump(),
            notice_data=case.notice.model_dump(),
            research_data=case.research.model_dump(),
            user_data=user_data
        )

        app_doc = ApplicationDocument(**proposal["application"])
        case.application = app_doc
        case.status = "action_prepared"
        case.updated_at = datetime.datetime.now().isoformat()

        # Update timeline
        case.timeline.append(
            TimelineEvent(
                id=f"evt_{len(case.timeline) + 1}",
                agent_name="Action Agent",
                title="Prepared Formal Application Package",
                description=f"Drafted petition to {app_doc.to} regarding {app_doc.subject}. Awaiting citizen review and authorization.",
                status="completed",
                timestamp=case.updated_at
            )
        )

        self._cases_cache[case_id] = case
        self._save_to_disk()
        return case

    def update_application(
        self,
        case_id: str,
        update_data: ApplicationUpdateRequest
    ) -> CivicCase:
        """
        Allows the citizen to edit and save updated application fields prior to approval.
        """
        case = self.get_case(case_id)
        if not case or not case.application:
            raise KeyError(f"Case '{case_id}' or application draft not found.")

        current_app = case.application.model_dump()
        update_dict = update_data.model_dump(exclude_unset=True)

        for key, val in update_dict.items():
            if val is not None:
                current_app[key] = val

        case.application = ApplicationDocument(**current_app)
        case.updated_at = datetime.datetime.now().isoformat()

        self._cases_cache[case_id] = case
        self._save_to_disk()
        return case

    def approve_action(
        self,
        case_id: str,
        action_type: str = "submit_application",
        approved_by: str = "Citizen Operator",
        notes: str = ""
    ) -> CivicCase:
        """
        Records verified human authorization for consequential action.
        """
        case = self.get_case(case_id)
        if not case:
            raise KeyError(f"Case '{case_id}' not found.")

        now_str = datetime.datetime.now().isoformat()
        token = f"AUTH-TOK-{case_id}-{int(datetime.datetime.now().timestamp())}"

        approval_rec = ApprovalRecord(
            approved=True,
            action_type=action_type,
            approved_by=approved_by,
            timestamp=now_str,
            token=token,
            notes=notes
        )

        case.approval_record = approval_rec
        case.status = "approved"
        case.updated_at = now_str

        # Add human approval event to timeline
        case.timeline.append(
            TimelineEvent(
                id=f"evt_{len(case.timeline) + 1}",
                agent_name="Human Approver",
                title="Explicit Human Authorization Granted",
                description=f"Citizen '{approved_by}' reviewed and authorized action '{action_type}' for submission.",
                status="completed",
                timestamp=now_str,
                requires_approval=True
            )
        )

        self._cases_cache[case_id] = case
        self._save_to_disk()
        logger.info(f"CaseService: Recorded human approval for {case_id}")
        return case

    def submit_case(self, case_id: str) -> CivicCase:
        """
        Executes sandbox submission.
        Strictly enforces that case.approval_record exists and approved is True.
        """
        case = self.get_case(case_id)
        if not case:
            raise KeyError(f"Case '{case_id}' not found.")

        if not case.application:
            raise ValueError(f"Case '{case_id}' does not have a prepared application.")

        # STRICT HUMAN-IN-THE-LOOP APPROVAL ENFORCEMENT
        if not case.approval_record or not case.approval_record.approved:
            logger.error(f"CaseService: Blocked unapproved submission attempt on case {case_id}")
            raise PermissionError(
                f"Action execution rejected: Case '{case_id}' has not received explicit human approval."
            )

        # Call submit tool
        submission_dict = self.submit_tool.submit_application(
            case_id=case_id,
            application_data=case.application.model_dump(),
            approval_record=case.approval_record.model_dump()
        )

        submission_rec = SubmissionRecord(**submission_dict)
        case.submission = submission_rec
        case.status = "submitted"
        case.application.status = "submitted"
        case.updated_at = datetime.datetime.now().isoformat()

        # Mark submission and review tasks as completed in workflow
        for task in case.workflow.tasks:
            if any(w in task.title.lower() for w in ["submit", "application", "review"]):
                task.status = "completed"

        # Add submission timeline event
        case.timeline.append(
            TimelineEvent(
                id=f"evt_{len(case.timeline) + 1}",
                agent_name="Submission Agent",
                title="Application Submitted (CivicOps Demo Gateway)",
                description=f"Confirmation #{submission_rec.confirmation_number}. Registered in sandbox demo environment.",
                status="completed",
                timestamp=case.updated_at
            )
        )

        # Add monitoring placeholder step
        case.timeline.append(
            TimelineEvent(
                id=f"evt_{len(case.timeline) + 1}",
                agent_name="Monitoring Agent",
                title="Awaiting Agency Determination",
                description="Sandbox filing registered. Monitoring agent will track confirmation status in future milestone.",
                status="in_progress",
                timestamp=case.updated_at
            )
        )

        self._cases_cache[case_id] = case
        self._save_to_disk()
        logger.info(f"CaseService: Case {case_id} submitted successfully to Sandbox Gateway.")
        return case

# Global singleton
case_service = CaseService()
