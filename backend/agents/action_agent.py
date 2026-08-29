"""
Action Agent for CivicOps.
Analyzes pending workflow tasks, orchestrates document package preparation,
and constructs actionable application proposals while enforcing human-in-the-loop approval gates.
"""

import logging
from typing import Dict, Any, Optional, List
from backend.models.application import ApplicationDocument

logger = logging.getLogger("civicops.action_agent")

class ActionAgent:
    """
    Action Agent determines what actions can be autonomously prepared for the citizen
    and structures formal application drafts without executing consequential submissions.
    """

    def __init__(self, application_generator: Optional[Any] = None):
        if application_generator is None:
            from backend.services.application_generator import ApplicationGenerator
            self.generator = ApplicationGenerator()
        else:
            self.generator = application_generator

    def prepare_next_action(
        self,
        workflow: Dict[str, Any],
        notice_data: Dict[str, Any],
        research_data: Dict[str, Any],
        user_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Analyzes the workflow task list, identifies the next actionable preparation step,
        drafts the formal application document, and returns the proposed action payload.
        """
        logger.info(f"ActionAgent: Analyzing workflow case {workflow.get('case_id', 'N/A')}")
        tasks = workflow.get("tasks", []) or []

        # Find next pending task that can be prepared
        next_task = None
        for task in tasks:
            if task.get("status") in ["pending", "action_required", "in_progress"]:
                next_task = task
                break

        # Generate the structured application document
        app_dict = self.generator.generate_application(
            notice_data=notice_data,
            research_data=research_data,
            user_data=user_data,
            workflow=workflow
        )

        # Assess risk and human approval requirement
        has_missing_docs = len(app_dict.get("missing_documents", [])) > 0
        
        # Consequential actions (e.g., submitting externally) always require explicit human approval
        action_proposal = {
            "case_id": workflow.get("case_id", "CIV-1000"),
            "action_type": "generate_application",
            "target_task_id": next_task.get("id", "task_1") if next_task else "task_1",
            "target_task_title": next_task.get("title", "Prepare formal application") if next_task else "Prepare formal application",
            "application": app_dict,
            "has_missing_documents": has_missing_docs,
            "missing_documents": app_dict.get("missing_documents", []),
            "supporting_documents": app_dict.get("supporting_documents", []),
            "requires_approval": True,
            "risk_assessment": {
                "risk_level": "consequential",
                "reason": "Submitting a formal administrative dispute modifies official record status and invokes statutory review."
            },
            "status": "prepared"
        }

        return action_proposal
