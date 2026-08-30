"""
Firestore Service for CivicOps.
Provides persistent cloud storage layer using Google Cloud Firestore with collections for:
- cases
- documents
- workflows
- applications
- status_updates
- users

Enforces clean architectural layering: Agents -> Domain Services -> FirestoreService.
"""

import os
import json
import logging
import datetime
from pathlib import Path
from typing import Dict, Any, List, Optional

from backend.config import GOOGLE_CLOUD_PROJECT, FIRESTORE_DATABASE

logger = logging.getLogger("civicops.firestore_service")

# Local fallback storage path when GCP credentials/project are not active
FALLBACK_DATA_DIR = Path(__file__).resolve().parent.parent.parent / "data"
FALLBACK_DATA_DIR.mkdir(parents=True, exist_ok=True)
FALLBACK_FILE = FALLBACK_DATA_DIR / "firestore_fallback.json"

class FirestoreService:
    """
    Google Cloud Firestore persistence service with offline/mock fallback resilience.
    """

    COLLECTION_CASES = "cases"
    COLLECTION_DOCUMENTS = "documents"
    COLLECTION_WORKFLOWS = "workflows"
    COLLECTION_APPLICATIONS = "applications"
    COLLECTION_STATUS_UPDATES = "status_updates"
    COLLECTION_USERS = "users"

    def __init__(
        self,
        project_id: Optional[str] = None,
        database: Optional[str] = None,
        client: Optional[Any] = None
    ):
        self.project_id = project_id or GOOGLE_CLOUD_PROJECT
        self.database = database or FIRESTORE_DATABASE or "(default)"
        self._client = client
        self._is_connected = False
        self._fallback_store: Dict[str, Dict[str, Any]] = {
            self.COLLECTION_CASES: {},
            self.COLLECTION_DOCUMENTS: {},
            self.COLLECTION_WORKFLOWS: {},
            self.COLLECTION_APPLICATIONS: {},
            self.COLLECTION_STATUS_UPDATES: {},
            self.COLLECTION_USERS: {}
        }
        self._load_fallback_store()
        self._init_client()

    def _init_client(self) -> None:
        """Initializes the official Google Cloud Firestore client if credentials/project are available."""
        if self._client is not None:
            self._is_connected = True
            logger.info("FirestoreService initialized with provided client instance.")
            return

        if not self.project_id:
            logger.info("GOOGLE_CLOUD_PROJECT not set. Running FirestoreService in local fallback mode.")
            return

        try:
            from google.cloud import firestore  # type: ignore
            # Initialize Firestore client according to latest GCP SDK pattern
            if self.database and self.database != "(default)":
                self._client = firestore.Client(project=self.project_id, database=self.database)
            else:
                self._client = firestore.Client(project=self.project_id)
            self._is_connected = True
            logger.info(f"Firestore connected successfully to project '{self.project_id}', database '{self.database}'.")
        except Exception as e:
            logger.warning(f"Could not connect to live Google Cloud Firestore ({e}). Using local fallback store.")
            self._client = None
            self._is_connected = False

    @property
    def is_connected(self) -> bool:
        """Returns True if connected to live Google Cloud Firestore."""
        return self._is_connected and self._client is not None

    def _load_fallback_store(self) -> None:
        """Loads local JSON store for offline/local development."""
        if not FALLBACK_FILE.exists():
            return
        try:
            with open(FALLBACK_FILE, "r", encoding="utf-8") as f:
                data = json.load(f)
                if isinstance(data, dict):
                    for col in self._fallback_store:
                        if col in data:
                            self._fallback_store[col] = data[col]
            logger.debug(f"Loaded fallback store from {FALLBACK_FILE}")
        except Exception as e:
            logger.warning(f"Error loading fallback store: {e}")

    def _persist_fallback_store(self) -> None:
        """Persists memory store to local JSON file."""
        try:
            with open(FALLBACK_FILE, "w", encoding="utf-8") as f:
                json.dump(self._fallback_store, f, indent=2)
        except Exception as e:
            logger.warning(f"Error persisting fallback store: {e}")

    # =========================================================================
    # Cases Collection Operations
    # =========================================================================

    def create_case(self, case_data: Dict[str, Any]) -> Dict[str, Any]:
        """Creates a new case document in Firestore."""
        case_id = case_data.get("case_id")
        if not case_id:
            raise ValueError("case_data must contain a valid 'case_id'.")

        now = datetime.datetime.now().isoformat()
        if "created_at" not in case_data:
            case_data["created_at"] = now
        if "updated_at" not in case_data:
            case_data["updated_at"] = now

        if self.is_connected:
            try:
                doc_ref = self._client.collection(self.COLLECTION_CASES).document(case_id)
                doc_ref.set(case_data)
                logger.info(f"Firestore: Created case {case_id}")
            except Exception as e:
                logger.error(f"Firestore error creating case {case_id}: {e}. Writing to fallback.")
                self._fallback_store[self.COLLECTION_CASES][case_id] = case_data
                self._persist_fallback_store()
        else:
            self._fallback_store[self.COLLECTION_CASES][case_id] = case_data
            self._persist_fallback_store()

        return case_data

    def get_case(self, case_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves a case document by case_id."""
        if self.is_connected:
            try:
                doc_ref = self._client.collection(self.COLLECTION_CASES).document(case_id)
                doc = doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                logger.error(f"Firestore error retrieving case {case_id}: {e}. Reading from fallback.")
                return self._fallback_store[self.COLLECTION_CASES].get(case_id)
        return self._fallback_store[self.COLLECTION_CASES].get(case_id)

    def update_case(self, case_id: str, updates: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """Updates fields in an existing case document."""
        updates["updated_at"] = datetime.datetime.now().isoformat()

        if self.is_connected:
            try:
                doc_ref = self._client.collection(self.COLLECTION_CASES).document(case_id)
                doc_ref.set(updates, merge=True)
                doc = doc_ref.get()
                return doc.to_dict() if doc.exists else None
            except Exception as e:
                logger.error(f"Firestore error updating case {case_id}: {e}. Updating fallback.")
        
        current = self._fallback_store[self.COLLECTION_CASES].get(case_id)
        if current is not None:
            current.update(updates)
            self._fallback_store[self.COLLECTION_CASES][case_id] = current
            self._persist_fallback_store()
            return current
        return None

    def delete_case(self, case_id: str) -> bool:
        """Deletes a case document from Firestore."""
        deleted = False
        if self.is_connected:
            try:
                doc_ref = self._client.collection(self.COLLECTION_CASES).document(case_id)
                doc_ref.delete()
                deleted = True
            except Exception as e:
                logger.error(f"Firestore error deleting case {case_id}: {e}")

        if case_id in self._fallback_store[self.COLLECTION_CASES]:
            del self._fallback_store[self.COLLECTION_CASES][case_id]
            self._persist_fallback_store()
            deleted = True
        return deleted

    def list_cases(self) -> List[Dict[str, Any]]:
        """Lists all registered cases from Firestore."""
        if self.is_connected:
            try:
                cases_ref = self._client.collection(self.COLLECTION_CASES)
                docs = cases_ref.stream()
                results = [doc.to_dict() for doc in docs]
                if results:
                    return results
            except Exception as e:
                logger.error(f"Firestore error listing cases: {e}. Falling back.")
        return list(self._fallback_store[self.COLLECTION_CASES].values())

    # =========================================================================
    # Status Updates Collection Operations
    # =========================================================================

    def add_status_update(self, update_data: Dict[str, Any]) -> Dict[str, Any]:
        """Appends a new status update event to the status_updates collection."""
        update_id = update_data.get("update_id") or f"upd_{int(datetime.datetime.now().timestamp()*1000)}"
        update_data["update_id"] = update_id
        if "timestamp" not in update_data:
            update_data["timestamp"] = datetime.datetime.now().isoformat()

        if self.is_connected:
            try:
                doc_ref = self._client.collection(self.COLLECTION_STATUS_UPDATES).document(update_id)
                doc_ref.set(update_data)
                logger.info(f"Firestore: Recorded status update {update_id} for case {update_data.get('case_id')}")
            except Exception as e:
                logger.error(f"Firestore error saving status update: {e}. Writing to fallback.")
                self._fallback_store[self.COLLECTION_STATUS_UPDATES][update_id] = update_data
                self._persist_fallback_store()
        else:
            self._fallback_store[self.COLLECTION_STATUS_UPDATES][update_id] = update_data
            self._persist_fallback_store()

        return update_data

    def get_status_history(self, case_id: str) -> List[Dict[str, Any]]:
        """Retrieves chronological status updates for a specific case."""
        history: List[Dict[str, Any]] = []

        if self.is_connected:
            try:
                query = self._client.collection(self.COLLECTION_STATUS_UPDATES).where("case_id", "==", case_id)
                docs = query.stream()
                for doc in docs:
                    history.append(doc.to_dict())
            except Exception as e:
                logger.error(f"Firestore error querying status history for {case_id}: {e}. Reading fallback.")
                history = [
                    item for item in self._fallback_store[self.COLLECTION_STATUS_UPDATES].values()
                    if item.get("case_id") == case_id
                ]
        else:
            history = [
                item for item in self._fallback_store[self.COLLECTION_STATUS_UPDATES].values()
                if item.get("case_id") == case_id
            ]

        # Sort chronologically by timestamp
        return sorted(history, key=lambda x: x.get("timestamp", ""))

    # =========================================================================
    # Documents Metadata Collection Operations
    # =========================================================================

    def save_document_metadata(self, doc_data: Dict[str, Any]) -> Dict[str, Any]:
        """Saves document metadata record in Firestore."""
        doc_id = doc_data.get("document_id") or f"doc_{int(datetime.datetime.now().timestamp()*1000)}"
        doc_data["document_id"] = doc_id
        if "uploaded_at" not in doc_data:
            doc_data["uploaded_at"] = datetime.datetime.now().isoformat()

        if self.is_connected:
            try:
                doc_ref = self._client.collection(self.COLLECTION_DOCUMENTS).document(doc_id)
                doc_ref.set(doc_data)
                logger.info(f"Firestore: Saved document metadata {doc_id}")
            except Exception as e:
                logger.error(f"Firestore error saving document metadata: {e}. Writing to fallback.")
                self._fallback_store[self.COLLECTION_DOCUMENTS][doc_id] = doc_data
                self._persist_fallback_store()
        else:
            self._fallback_store[self.COLLECTION_DOCUMENTS][doc_id] = doc_data
            self._persist_fallback_store()

        return doc_data

    def get_document_metadata(self, document_id: str) -> Optional[Dict[str, Any]]:
        """Retrieves document metadata by document ID."""
        if self.is_connected:
            try:
                doc_ref = self._client.collection(self.COLLECTION_DOCUMENTS).document(document_id)
                doc = doc_ref.get()
                if doc.exists:
                    return doc.to_dict()
            except Exception as e:
                logger.error(f"Firestore error retrieving document {document_id}: {e}")
        return self._fallback_store[self.COLLECTION_DOCUMENTS].get(document_id)

    def get_case_documents(self, case_id: str) -> List[Dict[str, Any]]:
        """Retrieves all document records belonging to a specific case."""
        docs_list: List[Dict[str, Any]] = []
        if self.is_connected:
            try:
                query = self._client.collection(self.COLLECTION_DOCUMENTS).where("case_id", "==", case_id)
                docs = query.stream()
                for doc in docs:
                    docs_list.append(doc.to_dict())
            except Exception as e:
                logger.error(f"Firestore error querying documents for case {case_id}: {e}")
                docs_list = [
                    d for d in self._fallback_store[self.COLLECTION_DOCUMENTS].values()
                    if d.get("case_id") == case_id
                ]
        else:
            docs_list = [
                d for d in self._fallback_store[self.COLLECTION_DOCUMENTS].values()
                if d.get("case_id") == case_id
            ]
        return docs_list

# Global singleton
firestore_service = FirestoreService()
