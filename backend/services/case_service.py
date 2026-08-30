"""
Case Service for CivicOps.
Manages persistent case lifecycle, multi-agent timeline tracking,
application preparation, server-side human approval gate enforcement,
and autonomous Monitoring Agent execution.

Strictly follows layering: Agents -> Domain Services -> FirestoreService.
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
    TimelineEvent,
    CaseStatusUpdate,
    CaseNotification
)
from backend.agents.action_agent import ActionAgent
from backend.agents.monitoring_agent import MonitoringAgent, monitoring_agent as default_monitoring_agent
from backend.tools.package_documents import PackageDocumentsTool
from backend.tools.submit_application import SubmitApplicationTool
from backend.services.firestore_service import firestore_service, FirestoreService

logger = logging.getLogger("civicops.case_service")

class CaseService:
    """
    Service layer for Civic Case management with Firestore-backed persistence.
    """

    def __init__(
        self,
        action_agent: Optional[ActionAgent] = None,
        monitoring_agent_inst: Optional[MonitoringAgent] = None,
        package_tool: Optional[PackageDocumentsTool] = None,
        submit_tool: Optional[SubmitApplicationTool] = None,
        firestore_svc: Optional[FirestoreService] = None
    ):
        self.action_agent = action_agent or ActionAgent()
        self.monitoring_agent = monitoring_agent_inst or default_monitoring_agent
        self.package_tool = package_tool or PackageDocumentsTool()
        self.submit_tool = submit_tool or SubmitApplicationTool()
        self.firestore = firestore_svc or firestore_service

    def create_case(
        self,
        notice: NoticeStructuredData,
        research: ProcedureResearchData,
        workflow: WorkflowCase
    ) -> CivicCase:
        """
        Initializes a persistent case in Firestore and sets up the initial multi-agent timeline.
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
            title=f"{notice.notice_type} Correction",
            notice_type=notice.notice_type,
            status="draft",
            deadline=notice.deadline,
            notice=notice,
            research=research,
            workflow=workflow,
            application=None,
            approval_record=None,
            submission=None,
            timeline=timeline,
            status_history=[],
            unread_notification=None,
            created_at=now_str,
            updated_at=now_str
        )

        # Save to Firestore
        self.firestore.create_case(civic_case.model_dump())
        logger.info(f"CaseService: Created persistent case {case_id} in Firestore.")
        return civic_case

    def get_case(self, case_id: str) -> Optional[CivicCase]:
        """Retrieves a case by case_id from Firestore."""
        raw_data = self.firestore.get_case(case_id)
        if not raw_data:
            return None
        try:
            return CivicCase(**raw_data)
        except Exception as e:
            logger.error(f"Error deserializing case {case_id}: {e}")
            return None

    def list_cases(self) -> List[CivicCase]:
        """Lists all registered cases from Firestore."""
        raw_list = self.firestore.list_cases()
        cases = []
        for raw in raw_list:
            try:
                cases.append(CivicCase(**raw))
            except Exception as e:
                logger.warning(f"Skipping invalid case record: {e}")
        return cases

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

        self.firestore.update_case(case_id, case.model_dump())
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

        self.firestore.update_case(case_id, case.model_dump())
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

        self.firestore.update_case(case_id, case.model_dump())
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

        now_str = datetime.datetime.now().isoformat()
        submission_rec = SubmissionRecord(**submission_dict)
        case.submission = submission_rec
        case.status = "submitted"
        case.application.status = "submitted"
        case.updated_at = now_str

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
                timestamp=now_str
            )
        )

        # Add initial status update record to Firestore
        initial_status_update = CaseStatusUpdate(
            update_id=f"upd_{int(datetime.datetime.now().timestamp()*1000)}",
            case_id=case_id,
            previous_status="approved",
            new_status="submitted",
            message="Application submitted to sandbox gateway. Autonomous monitoring active.",
            severity="info",
            next_action="Monitor agency review",
            source="CivicOps Demo Gateway",
            timestamp=now_str
        )
        self.firestore.add_status_update(initial_status_update.model_dump())
        case.status_history.append(initial_status_update)

        # Add monitoring step in progress
        case.timeline.append(
            TimelineEvent(
                id=f"evt_{len(case.timeline) + 1}",
                agent_name="Monitoring Agent",
                title="Autonomous Case Monitoring Active",
                description="Tracking agency determination via background monitoring cycles.",
                status="in_progress",
                timestamp=now_str
            )
        )

        self.firestore.update_case(case_id, case.model_dump())
        logger.info(f"CaseService: Case {case_id} submitted successfully to Sandbox Gateway.")
        return case

    def run_monitoring_cycle(self, case_id: str) -> Dict[str, Any]:
        """
        Executes an autonomous monitoring cycle for a case:
        - Invokes MonitoringAgent
        - Detects status changes
        - If changed -> mutates workflow, adds tasks, saves status update, triggers citizen alerts
        """
        case = self.get_case(case_id)
        if not case:
            raise KeyError(f"Case '{case_id}' not found.")

        # Run Monitoring Agent
        analysis = self.monitoring_agent.monitor_case(case_id, case.model_dump())
        now_str = datetime.datetime.now().isoformat()

        if analysis.get("change_detected"):
            new_status = analysis.get("current_status", case.status)
            previous_status = analysis.get("previous_status", case.status)
            severity = analysis.get("severity", "info")
            summary = analysis.get("summary", "Status update received.")
            next_action = analysis.get("next_action")
            requires_user = analysis.get("requires_user", False)

            # Update case status
            case.status = new_status
            case.updated_at = now_str

            # Create status update record in Firestore
            status_upd = CaseStatusUpdate(
                update_id=f"upd_{int(datetime.datetime.now().timestamp()*1000)}",
                case_id=case_id,
                previous_status=previous_status,
                new_status=new_status,
                message=summary,
                severity=severity,
                next_action=next_action,
                source="Agency Portal Determination",
                timestamp=now_str
            )
            self.firestore.add_status_update(status_upd.model_dump())
            case.status_history.append(status_upd)

            # Inject new workflow task if provided
            new_task_dict = analysis.get("new_task")
            if new_task_dict and isinstance(new_task_dict, dict):
                task_id = new_task_dict.get("task_id") or new_task_dict.get("id") or f"task_{len(case.workflow.tasks)+1}"
                new_task = WorkflowTask(
                    id=task_id,
                    title=new_task_dict.get("title", next_action or "Follow-up Action"),
                    description=new_task_dict.get("description", summary),
                    category="document_upload" if ("upload" in (next_action or "").lower() or requires_user) else "procedural",
                    status="action_required" if requires_user else "pending",
                    requires_user=requires_user
                )
                # Avoid duplicates
                if not any(t.title.lower() == new_task.title.lower() for t in case.workflow.tasks):
                    case.workflow.tasks.append(new_task)
                    logger.info(f"CaseService: Injected new task '{new_task.title}' into workflow for {case_id}")


            # Emit in-app notification if user action is required
            if requires_user or severity in ("high", "medium"):
                case.unread_notification = CaseNotification(
                    notification_id=f"notif_{int(datetime.datetime.now().timestamp()*1000)}",
                    case_id=case_id,
                    title=analysis.get("notification_title", "CivicOps Update: Action Required"),
                    message=summary,
                    severity=severity,
                    action_label=next_action or "View Required Action",
                    action_type="upload_document" if "upload" in (next_action or "").lower() else "review",
                    created_at=now_str,
                    unread=True
                )

            # Add timeline event
            case.timeline.append(
                TimelineEvent(
                    id=f"evt_{len(case.timeline) + 1}",
                    agent_name="Monitoring Agent",
                    title=f"Status Change Detected ({new_status.replace('_', ' ').title()})",
                    description=f"{summary} Next action: {next_action or 'Review determination'}.",
                    status="action_required" if requires_user else "completed",
                    timestamp=now_str
                )
            )

            # Persist updated case to Firestore
            self.firestore.update_case(case_id, case.model_dump())
            logger.info(f"CaseService: Updated case {case_id} following monitoring determination -> {new_status}")

        return {
            "case": case,
            "analysis": analysis
        }

    def acknowledge_notification(self, case_id: str) -> CivicCase:
        """
        Marks any active in-app notification on the case as read/acknowledged.
        """
        case = self.get_case(case_id)
        if not case:
            raise KeyError(f"Case '{case_id}' not found.")

        if case.unread_notification:
            case.unread_notification.unread = False
            case.updated_at = datetime.datetime.now().isoformat()
            self.firestore.update_case(case_id, case.model_dump())

        return case

    def get_status_history(self, case_id: str) -> List[Dict[str, Any]]:
        """Retrieves audit status history for a case from Firestore."""
        return self.firestore.get_status_history(case_id)

# Global singleton
case_service = CaseService()
