"""
End-to-End Critical Path Test for CivicOps Day 5.
Tests the entire lifecycle:
1. Document extraction & notice persistence in Firestore
2. Procedure research & personalized workflow creation
3. Action Agent preparation of formal administrative petition
4. Server-side human approval authorization gate
5. Sandbox gateway submission & Cloud Task dispatch
6. Initial monitoring cycle (status unchanged)
7. Status provider flip to ADDITIONAL_INFORMATION_REQUIRED
8. Autonomous Monitoring Agent detection & reasoning
9. Automatic workflow task injection ('Upload ownership proof')
10. Citizen in-app alert notification & Firestore timeline audit trail.
"""

import pytest
from fastapi.testclient import TestClient

from backend.main import app
from backend.services.case_service import case_service
from backend.services.firestore_service import firestore_service
from backend.tools.demo_status_provider import demo_status_provider

client = TestClient(app)

@pytest.fixture(autouse=True)
def clean_test_environment():
    """Cleans up Firestore fallback store and resets demo status provider between tests."""
    for col in firestore_service._fallback_store:
        firestore_service._fallback_store[col] = {}
    demo_status_provider._case_statuses = {}
    yield

def test_full_autonomous_case_lifecycle():
    """
    Executes and verifies the complete end-to-end autonomous flow.
    """
    case_id = "CIV-2026-001"

    # Step 1: Create Case in Firestore
    notice_data = {
        "notice_type": "Property Tax Assessment Notice",
        "issuing_authority": "Travis County Appraisal District",
        "department": "Appraisal Review Board",
        "reference_number": "PROP-94021-TX",
        "citizen_name": "Marcus Aurelius",
        "property_id": "94021-TX",
        "amount": "$4,850.00",
        "issue": "Erroneous square footage valuation increase",
        "deadline": "2026-09-15",
        "required_action": "File Notice of Protest Form 50-132",
        "mentioned_documents": ["Property Tax Statement", "Recorded Deed"]
    }
    research_data = {
        "procedure_name": "Property Tax Valuation Protest",
        "authority": "Travis County Appraisal Review Board",
        "submission_method": "Online Portal",
        "required_documents": ["Property Tax Notice", "Recorded Deed", "Recent Appraisal"],
        "steps": [
            "Submit Notice of Protest",
            "Attend Informal Review",
            "Receive ARB Determination"
        ],
        "deadline_information": "2026-09-15",
        "fees": "$0.00",
        "additional_requirements": [],
        "source_information": ["Texas Tax Code § 41.41"]
    }
    workflow_data = {
        "case_id": case_id,
        "goal": "Dispute Property Tax Overvaluation",
        "priority": "high",
        "deadline": "2026-09-15",
        "tasks": [
            {
                "id": "task_1",
                "title": "Review Document Inventory",
                "description": "Verify property tax notice details and recorded deed.",
                "category": "review",
                "status": "completed",
                "requires_user": False
            },
            {
                "id": "task_2",
                "title": "Draft Protest Application",
                "description": "Prepare formal petition to Appraisal Review Board.",
                "category": "procedural",
                "status": "pending",
                "requires_user": False
            }
        ],
        "missing_documents": ["Recorded Deed"],
        "matched_documents": ["Property Tax Notice"]
    }

    # Initialize case via API
    resp = client.post("/cases", json={
        "notice_data": notice_data,
        "research_data": research_data,
        "workflow_data": workflow_data
    })
    assert resp.status_code == 200, resp.text
    case_res = resp.json()
    assert case_res["case_id"] == case_id
    assert case_res["status"] == "draft"

    # Step 2: Prepare Application (Action Agent)
    resp = client.post(f"/cases/{case_id}/prepare-application", json={
        "applicant_name": "Marcus Aurelius",
        "additional_notes": "Valuation includes non-existent detached garage."
    })
    assert resp.status_code == 200
    case_res = resp.json()
    assert case_res["status"] == "action_prepared"
    assert case_res["application"] is not None
    assert case_res["application"]["to"] == "Travis County Appraisal Review Board"

    # Step 3: Server-side Human Approval Gate Enforcement
    # Verify unapproved submission is blocked with 403
    unapproved_sub = client.post(f"/cases/{case_id}/submit")
    assert unapproved_sub.status_code == 403

    # Grant explicit human authorization
    resp = client.post(f"/cases/{case_id}/approve", json={
        "action_type": "submit_application",
        "approved_by": "Marcus Aurelius",
        "notes": "Reviewed petition and confirmed grounds for protest."
    })
    assert resp.status_code == 200
    case_res = resp.json()
    assert case_res["status"] == "approved"
    assert case_res["approval_record"]["approved"] is True

    # Step 4: Execute Submission to Sandbox Gateway
    resp = client.post(f"/cases/{case_id}/submit")
    assert resp.status_code == 200
    case_res = resp.json()
    assert case_res["status"] == "submitted"
    assert case_res["submission"] is not None
    assert case_res["submission"]["is_sandbox"] is True
    assert "DEMO-SUB-" in case_res["submission"]["confirmation_number"]

    # Step 5: Initial Monitoring Cycle (Status remains submitted / under_review)
    resp = client.post(f"/monitor/{case_id}")
    assert resp.status_code == 200
    mon_res = resp.json()
    assert mon_res["analysis"]["change_detected"] is False

    # Step 6: Trigger State Change in Demo Gateway
    # Agency determination: additional_information_required
    resp = client.post(f"/cases/{case_id}/demo-status", json={
        "status": "additional_information_required",
        "message": "Official notice: Additional ownership documentation (Recorded Deed or Title Certificate) is required."
    })
    assert resp.status_code == 200
    demo_res = resp.json()
    assert demo_res["case"]["status"] == "additional_information_required"
    assert demo_res["analysis"]["change_detected"] is True
    assert demo_res["analysis"]["severity"] in ("high", "medium")

    # Step 7: Verify Workflow Mutation & In-App Notification in Firestore
    updated_case = client.get(f"/cases/{case_id}").json()
    assert updated_case["status"] == "additional_information_required"

    # Verify new task was dynamically inserted into Workflow
    tasks = updated_case["workflow"]["tasks"]
    task_titles = [t["title"].lower() for t in tasks]
    assert any("ownership" in t or "upload" in t for t in task_titles)

    # Verify in-app citizen notification is present and unread
    assert updated_case["unread_notification"] is not None
    assert updated_case["unread_notification"]["unread"] is True
    assert "additional" in updated_case["unread_notification"]["message"].lower() or "ownership" in updated_case["unread_notification"]["message"].lower()

    # Step 8: Verify Status History in Firestore
    hist_resp = client.get(f"/cases/{case_id}/history")
    assert hist_resp.status_code == 200
    history = hist_resp.json()
    assert len(history) >= 2
    assert any(h["new_status"] == "additional_information_required" for h in history)

    # Step 9: Acknowledge Notification
    ack_resp = client.post(f"/cases/{case_id}/acknowledge-notification")
    assert ack_resp.status_code == 200
    assert ack_resp.json()["unread_notification"]["unread"] is False
