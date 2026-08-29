import pytest
from fastapi.testclient import TestClient
from backend.main import app
from backend.services.case_service import CaseService
from backend.models.notice import NoticeStructuredData
from backend.models.research import ProcedureResearchData
from backend.models.workflow import WorkflowCase, WorkflowTask

client = TestClient(app)

@pytest.fixture
def setup_test_case():
    """Initializes a clean case for approval and submission testing."""
    case_service = CaseService()

    notice = NoticeStructuredData(
        notice_type="Property Tax Delinquency Notice",
        issuing_authority="County of Kings",
        department="Office of the Tax Collector",
        reference_number="APN-4920-038-012",
        citizen_name="Jane Doe",
        property_id="Parcel 4920-038-012",
        amount="$4,911.25",
        issue="Unpaid property tax installment",
        deadline="November 30, 2024",
        required_action="Pay online or submit Dispute Form TC-409",
        mentioned_documents=["Dispute Form TC-409"]
    )

    research = ProcedureResearchData(
        procedure_name="Property Tax Delinquency & Assessment Dispute",
        authority="County Office of the Tax Collector",
        submission_method="County Tax Portal Online Submission",
        required_documents=["Dispute Form TC-409", "Proof of Prior Payment"],
        steps=["Complete Form", "Submit via portal"],
        deadline_information="November 30, 2024",
        fees="$0 filing fee",
        additional_requirements=[],
        source_information=["kingscounty.gov/taxes"]
    )

    workflow = WorkflowCase(
        case_id="CIV-TEST-4001",
        goal="Resolve Property Tax Delinquency",
        priority="high",
        deadline="November 30, 2024",
        tasks=[
            WorkflowTask(id="task_1", title="Prepare formal application", status="pending", requires_user=False),
            WorkflowTask(id="task_2", title="Submit application to Tax Collector", status="pending", requires_user=True)
        ],
        missing_documents=["Proof of Prior Payment"],
        matched_documents=["Dispute Form TC-409"]
    )

    case = case_service.create_case(notice, research, workflow)
    return case

def test_unapproved_submission_is_rejected(setup_test_case):
    """
    CRITICAL HUMAN-IN-THE-LOOP APPROVAL TEST:
    Attempting to submit an application without recorded approval MUST be rejected (HTTP 403 Forbidden).
    """
    case_id = setup_test_case.case_id

    # 1. Prepare application first
    prep_res = client.post(f"/cases/{case_id}/prepare-application")
    assert prep_res.status_code == 200
    case_data = prep_res.json()
    assert case_data["application"] is not None
    assert case_data["approval_record"] is None

    # 2. Attempt submission without approval -> MUST FAIL WITH 403 FORBIDDEN
    submit_res = client.post(f"/cases/{case_id}/submit")
    assert submit_res.status_code == 403
    err_body = submit_res.json()
    assert "human approval" in err_body["detail"].lower()

def test_approved_submission_succeeds(setup_test_case):
    """
    Test complete lifecycle:
    Prepare -> User Edits -> Human Approves -> Submit -> Returns Sandbox Receipt
    """
    case_id = setup_test_case.case_id

    # 1. Prepare Application
    prep_res = client.post(f"/cases/{case_id}/prepare-application")
    assert prep_res.status_code == 200

    # 2. Citizen Edits Application (e.g. adjusts reason or applicant name)
    edit_payload = {
        "applicant_name": "Jane M. Doe",
        "additional_notes": "Expedited review requested due to imminent assessment deadline."
    }
    edit_res = client.put(f"/cases/{case_id}/application", json=edit_payload)
    assert edit_res.status_code == 200
    assert edit_res.json()["application"]["applicant_name"] == "Jane M. Doe"

    # 3. Explicit Human Approval
    approval_payload = {
        "action_type": "submit_application",
        "approved_by": "Jane M. Doe (Citizen)",
        "notes": "Reviewed and confirmed all details."
    }
    approve_res = client.post(f"/cases/{case_id}/approve", json=approval_payload)
    assert approve_res.status_code == 200
    approved_case = approve_res.json()
    assert approved_case["status"] == "approved"
    assert approved_case["approval_record"]["approved"] is True

    # 4. Submit Application to Sandbox Demo Gateway -> SUCCEEDS
    submit_res = client.post(f"/cases/{case_id}/submit")
    assert submit_res.status_code == 200
    final_case = submit_res.json()

    assert final_case["status"] == "submitted"
    assert final_case["submission"] is not None
    assert final_case["submission"]["is_sandbox"] is True
    assert "DEMO-SUB-" in final_case["submission"]["confirmation_number"]
    assert final_case["submission"]["submission_method"] == "CivicOps Demo Gateway"

    # 5. Verify Timeline contains all events
    timeline = final_case["timeline"]
    agent_names = [evt["agent_name"] for evt in timeline]
    assert "Document Agent" in agent_names
    assert "Research Agent" in agent_names
    assert "Workflow Agent" in agent_names
    assert "Action Agent" in agent_names
    assert "Human Approver" in agent_names
    assert "Submission Agent" in agent_names
