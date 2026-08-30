from pydantic import BaseModel, Field
from typing import List, Optional
from backend.models.notice import NoticeStructuredData

class ProcedureResearchData(BaseModel):
    """
    Structured civic procedure output from ResearchAgent.
    Conforms strictly to the Day 3 schema.
    """
    procedure_name: str = Field(default="Not found", description="Formal title of the applicable civic / administrative procedure")
    authority: str = Field(default="Not found", description="Specific agency, board, or department responsible for administering the procedure")
    submission_method: str = Field(default="Not found", description="How the citizen submits the petition/dispute/application (online portal, mail, in-person)")
    required_documents: List[str] = Field(default_factory=list, description="All required forms, proofs, declarations, and supporting materials")
    steps: List[str] = Field(default_factory=list, description="Sequential procedural steps required to resolve the issue")
    deadline_information: str = Field(default="Not found", description="Statutory deadlines, windows for response, or appeal time limits")
    fees: str = Field(default="Not found", description="Applicable filing fees, penalties, or fee waivers")
    additional_requirements: List[str] = Field(default_factory=list, description="Special rules, notarization, certified mail requirements, or conditions")
    rationale: str = Field(
        default="Applicable administrative procedure identified based on notice classification, issuing authority, and governing municipal/county civic code.",
        description="Clear plain-language explanation of why this procedure is legally applicable to the notice"
    )
    source_information: List[str] = Field(default_factory=list, description="Authoritative municipal codes, portal URLs, or government sources consulted")


class ResearchRequest(BaseModel):
    """Input payload for /research endpoint."""
    notice_data: NoticeStructuredData = Field(..., description="Extracted structured data from Document Agent")

class ResearchResponse(BaseModel):
    """Output payload for /research endpoint."""
    status: str = Field("success", description="Status of the research request")
    research_data: ProcedureResearchData = Field(..., description="Identified procedure and official requirements")
    sources_checked: List[str] = Field(default_factory=list, description="List of authoritative government sources checked")
