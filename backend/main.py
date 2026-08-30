import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any, Optional
from fastapi import FastAPI, File, UploadFile, HTTPException, Body, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware

from backend.config import (
    GEMINI_API_KEY,
    GEMINI_MODEL,
    ADK_STATUS,
    GOOGLE_CLOUD_PROJECT,
    GCS_BUCKET,
    CLOUD_TASKS_QUEUE,
    ALLOWED_ORIGINS
)
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
    SubmitCaseRequest,
    DemoStatusChangeRequest,
    CaseStatusUpdate
)
from backend.services.document_service import DocumentService, document_service
from backend.services.research_service import ResearchService, research_service
from backend.services.workflow_service import WorkflowService, workflow_service
from backend.services.case_service import CaseService, case_service
from backend.services.firestore_service import firestore_service
from backend.services.storage_service import storage_service
from backend.services.cloud_tasks_service import cloud_tasks_service
from backend.tools.demo_status_provider import demo_status_provider

logger = logging.getLogger("civicops.main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting CivicOps Backend Service (Cloud Run Production Mode)...")
    logger.info(f"Gemini Model: {GEMINI_MODEL}")
    logger.info(f"Firestore Connected: {firestore_service.is_connected} (Project: {GOOGLE_CLOUD_PROJECT or 'local_fallback'})")
    logger.info(f"Cloud Storage Bucket: {GCS_BUCKET or 'local_disk_mode'}")
    logger.info(f"Allowed CORS Origins: {ALLOWED_ORIGINS}")
    yield
    logger.info("Shutting down CivicOps Backend Service...")

app = FastAPI(
    title="CivicOps API",
    description="Autonomous civic paperwork assistant API (Cloud Run Deployment)",
    version="0.6.0",
    lifespan=lifespan
)

# Enable CORS for frontend development and cloud deployment (Vercel & Localhost)
app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health", response_model=HealthResponse)
async def health_check():
    """Health check endpoint to verify backend status, Gemini readiness, Firestore, GCS, and ADK availability."""
    is_gemini_ready = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")
    return HealthResponse(
        status="ok",
        service="CivicOps Backend",
        gemini_configured=is_gemini_ready,
        adk_status={
            **ADK_STATUS,
            "firestore_connected": firestore_service.is_connected,
            "storage_active": storage_service.is_gcs_active,
            "gcp_project": GOOGLE_CLOUD_PROJECT or "local-development"
        }
    )


@app.post("/upload", response_model=UploadResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def upload_document(file: UploadFile = File(...)):
    """Accepts an uploaded civic document, saves to Cloud Storage, indexes metadata in Firestore, and extracts notice data."""
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")
    return await document_service.process_upload(file)

@app.post("/research", response_model=ResearchResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def research_procedure(request: ResearchRequest):
    """Determines applicable official procedure, authority, required documents, and sources."""
    try:
        return await research_service.execute_research(request.notice_data)
    except Exception as e:
        logger.error(f"Error in /research endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/workflow", response_model=WorkflowResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def create_workflow(request: WorkflowRequest):
    """Diffs documents, sequences tasks, and produces a personalized action plan with Firestore persistence."""
    try:
        res = await workflow_service.generate_workflow(
            document_data=request.document_data,
            research_data=request.research_data,
            user_documents=request.user_documents
        )
        # Automatically persist into Firestore case store
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
# Case Management, Action Agent & Human Approval Endpoints
# ==============================================================================

@app.post("/cases", response_model=CivicCase)
async def create_case(request: CreateCaseRequest):
    """Initializes and persists a complete Civic Case in Firestore."""
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
    """Lists all persistent cases in Firestore."""
    return case_service.list_cases()

@app.get("/cases/{case_id}", response_model=CivicCase, responses={404: {"model": ErrorResponse}})
async def get_case(case_id: str):
    """Retrieves full persistent CivicCase object by ID from Firestore."""
    case = case_service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' was not found.")
    return case

@app.post("/cases/{case_id}/prepare-application", response_model=CivicCase, responses={404: {"model": ErrorResponse}})
async def prepare_application(case_id: str, request: Optional[ApplicationGenerateRequest] = None):
    """
    Action Agent: Prepares the formal administrative dispute/petition application
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
    Human Approval Gate:
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
async def submit_case_application(case_id: str, background_tasks: BackgroundTasks, request: Optional[SubmitCaseRequest] = None):
    """
    Sandbox Submission Execution:
    Executes simulated submission strictly through the CivicOps Demo Gateway.
    REJECTS WITH HTTP 403 FORBIDDEN if explicit human approval has not been granted on the server.
    Upon successful submission, automatically dispatches an async background monitoring task via Cloud Tasks.
    """
    try:
        case = case_service.submit_case(case_id)
        
        # Schedule Cloud Task background check for autonomous monitoring
        cloud_tasks_service.schedule_monitoring_task(case_id=case_id, delay_seconds=5)

        return case
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

# ==============================================================================
# Day 5: Monitoring Agent, Status History, & Async Execution Endpoints
# ==============================================================================

@app.post("/monitor/{case_id}")
async def trigger_case_monitoring(case_id: str):
    """
    Autonomous Monitoring Execution Endpoint:
    Invoked periodically by Google Cloud Tasks or manually by the frontend.
    Runs Monitoring Agent -> Polls Demo Status Provider -> Reasons about transitions ->
    Mutates workflow & injects tasks -> Emits citizen notifications -> Updates Firestore.
    """
    try:
        res = case_service.run_monitoring_cycle(case_id)
        return {
            "status": "success",
            "case_id": case_id,
            "case": res["case"],
            "analysis": res["analysis"]
        }
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        logger.error(f"Error running monitoring cycle for {case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/cases/{case_id}/demo-status")
async def set_demo_gateway_status(case_id: str, request: DemoStatusChangeRequest):
    """
    Demo Status Controller:
    Flips the status in the Demo Status Provider (e.g. to 'additional_information_required', 'approved', 'rejected').
    Immediately runs a monitoring cycle to demonstrate real-time autonomous detection and workflow adaptation.
    """
    try:
        # 1. Update status provider
        updated_status = demo_status_provider.set_status(
            case_id=case_id,
            status=request.status,
            message=request.message,
            source=request.source
        )

        # 2. Run monitoring cycle to let agent detect and respond
        res = case_service.run_monitoring_cycle(case_id)

        return {
            "status": "success",
            "demo_provider_status": updated_status,
            "case": res["case"],
            "analysis": res["analysis"]
        }
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        logger.error(f"Error setting demo status for {case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/cases/{case_id}/history", response_model=List[CaseStatusUpdate])
async def get_case_status_history(case_id: str):
    """Retrieves the chronological audit log of status updates stored in Firestore."""
    return case_service.get_status_history(case_id)

@app.post("/cases/{case_id}/acknowledge-notification", response_model=CivicCase)
async def acknowledge_case_notification(case_id: str):
    """Marks the active in-app citizen notification for the case as read."""
    try:
        return case_service.acknowledge_notification(case_id)
    except KeyError as ke:
        raise HTTPException(status_code=404, detail=str(ke))
    except Exception as e:
        logger.error(f"Error acknowledging notification for {case_id}: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))
