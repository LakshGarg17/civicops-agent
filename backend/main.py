import logging
from contextlib import asynccontextmanager
from typing import List, Dict, Any
from fastapi import FastAPI, File, UploadFile, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from backend.config import GEMINI_API_KEY, GEMINI_MODEL, ADK_STATUS
from backend.models.schemas import UploadResponse, ErrorResponse, HealthResponse
from backend.models.notice import NoticeStructuredData
from backend.models.research import ResearchRequest, ResearchResponse, ProcedureResearchData
from backend.models.workflow import WorkflowRequest, WorkflowResponse, WorkflowCase
from backend.services.document_service import DocumentService
from backend.services.research_service import ResearchService
from backend.services.workflow_service import WorkflowService

logger = logging.getLogger("civicops.main")

# Initialize Domain Services
document_service = DocumentService()
research_service = ResearchService()
workflow_service = WorkflowService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting CivicOps Backend Service (Day 3: Research Agent + Workflow Agent)...")
    logger.info(f"Gemini Model configured: {GEMINI_MODEL}")
    logger.info(f"ADK Status: {ADK_STATUS['message']}")
    yield
    logger.info("Shutting down CivicOps Backend Service...")

app = FastAPI(
    title="CivicOps API",
    description="Autonomous civic paperwork assistant API (Day 3: Document, Research, and Workflow Agents)",
    version="0.3.0",
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
    """
    Health check endpoint to verify backend status, Gemini readiness, and ADK availability.
    """
    is_gemini_ready = bool(GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here")
    return HealthResponse(
        status="ok",
        service="CivicOps Backend",
        gemini_configured=is_gemini_ready,
        adk_status=ADK_STATUS
    )

@app.post("/upload", response_model=UploadResponse, responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}})
async def upload_document(file: UploadFile = File(...)):
    """
    Accepts an uploaded civic document (PDF, JPG, PNG, TXT), validates it,
    stores it locally, and runs the DocumentAgent to extract structured notice JSON.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")

    return await document_service.process_upload(file)

@app.post(
    "/research",
    response_model=ResearchResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def research_procedure(request: ResearchRequest):
    """
    Day 3: Research Agent endpoint.
    Determines applicable official procedure, responsible authority, required documents,
    steps, submission methods, and authoritative sources based on Document Agent output.
    """
    try:
        return await research_service.execute_research(request.notice_data)
    except Exception as e:
        logger.error(f"Error in /research endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.post(
    "/workflow",
    response_model=WorkflowResponse,
    responses={400: {"model": ErrorResponse}, 500: {"model": ErrorResponse}}
)
async def create_workflow(request: WorkflowRequest):
    """
    Day 3: Workflow Agent endpoint.
    Diffs required documents against user's available documents, creates upload tasks
    for missing items, sequences procedural steps, and generates a personalized action plan.
    """
    try:
        return await workflow_service.generate_workflow(
            document_data=request.document_data,
            research_data=request.research_data,
            user_documents=request.user_documents
        )
    except Exception as e:
        logger.error(f"Error in /workflow endpoint: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

@app.get(
    "/cases/{case_id}",
    response_model=WorkflowCase,
    responses={404: {"model": ErrorResponse}}
)
async def get_case(case_id: str):
    """
    Day 3: Retrieves a stored personalized action plan case by case_id from the in-memory store.
    """
    case = workflow_service.get_case(case_id)
    if not case:
        raise HTTPException(status_code=404, detail=f"Case with ID '{case_id}' was not found.")
    return case
