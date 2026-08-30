"""
Google Cloud Storage Service for CivicOps.
Handles document upload to GCS buckets with local disk fallback, generating structured metadata
indexed in Cloud Firestore.
"""

import os
import uuid
import logging
import datetime
from pathlib import Path
from typing import Dict, Any, Optional, Tuple

from backend.config import GCS_BUCKET, GOOGLE_CLOUD_PROJECT, UPLOAD_DIR
from backend.services.firestore_service import firestore_service, FirestoreService

logger = logging.getLogger("civicops.storage_service")

class StorageService:
    """
    Service managing document storage in Google Cloud Storage and local storage fallback.
    """

    def __init__(
        self,
        bucket_name: Optional[str] = None,
        project_id: Optional[str] = None,
        firestore_svc: Optional[FirestoreService] = None,
        client: Optional[Any] = None
    ):
        self.bucket_name = bucket_name or GCS_BUCKET
        self.project_id = project_id or GOOGLE_CLOUD_PROJECT
        self.firestore = firestore_svc or firestore_service
        self._client = client
        self._is_gcs_available = False
        self._init_client()

    def _init_client(self) -> None:
        """Initializes the official Google Cloud Storage client if available."""
        if self._client is not None:
            self._is_gcs_available = True
            return

        if not self.bucket_name:
            logger.info("GCS_BUCKET not configured. Running StorageService in local disk mode.")
            return

        try:
            from google.cloud import storage  # type: ignore
            if self.project_id:
                self._client = storage.Client(project=self.project_id)
            else:
                self._client = storage.Client()
            self._is_gcs_available = True
            logger.info(f"Google Cloud Storage connected. Bucket: '{self.bucket_name}'.")
        except Exception as e:
            logger.warning(f"Could not connect to Google Cloud Storage ({e}). Falling back to local disk storage.")
            self._client = None
            self._is_gcs_available = False

    @property
    def is_gcs_active(self) -> bool:
        """Returns True if live Google Cloud Storage bucket is connected."""
        return self._is_gcs_available and self._client is not None and bool(self.bucket_name)

    def upload_document(
        self,
        file_bytes: bytes,
        filename: str,
        case_id: str = "general",
        document_type: str = "government_notice",
        content_type: str = "application/pdf"
    ) -> Dict[str, Any]:
        """
        Uploads document to GCS (or local disk fallback) and registers metadata in Firestore.
        """
        doc_id = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        clean_filename = Path(filename).name.replace(" ", "_")
        now_str = datetime.datetime.now().isoformat()
        storage_path = f"cases/{case_id}/{doc_id}_{clean_filename}"
        gcs_uri = None
        local_saved_path = None

        # 1. Attempt GCS Upload
        if self.is_gcs_active:
            try:
                bucket = self._client.bucket(self.bucket_name)
                blob = bucket.blob(storage_path)
                blob.upload_from_string(file_bytes, content_type=content_type)
                gcs_uri = f"gs://{self.bucket_name}/{storage_path}"
                logger.info(f"Uploaded file to GCS: {gcs_uri}")
            except Exception as e:
                logger.error(f"GCS upload failed ({e}). Saving to local disk.")
                gcs_uri = None

        # 2. Always persist a local reference for local processing / fallback
        local_file_path = UPLOAD_DIR / f"{doc_id}_{clean_filename}"
        try:
            with open(local_file_path, "wb") as f:
                f.write(file_bytes)
            local_saved_path = str(local_file_path)
        except Exception as e:
            logger.error(f"Failed to write local copy: {e}")

        # 3. Create Document Metadata Record
        metadata = {
            "document_id": doc_id,
            "case_id": case_id,
            "filename": filename,
            "storage_path": storage_path,
            "gcs_uri": gcs_uri or f"local://{local_saved_path}",
            "local_path": local_saved_path,
            "document_type": document_type,
            "file_size_bytes": len(file_bytes),
            "content_type": content_type,
            "uploaded_at": now_str
        }

        # 4. Save metadata to Firestore documents collection
        self.firestore.save_document_metadata(metadata)

        return metadata

    def get_document_bytes(self, document_id: str) -> Optional[bytes]:
        """Retrieves raw document bytes given a document ID."""
        doc_meta = self.firestore.get_document_metadata(document_id)
        if not doc_meta:
            return None

        # Check GCS first if active
        if self.is_gcs_active and doc_meta.get("gcs_uri", "").startswith("gs://"):
            try:
                bucket = self._client.bucket(self.bucket_name)
                blob = bucket.blob(doc_meta["storage_path"])
                return blob.download_as_bytes()
            except Exception as e:
                logger.warning(f"Failed to read from GCS blob: {e}")

        # Check local path
        local_path = doc_meta.get("local_path")
        if local_path and Path(local_path).exists():
            with open(local_path, "rb") as f:
                return f.read()

        return None

# Global singleton
storage_service = StorageService()
