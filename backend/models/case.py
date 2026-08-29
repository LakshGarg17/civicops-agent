from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from backend.models.notice import NoticeStructuredData
from backend.models.research import ProcedureResearchData
from backend.models.workflow import WorkflowCase
from backend.models.application import ApplicationDocument

class ApprovalRecord(BaseModel):
    """
    Cryptographic/server-side recorded human approval for consequential civic actions.
    """
    approved: bool = Field(..., description="Whether the action was approved by the human operator")
    action_type: str = Field(default="submit_application", description="Type of action approved, e.g. 'submit_application'")
    approved_by: str = Field(default="Citizen Operator", description="Identifier or name of approving user")
    timestamp: str = Field(..., description="ISO timestamp when approval was granted")
    token: Optional[str] = Field(default=None, description="One-time approval verification token")
    notes: Optional[str] = Field(default="", description="Optional operator authorization comments")

class SubmissionRecord(BaseModel):
    """
    Sandbox / Demo submission receipt. Clearly labels demo/sandbox gateway execution.
    """
    application_id: str = Field(..., description="Case or submission identifier, e.g. 'CIV-2026-1042'")
    status: str = Field(default="submitted", description="'submitted', 'under_review', 'resolved'")
    submitted_at: str = Field(..., description="ISO timestamp of sandbox submission")
    submission_method: str = Field(default="CivicOps Demo Gateway (Sandbox)", description="Submission channel")
    confirmation_number: str = Field(..., description="Simulated confirmation code, e.g. 'DEMO-SUB-892147'")
    is_sandbox: bool = Field(default=True, description="Strict indicator that this filing is a simulation")
    gateway_message: Optional[str] = Field(
        default="Application accepted by CivicOps Sandbox Gateway. No real government filing was performed.",
        description="Transparent sandbox explanation"
    )

class TimelineEvent(BaseModel):
    """
    Event item for the unified 7-agent Activity Timeline.
    """
    id: str = Field(..., description="Unique event identifier")
    agent_name: str = Field(..., description="Agent responsible: 'Document Agent', 'Research Agent', 'Workflow Agent', 'Action Agent', 'Human Approver', 'Submission Agent'")
    title: str = Field(..., description="Title of the milestone or action")
    description: str = Field(default="", description="Detailed summary of what was performed")
    status: str = Field(default="completed", description="'completed', 'in_progress', 'pending', 'action_required', 'blocked'")
    timestamp: str = Field(..., description="Time of event occurrence")
    requires_approval: bool = Field(default=False, description="Flag indicating if this step required human approval")

class CivicCase(BaseModel):
    """
    Complete persistent Civic Case object conforming to Day 4 schema.
    """
    case_id: str = Field(..., description="Unique case identifier, e.g. 'CIV-1024'")
    status: str = Field(
        default="draft",
        description="'draft', 'action_prepared', 'pending_approval', 'approved', 'submitted', 'under_review', 'resolved'"
    )
    notice: NoticeStructuredData = Field(..., description="Extracted notice data from Document Agent")
    research: ProcedureResearchData = Field(..., description="Grounded procedure data from Research Agent")
    workflow: WorkflowCase = Field(..., description="Action plan from Workflow Agent")
    application: Optional[ApplicationDocument] = Field(default=None, description="Prepared formal application from Action Agent")
    approval_record: Optional[ApprovalRecord] = Field(default=None, description="Recorded human authorization")
    submission: Optional[SubmissionRecord] = Field(default=None, description="Sandbox submission record")
    timeline: List[TimelineEvent] = Field(default_factory=list, description="Chronological multi-agent timeline")
    created_at: str = Field(..., description="Creation ISO timestamp")
    updated_at: str = Field(..., description="Last modified ISO timestamp")

class CreateCaseRequest(BaseModel):
    """Payload to initialize a persistent case."""
    notice_data: NoticeStructuredData
    research_data: ProcedureResearchData
    workflow_data: WorkflowCase

class ApproveActionRequest(BaseModel):
    """Payload to record human approval for a case action."""
    action_type: str = Field(default="submit_application", description="Action being authorized")
    approved_by: Optional[str] = Field(default="Citizen Operator", description="Name/ID of the human approver")
    notes: Optional[str] = Field(default="", description="Optional approval notes")

class SubmitCaseRequest(BaseModel):
    """Payload to execute sandbox submission (requires approval to be on record)."""
    approval_token: Optional[str] = Field(default=None, description="Optional approval token check")
