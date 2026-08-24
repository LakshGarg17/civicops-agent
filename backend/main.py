import io
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from backend.config import GEMINI_API_KEY, GEMINI_MODEL, ADK_STATUS
from backend.models.schemas import UploadResponse, ErrorResponse, HealthResponse
from backend.services.gemini_service import GeminiService

logger = logging.getLogger("civicops.main")

# Initialize Gemini Service
gemini_service = GeminiService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Starting CivicOps Backend Service...")
    logger.info(f"Gemini Model configured: {GEMINI_MODEL}")
    logger.info(f"ADK Status: {ADK_STATUS['message']}")
    yield
    logger.info("Shutting down CivicOps Backend Service...")

app = FastAPI(
    title="CivicOps API",
    description="Autonomous civic paperwork assistant API (Day 1 Skeleton)",
    version="0.1.0",
    lifespan=lifespan
)

# Enable CORS for frontend development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def extract_text_from_file(file_bytes: bytes, filename: str) -> str:
    """
    Extracts raw text from uploaded .txt or .pdf files.
    """
    filename_lower = filename.lower()
    if filename_lower.endswith(".pdf"):
        try:
            from pypdf import PdfReader
            reader = PdfReader(io.BytesIO(file_bytes))
            pages_text = []
            for idx, page in enumerate(reader.pages):
                text = page.extract_text()
                if text:
                    pages_text.append(text)
            extracted = "\n".join(pages_text).strip()
            if not extracted:
                raise ValueError("PDF contains no extractable text (it might be a scanned image).")
            return extracted
        except ImportError:
            logger.warning("pypdf is not installed. Falling back to latin-1 text decoding.")
            return file_bytes.decode("latin-1", errors="replace")
        except Exception as e:
            logger.error(f"Error reading PDF {filename}: {e}")
            raise HTTPException(status_code=400, detail=f"Failed to read PDF document: {str(e)}")
    else:
        # Default text decoding with UTF-8 fallback
        try:
            return file_bytes.decode("utf-8")
        except UnicodeDecodeError:
            return file_bytes.decode("latin-1", errors="replace")

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
    Accepts a government notice / document, extracts raw text, and generates a plain-language explanation with next steps via Gemini.
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="No filename provided in upload.")

    try:
        content_bytes = await file.read()
        if len(content_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        extracted_text = extract_text_from_file(content_bytes, file.filename)
        
        system_prompt = (
            "You are CivicOps, an expert civic assistant. Analyze this government notice or paperwork. "
            "Provide a clear, plain-language summary addressing:\n"
            "1. **What is this notice about?** (Plain English explanation without legal jargon)\n"
            "2. **Critical Deadlines & Amounts** (Due dates, fees, penalties if applicable)\n"
            "3. **Recommended Next Steps** (Actionable bullet points for the citizen)\n"
            "4. **Required Documents/Items** (What they need to gather)\n"
            "Keep the tone empathetic, concise, and structured."
        )

        ai_response = gemini_service.generate_response(prompt=system_prompt, document_text=extracted_text)

        return UploadResponse(
            status="success",
            filename=file.filename,
            extracted_text=extracted_text,
            ai_response=ai_response,
            metadata={
                "file_size_bytes": len(content_bytes),
                "char_count": len(extracted_text),
                "content_type": file.content_type
            }
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error processing document upload: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Failed to process document: {str(e)}")
