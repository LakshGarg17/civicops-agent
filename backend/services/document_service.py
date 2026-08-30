"""
Document Service for CivicOps.
Handles document ingestion, validation, Google Cloud Storage / local storage routing,
Firestore metadata indexing, and DocumentAgent extraction.
"""

import logging
import os
import uuid
from pathlib import Path
from typing import Dict, Any, Tuple, Optional
from fastapi import UploadFile, HTTPException

from backend.config import UPLOAD_DIR, MAX_FILE_SIZE_MB
from backend.agents.document_agent import DocumentAgent
from backend.models.notice import NoticeStructuredData
from backend.models.schemas import UploadResponse
from backend.services.storage_service import storage_service, StorageService

logger = logging.getLogger("civicops.document_service")

ALLOWED_EXTENSIONS = {".pdf", ".jpg", ".jpeg", ".png", ".txt"}
ALLOWED_MIME_TYPES = {
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "text/plain"
}

PROCESSING_STAGES = [
    "Uploading document to Cloud Storage",
    "Indexing metadata in Firestore",
    "Extracting civic information",
    "Identifying notice type & authority",
    "Building notice summary"
]


class DocumentService:
    """
    Service responsible for document ingestion, GCS storage, Firestore metadata tracking,
    validation, and routing to the DocumentAgent.
    """

    def __init__(
        self,
        document_agent: Optional[DocumentAgent] = None,
        storage_svc: Optional[StorageService] = None
    ):
        self.agent = document_agent or DocumentAgent()
        self.storage = storage_svc or storage_service

    def validate_file(self, filename: str, content_type: str = "", file_size: int = 0) -> None:
        """
        Validates file extension, empty status, and maximum allowed file size.
        """
        if not filename:
            raise HTTPException(status_code=400, detail="No filename provided in upload.")

        ext = Path(filename).suffix.lower()
        if ext not in ALLOWED_EXTENSIONS:
            allowed_list = ", ".join(sorted(list(ALLOWED_EXTENSIONS)))
            raise HTTPException(
                status_code=400,
                detail=f"Unsupported file type '{ext}'. Supported types are: {allowed_list}"
            )

        if file_size > MAX_FILE_SIZE_MB * 1024 * 1024:
            raise HTTPException(
                status_code=400,
                detail=f"File size ({file_size / (1024*1024):.1f}MB) exceeds maximum limit of {MAX_FILE_SIZE_MB}MB."
            )

    async def save_uploaded_file(self, upload_file: UploadFile) -> Tuple[str, bytes, Dict[str, Any]]:
        """
        Reads, validates, and uploads file via StorageService (saving to GCS and local disk).
        Returns (local_path_or_storage_path, content_bytes, metadata_dict).
        """
        content_bytes = await upload_file.read()
        if len(content_bytes) == 0:
            raise HTTPException(status_code=400, detail="Uploaded file is empty.")

        self.validate_file(
            filename=upload_file.filename,
            content_type=upload_file.content_type or "",
            file_size=len(content_bytes)
        )

        content_type = upload_file.content_type or self.agent._determine_mime_type(Path(upload_file.filename))

        # Upload via storage service (saves to GCS & writes metadata to Firestore)
        doc_metadata = self.storage.upload_document(
            file_bytes=content_bytes,
            filename=upload_file.filename,
            case_id="incoming_upload",
            document_type="government_notice",
            content_type=content_type
        )

        local_path = doc_metadata.get("local_path") or str(UPLOAD_DIR / upload_file.filename)
        return local_path, content_bytes, doc_metadata

    async def process_upload(self, upload_file: UploadFile) -> UploadResponse:
        """
        Orchestrates full upload pipeline:
        File Read -> StorageService (GCS + Firestore) -> DocumentAgent -> NoticeStructuredData -> UploadResponse.
        """
        target_path, content_bytes, doc_metadata = await self.save_uploaded_file(upload_file)

        try:
            # Invoke DocumentAgent
            extracted_dict = self.agent.process_document(str(target_path))
            notice_data = NoticeStructuredData(**extracted_dict)

            # Plain-language overview for display
            overview_text = (
                f"**Notice Type:** {notice_data.notice_type}\n"
                f"**Authority:** {notice_data.issuing_authority} ({notice_data.department})\n"
                f"**Reference #:** {notice_data.reference_number}\n"
                f"**Amount:** {notice_data.amount}\n"
                f"**Deadline:** {notice_data.deadline}\n\n"
                f"**Core Issue:**\n{notice_data.issue}\n\n"
                f"**Required Action:**\n{notice_data.required_action}"
            )

            return UploadResponse(
                status="success",
                filename=upload_file.filename,
                notice_data=notice_data,
                processing_stages=PROCESSING_STAGES,
                extracted_text=notice_data.issue,
                ai_response=overview_text,
                metadata={
                    "document_id": doc_metadata.get("document_id"),
                    "gcs_uri": doc_metadata.get("gcs_uri"),
                    "storage_path": doc_metadata.get("storage_path"),
                    "file_size_bytes": len(content_bytes),
                    "saved_path": str(target_path),
                    "content_type": doc_metadata.get("content_type")
                }
            )
        except HTTPException:
            raise
        except Exception as e:
            logger.error(f"Error executing DocumentAgent pipeline: {e}", exc_info=True)
            raise HTTPException(
                status_code=422,
                detail="Unable to analyze this document. Please try: a clearer scan, a PDF with selectable text, or a supported image format."
            )


# Global singleton
document_service = DocumentService()

