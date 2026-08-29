from pydantic import BaseModel, Field
from typing import List, Optional
from backend.models.notice import NoticeStructuredData
from backend.models.research import ProcedureResearchData

class WorkflowTask(BaseModel):
    """
    Individual actionable task within the civic action plan.
    """
    id: str = Field(..., description="Unique task identifier, e.g. 'task_1'")
    title: str = Field(..., description="Actionable title for the citizen or agent")
    status: str = Field(default="pending", description="Task status: 'pending', 'in_progress', 'completed', 'action_required'")
    requires_user: bool = Field(default=False, description="True if action requires user input/upload/decision")
    description: Optional[str] = Field(default="", description="Detailed step guidance or document specifications")
    category: Optional[str] = Field(default="procedural", description="'document_upload', 'procedural', 'review', 'submission', 'monitoring'")

class WorkflowCase(BaseModel):
    """
    Personalized civic action plan conforming to Day 3 schema.
    """
    case_id: str = Field(..., description="Generated case tracking ID, e.g. 'CIV-1024'")
    goal: str = Field(..., description="Primary objective of this personalized action plan")
    priority: str = Field(default="medium", description="Priority level: 'low', 'medium', 'high', 'critical'")
    deadline: str = Field(default="Not found", description="Final resolution deadline from notice or procedure")
    tasks: List[WorkflowTask] = Field(default_factory=list, description="Ordered sequence of tasks required to resolve notice")
    missing_documents: List[str] = Field(default_factory=list, description="Required documents the user has not yet provided")
    matched_documents: List[str] = Field(default_factory=list, description="Required documents the user already has on hand")

class WorkflowRequest(BaseModel):
    """
    Input payload for /workflow endpoint.
    """
    document_data: NoticeStructuredData = Field(..., description="Structured notice data from Document Agent")
    research_data: ProcedureResearchData = Field(..., description="Procedure data from Research Agent")
    user_documents: List[str] = Field(default_factory=list, description="List of documents the user has already provided/checked")

class WorkflowResponse(BaseModel):
    """
    Output payload for /workflow endpoint.
    """
    status: str = Field("success", description="Status of the workflow generation")
    workflow: WorkflowCase = Field(..., description="Generated personalized action plan")
