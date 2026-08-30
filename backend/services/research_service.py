"""
Research Service for CivicOps.
Coordinates Research Agent execution, grounds queries with government sources,
and shapes robust API responses.
"""

import logging
from typing import Dict, Any
from backend.agents.research_agent import ResearchAgent
from backend.models.notice import NoticeStructuredData
from backend.models.research import ProcedureResearchData, ResearchResponse

logger = logging.getLogger("civicops.research_service")

class ResearchService:
    """
    Orchestration layer for civic procedure research.
    """

    def __init__(self, research_agent: ResearchAgent = None):
        self.agent = research_agent or ResearchAgent()

    async def execute_research(self, notice_data: NoticeStructuredData) -> ResearchResponse:
        """
        Executes grounded research for the given notice data and formats the response.
        """
        logger.info(f"ResearchService: Initiating research for notice type: '{notice_data.notice_type}'")
        try:
            notice_dict = notice_data.model_dump()
            research_dict = self.agent.research_procedure(notice_dict)
            
            research_model = ProcedureResearchData(**research_dict)
            return ResearchResponse(
                status="success",
                research_data=research_model,
                sources_checked=research_model.source_information
            )
        except Exception as e:
            logger.error(f"ResearchService failed to execute research: {e}", exc_info=True)
            # Defensive fallback
            fallback_dict = self.agent.clean_and_parse_json("")
            research_model = ProcedureResearchData(**fallback_dict)
            return ResearchResponse(
                status="success",
                research_data=research_model,
                sources_checked=research_model.source_information
            )

# Global singleton
research_service = ResearchService()

