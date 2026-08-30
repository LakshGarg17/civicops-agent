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
    Event item for the unified multi-agent Activity Timeline.
    """
    id: str = Field(..., description="Unique event identifier")
    agent_name: str = Field(..., description="Agent responsible: 'Document Agent', 'Research Agent', 'Workflow Agent', 'Action Agent', 'Monitoring Agent', 'Human Approver', 'Submission Agent'")
    title: str = Field(..., description="Title of the milestone or action")
    description: str = Field(default="", description="Detailed summary of what was performed")
    status: str = Field(default="completed", description="'completed', 'in_progress', 'pending', 'action_required', 'blocked'")
    timestamp: str = Field(..., description="Time of event occurrence")
    requires_approval: bool = Field(default=False, description="Flag indicating if this step required human approval")

class CaseStatusUpdate(BaseModel):
    """
    Persistent record of a case status transition or determination by an external agency/status provider.
    """
    update_id: str = Field(..., description="Unique identifier for status update event")
    case_id: str = Field(..., description="Related Civic Case ID")
    previous_status: str = Field(..., description="Status prior to update")
    new_status: str = Field(..., description="New status after transition")
    message: str = Field(default="", description="Official or explanatory message")
    severity: str = Field(default="info", description="Severity level: 'info', 'low', 'medium', 'high', 'critical'")
    next_action: Optional[str] = Field(default=None, description="Recommended next action if required")
    source: str = Field(default="CivicOps Demo Status Gateway", description="Originating authority or system")
    timestamp: str = Field(..., description="ISO timestamp of status update")

class CaseNotification(BaseModel):
    """
    Citizen-facing actionable alert generated when case status changes or attention is required.
    """
    notification_id: str = Field(..., description="Unique notification identifier")
    case_id: str = Field(..., description="Related Civic Case ID")
    title: str = Field(default="CivicOps Update", description="Notification headline")
    message: str = Field(..., description="Detailed notification message")
    severity: str = Field(default="high", description="'info', 'low', 'medium', 'high'")
    action_label: Optional[str] = Field(default="View Required Action", description="Button call to action")
    action_type: Optional[str] = Field(default="upload_document", description="Type of action required")
    created_at: str = Field(..., description="Creation ISO timestamp")
    unread: bool = Field(default=True, description="Whether notification is unread")

class DocumentMetadata(BaseModel):
    """
    Document metadata stored in Firestore referencing Cloud Storage / local storage paths.
    """
    document_id: str = Field(..., description="Unique document ID, e.g. 'DOC-001'")
    case_id: str = Field(..., description="Related case ID, e.g. 'CIV-2026-001'")
    filename: str = Field(..., description="Original filename uploaded by citizen")
    storage_path: str = Field(..., description="Path in Cloud Storage bucket or local store")
    gcs_uri: Optional[str] = Field(default=None, description="Full gs:// URI if stored in GCS")
    document_type: str = Field(default="government_notice", description="Category: 'government_notice', 'supporting_evidence', 'application_pdf'")
    file_size_bytes: int = Field(default=0, description="File size in bytes")
    content_type: str = Field(default="application/pdf", description="MIME type")
    uploaded_at: str = Field(..., description="ISO timestamp of document upload")

class CivicCase(BaseModel):
    """
    Complete persistent Civic Case object conforming to Day 5 schema.
    """
    case_id: str = Field(..., description="Unique case identifier, e.g. 'CIV-1024'")
    title: Optional[str] = Field(default=None, description="Human readable case title")
    notice_type: Optional[str] = Field(default=None, description="Type of notice, e.g. 'Property Tax Notice'")
    status: str = Field(
        default="draft",
        description="'draft', 'action_prepared', 'pending_approval', 'approved', 'submitted', 'under_review', 'additional_information_required', 'resolved', 'rejected'"
    )
    deadline: Optional[str] = Field(default=None, description="Primary deadline date string")
    notice: NoticeStructuredData = Field(..., description="Extracted notice data from Document Agent")
    research: ProcedureResearchData = Field(..., description="Grounded procedure data from Research Agent")
    workflow: WorkflowCase = Field(..., description="Action plan from Workflow Agent")
    application: Optional[ApplicationDocument] = Field(default=None, description="Prepared formal application from Action Agent")
    approval_record: Optional[ApprovalRecord] = Field(default=None, description="Recorded human authorization")
    submission: Optional[SubmissionRecord] = Field(default=None, description="Sandbox submission record")
    timeline: List[TimelineEvent] = Field(default_factory=list, description="Chronological multi-agent timeline")
    status_history: List[CaseStatusUpdate] = Field(default_factory=list, description="Audit history of status changes")
    unread_notification: Optional[CaseNotification] = Field(default=None, description="Active citizen alert if action required")
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

class DemoStatusChangeRequest(BaseModel):
    """Payload to flip case status in Demo Status Provider."""
    status: str = Field(..., description="Target status, e.g. 'additional_information_required', 'under_review', 'approved'")
    message: Optional[str] = Field(default=None, description="Status update message")
    source: Optional[str] = Field(default="CivicOps Demo Gateway", description="Authority source name")
