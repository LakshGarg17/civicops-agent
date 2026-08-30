"""
Tests for FirestoreService.
Verifies CRUD operations for cases, document metadata, and status history records.
"""

import pytest
import datetime
from backend.services.firestore_service import FirestoreService

@pytest.fixture
def firestore_svc():
    """Provides an isolated FirestoreService instance with an empty fallback store."""
    svc = FirestoreService()
    # Reset fallback store for test isolation
    for col in svc._fallback_store:
        svc._fallback_store[col] = {}
    return svc

def test_case_crud_operations(firestore_svc):
    """Test create, read, update, list, and delete operations for cases."""
    case_id = "CIV-TEST-1001"
    case_payload = {
        "case_id": case_id,
        "title": "Property Tax Correction",
        "notice_type": "Property Tax Notice",
        "status": "draft",
        "deadline": "2026-10-15",
        "notice": {
            "notice_type": "Property Tax Notice",
            "issuing_authority": "Travis County",
            "department": "Tax Collector",
            "reference_number": "TX-9901",
            "citizen_name": "Jane Doe",
            "property_id": "P-100",
            "amount": "$2,500.00",
            "issue": "Overassessment error",
            "deadline": "2026-10-15",
            "required_action": "File correction petition",
            "mentioned_documents": ["Deed"]
        },
        "research": {
            "procedure_name": "Property Tax Valuation Dispute",
            "authority": "Travis County Appraisal District",
            "department": "Appraisal Review Board",
            "jurisdiction": "Travis County, TX",
            "dispute_mechanism": "Form 50-132 Notice of Protest",
            "statutory_deadline": "May 15 or 30 days after notice",
            "estimated_fee": "$0.00",
            "submission_channels": ["Online Portal", "Mail"],
            "required_documents": ["Property Tax Notice", "Recorded Deed"],
            "procedure_steps": ["Submit Protest", "Attend Informal Meeting"],
            "official_portal_url": "https://traviscad.org",
            "source_information": "Texas Property Tax Code Section 41.41"
        },
        "workflow": {
            "case_id": case_id,
            "goal": "Submit Valuation Dispute",
            "priority": "high",
            "deadline": "2026-10-15",
            "tasks": [],
            "missing_documents": [],
            "matched_documents": []
        }
    }

    # 1. Create Case
    created = firestore_svc.create_case(case_payload)
    assert created["case_id"] == case_id
    assert "created_at" in created

    # 2. Get Case
    retrieved = firestore_svc.get_case(case_id)
    assert retrieved is not None
    assert retrieved["case_id"] == case_id
    assert retrieved["status"] == "draft"

    # 3. Update Case
    updated = firestore_svc.update_case(case_id, {"status": "action_prepared"})
    assert updated is not None
    assert updated["status"] == "action_prepared"

    # 4. List Cases
    all_cases = firestore_svc.list_cases()
    assert len(all_cases) >= 1
    assert any(c["case_id"] == case_id for c in all_cases)

    # 5. Delete Case
    deleted = firestore_svc.delete_case(case_id)
    assert deleted is True
    assert firestore_svc.get_case(case_id) is None

def test_document_metadata_storage(firestore_svc):
    """Test saving and retrieving document metadata from Firestore."""
    doc_payload = {
        "document_id": "DOC-9901",
        "case_id": "CIV-TEST-1001",
        "filename": "property_tax_notice.pdf",
        "storage_path": "cases/CIV-TEST-1001/DOC-9901_property_tax_notice.pdf",
        "gcs_uri": "gs://civicops-bucket/cases/CIV-TEST-1001/DOC-9901_property_tax_notice.pdf",
        "document_type": "government_notice",
        "file_size_bytes": 1048576,
        "content_type": "application/pdf"
    }

    saved = firestore_svc.save_document_metadata(doc_payload)
    assert saved["document_id"] == "DOC-9901"
    assert "uploaded_at" in saved

    retrieved = firestore_svc.get_document_metadata("DOC-9901")
    assert retrieved is not None
    assert retrieved["filename"] == "property_tax_notice.pdf"

    case_docs = firestore_svc.get_case_documents("CIV-TEST-1001")
    assert len(case_docs) == 1
    assert case_docs[0]["document_id"] == "DOC-9901"

def test_status_updates_history(firestore_svc):
    """Test logging and retrieving status update audit records."""
    case_id = "CIV-TEST-1001"

    update_1 = {
        "update_id": "upd_01",
        "case_id": case_id,
        "previous_status": "approved",
        "new_status": "submitted",
        "message": "Filing submitted to Demo Gateway.",
        "severity": "info",
        "timestamp": "2026-08-30T10:00:00Z"
    }
    update_2 = {
        "update_id": "upd_02",
        "case_id": case_id,
        "previous_status": "submitted",
        "new_status": "additional_information_required",
        "message": "Board requests proof of title.",
        "severity": "high",
        "next_action": "Upload ownership proof",
        "timestamp": "2026-08-30T11:00:00Z"
    }

    firestore_svc.add_status_update(update_1)
    firestore_svc.add_status_update(update_2)

    history = firestore_svc.get_status_history(case_id)
    assert len(history) == 2
    assert history[0]["update_id"] == "upd_01"
    assert history[1]["update_id"] == "upd_02"
    assert history[1]["new_status"] == "additional_information_required"
