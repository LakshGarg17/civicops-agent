from pydantic import BaseModel, Field
from typing import List, Optional

class ApplicationDocument(BaseModel):
    """
    Formal administrative application/dispute letter structured by the Action Agent.
    Conforms strictly to Day 4 schema.
    """
    to: str = Field(..., description="Target government department, board, or authority")
    subject: str = Field(..., description="Formal subject line of the application")
    property_id: str = Field(default="Not found", description="APN, parcel ID, citation #, or relevant reference")
    reference_number: str = Field(default="Not found", description="Notice reference or citation number")
    reason: str = Field(..., description="Detailed factual justification / grounds for appeal or correction")
    requested_action: str = Field(..., description="Concrete administrative relief or correction requested")
    supporting_documents: List[str] = Field(
        default_factory=list,
        description="List of verified supporting documents provided by the citizen (never fabricated)"
    )
    missing_documents: List[str] = Field(
        default_factory=list,
        description="Required procedural documents that are still pending / missing"
    )
    applicant_name: str = Field(default="Citizen / Property Owner", description="Full legal name of the applicant")
    date: str = Field(..., description="Date of application filing (ISO or formatted string)")
    additional_notes: Optional[str] = Field(default="", description="Statutory references, penalty abatement requests, or instructions")
    status: str = Field(default="draft", description="'draft', 'reviewed', 'approved', 'submitted'")

class ApplicationGenerateRequest(BaseModel):
    """Input payload for generating an application draft."""
    case_id: Optional[str] = Field(default=None, description="Associated case tracking ID")
    applicant_name: Optional[str] = Field(default=None, description="Optional override for applicant name")
    additional_notes: Optional[str] = Field(default="", description="Optional additional context from user")

class ApplicationUpdateRequest(BaseModel):
    """Payload for editing application fields prior to approval."""
    to: Optional[str] = None
    subject: Optional[str] = None
    property_id: Optional[str] = None
    reference_number: Optional[str] = None
    reason: Optional[str] = None
    requested_action: Optional[str] = None
    applicant_name: Optional[str] = None
    additional_notes: Optional[str] = None
