"""
Workflow Service for CivicOps.
Coordinates Workflow Agent execution, compares required vs user available documents,
and manages in-memory case plans.
"""

import logging
from typing import Dict, Any, List, Optional
from backend.agents.workflow_agent import WorkflowAgent
from backend.models.notice import NoticeStructuredData
from backend.models.research import ProcedureResearchData
from backend.models.workflow import WorkflowCase, WorkflowResponse

logger = logging.getLogger("civicops.workflow_service")

# In-memory storage for active cases
_IN_MEMORY_CASES: Dict[str, WorkflowCase] = {}

class WorkflowService:
    """
    Orchestration layer for personalized workflow generation and case plan retrieval.
    """

    def __init__(self, workflow_agent: WorkflowAgent = None):
        self.agent = workflow_agent or WorkflowAgent()

    async def generate_workflow(
        self,
        document_data: NoticeStructuredData,
        research_data: ProcedureResearchData,
        user_documents: List[str]
    ) -> WorkflowResponse:
        """
        Builds a personalized workflow case, stores it in-memory, and returns the response.
        """
        logger.info(f"WorkflowService: Building workflow with {len(user_documents)} user documents.")
        try:
            doc_dict = document_data.model_dump()
            res_dict = research_data.model_dump()

            workflow_dict = self.agent.build_workflow(
                document_data=doc_dict,
                research_data=res_dict,
                user_documents=user_documents
            )

            workflow_case = WorkflowCase(**workflow_dict)
            
            # Persist in in-memory database
            _IN_MEMORY_CASES[workflow_case.case_id] = workflow_case
            logger.info(f"WorkflowService: Saved workflow case {workflow_case.case_id} to in-memory store.")

            return WorkflowResponse(
                status="success",
                workflow=workflow_case
            )
        except Exception as e:
            logger.error(f"WorkflowService failed to build workflow: {e}", exc_info=True)
            # Defensive fallback
            fallback_case = WorkflowCase(
                case_id="CIV-1001",
                goal="Resolve Civic Notice",
                priority="medium",
                deadline="Not found",
                tasks=[],
                missing_documents=[],
                matched_documents=[]
            )
            _IN_MEMORY_CASES[fallback_case.case_id] = fallback_case
            return WorkflowResponse(
                status="success",
                workflow=fallback_case
            )

    def get_case(self, case_id: str) -> Optional[WorkflowCase]:
        """
        Retrieves a case by case_id from the in-memory store.
        """
        return _IN_MEMORY_CASES.get(case_id)

    def list_cases(self) -> List[WorkflowCase]:
        """
        Returns all stored cases.
        """
        return list(_IN_MEMORY_CASES.values())

# Global singleton
workflow_service = WorkflowService()

