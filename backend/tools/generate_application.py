"""
Tool: Generate Application Tool for CivicOps.
Provides direct invocation of application generator service.
"""

from typing import Dict, Any, Optional

class GenerateApplicationTool:
    def __init__(self, generator: Optional[Any] = None):
        if generator is None:
            from backend.services.application_generator import ApplicationGenerator
            self.generator = ApplicationGenerator()
        else:
            self.generator = generator

    def run(
        self,
        notice_data: Dict[str, Any],
        research_data: Dict[str, Any],
        user_data: Optional[Dict[str, Any]] = None,
        workflow: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        return self.generator.generate_application(
            notice_data=notice_data,
            research_data=research_data,
            user_data=user_data,
            workflow=workflow
        )
