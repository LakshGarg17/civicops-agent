import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Body, status
from fastapi.middleware.cors import CORSMiddleware
from backend.config import GEMINI_API_KEY, GEMINI_MODEL, ADK_STATUS
from backend.models.schemas import UploadResponse, ErrorResponse, HealthResponse
from backend.models.notice import NoticeStructuredData
from backend.models.research import ResearchRequest, ResearchResponse, ProcedureResearchData
from backend.models.workflow import WorkflowRequest, WorkflowResponse, WorkflowCase
from backend.models.application import (
    ApplicationDocument,
    ApplicationGenerateRequest,
    ApplicationUpdateRequest
)
from backend.models.case import (
    CivicCase,
    CreateCaseRequest,
    ApproveActionRequest,
    SubmitCaseRequest
)
from backend.services.document_service import DocumentService
from backend.services.research_service import ResearchService
from backend.services.workflow_service import WorkflowService
from backend.services.case_service import CaseService

logger = logging.getLogger("civicops.main")

# Initialize Domain Services
document_service = DocumentService()
research_service = ResearchService()
workflow_service = WorkflowService()
case_service = CaseService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting CivicOps Backend Service (Day 4: Action Agent + Human Approval Gate)...")
    logger.info(f"Gemini Model configured: {GEMINI_MODEL}")
    logger.info(f"ADK Status: {ADK_STATUS['message']}")
    yield
    logger.info("Shutting down CivicOps Backend Service...")

app = FastAPI(
    title="CivicOps API",
    description="Autonomous civic paperwork assistant API (Day 4: Action Agent, Application Generator & Human Approval)",
    version="0.4.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify backend status, Gemini readiness, and ADK availability."""
    is_gemini_ready = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")
    return HealthResponse(
        status="ok",
        service="CivicOps Backend",
        gemini_configured=is_gemini_ready,
        adk_status=ADK_STATUS
    )

@app.post("/upload", response_model=UploadResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def upload_document(file: UploadFile = File(...)):
    """Accepts an uploaded civic document, validates it, and extracts structured notice JSON."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")
    return await document_service.process_upload(file)

@app.post("/research", response_model=ResearchResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def research_procedure(request: ResearchRequest):
    """Day 3: Determines applicable official procedure, authority, required documents, and sources."""
    try:
        return await research_service.execute_research(request.notice_data)
    except Exception as e:
        logger.error(f"Error in /research endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflow", response_model=WorkflowResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def create_workflow(request: WorkflowRequest):
    """Day 3: Diffs documents, sequences tasks, and produces a personalized action plan."""
    try:
        res = await workflow_service.generate_workflow(
            document_data=request.document_data,
            research_data=request.research_data,
            user_documents=request.user_documents
        )
        # Also persist into case service automatically
        case_service.create_case(
            notice=request.document_data,
            research=request.research_data,
            workflow=res.workflow
        )
        return res
    except Exception as e:
        logger.error(f"Error in /workflow endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# ==============================================================================
# Day 4: Case Management, Action Agent & Human Approval Endpoints
# ==============================================================================

@app.post("/cases", response_model=CivicCase)
async def create_case(request: CreateCaseRequest):
    """Initializes and persists a complete Civic Case."""
    try:
        return case_service.create_case(
            notice=request.notice_data,
            research=request.research_data,
            workflow=request.workflow_data
        )
    except Exception as e:
        logger.error(f"Error creating case: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cases", response_model=List[CivicCase])
async def list_cases():
    """Lists all persistent cases in storage."""
    return case_service.list_cases()

@app.get("/cases/{case_id}", response_model=CivicCase, responses={404: {"model": ErrorResponse}})
async def get_case(case_id: str):
    """Retrieves full persistent CivicCase object by ID."""
    case = case_service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' was not found.")
    return case

@app.post("/cases/{case_id}/prepare-application", response_model=CivicCase, responses={404: {"model": ErrorResponse}})
async def prepare_application(case_id: str, request: Optional[ApplicationGenerateRequest] = None):
    """
    Day 4 Action Agent: Prepares the formal administrative dispute/petition application
    based on notice, research, and citizen document inventory.
    """
    try:
        req_name = request.applicant_name if request else None
        req_notes = request.additional_notes if request else ""
        return case_service.prepare_application(
            case_id=case_id,
            applicant_name=req_name,
            additional_notes=req_notes
        )
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        logger.error(f"Error in prepare-application: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/cases/{case_id}/application", response_model=CivicCase, responses={404: {"model": ErrorResponse}})
async def update_application(case_id: str, request: ApplicationUpdateRequest):
    """Allows citizen to edit and save updated application fields prior to approval."""
    try:
        return case_service.update_application(case_id, request)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        logger.error(f"Error in update_application: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cases/{case_id}/approve", response_model=CivicCase, responses={404: {"model": ErrorResponse}})
async def approve_case_action(case_id: str, request: ApproveActionRequest):
    """
    Day 4 Human Approval Gate:
    Records verified human authorization for consequential action (e.g. submit_application).
    """
    try:
        return case_service.approve_action(
            case_id=case_id,
            action_type=request.action_type,
            approved_by=request.approved_by or "Citizen Operator",
            notes=request.notes or ""
        )
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        logger.error(f"Error approving action: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cases/{case_id}/submit", response_model=CivicCase, responses={403: {"model": ErrorResponse}, 404: {"model": ErrorResponse}})
async def submit_case_application(case_id: str, request: Optional[SubmitCaseRequest] = None):
    """
    Day 4 Sandbox Submission Execution:
    Executes simulated submission strictly through the CivicOps Demo Gateway.
    REJECTS WITH HTTP 403 FORBIDDEN if explicit human approval has not been granted on the server.
    """
    try:
        return case_service.submit_case(case_id)
    except PermissionError as pe:
        logger.warning(f"Submission rejected for {case_id}: {pe}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(pe)
        )
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))
    except Exception as e:
        logger.error(f"Error submitting case: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
