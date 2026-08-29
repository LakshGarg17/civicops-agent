import pytest
from fastapi.testclient import TestClient
from backend.agents.workflow_agent import WorkflowAgent, match_user_document
from backend.models.workflow import WorkflowCase
from backend.main import app

client = TestClient(app)

def test_match_user_document():
    """Verify robust normalized matching between required and user documents."""
    assert match_user_document("Dispute Form TC-409 (Completed & Signed)", ["Dispute Form TC-409"])
    assert match_user_document("Recorded Grant Deed or Proof of Ownership", ["Proof of Ownership - Grant Deed"])
    assert match_user_document("Proof of Prior Payment", ["proof of prior payment.pdf"])
    assert not match_user_document("Single Line Electrical Diagram", ["Dispute Form TC-409"])

def test_workflow_agent_diff_and_missing_document_tasks():
    """
    Test 4 requirement: User missing a required document → Workflow Agent must surface
    an 'Upload {document}' task for it.
    """
    agent = WorkflowAgent()

    document_data = {
        "notice_type": "Property Tax Delinquency Notice",
        "issuing_authority": "County of Kings",
        "department": "Office of the Tax Collector",
        "reference_number": "APN-4920-038-012",
        "citizen_name": "Jane Doe",
        "property_id": "Parcel 4920-038-012",
        "amount": "$4,911.25",
        "issue": "Unpaid property tax installment",
        "deadline": "November 30, 2024",
        "required_action": "Pay online or submit Dispute Form TC-409",
        "mentioned_documents": ["Dispute Form TC-409", "Recorded Grant Deed", "Proof of prior payment"]
    }

    research_data = {
        "procedure_name": "Property Tax Delinquency & Assessment Dispute",
        "authority": "County Office of the Tax Collector",
        "submission_method": "County Tax Portal Online Submission",
        "required_documents": [
            "Dispute Form TC-409",
            "Recorded Grant Deed",
            "Proof of Prior Payment"
        ],
        "steps": [
            "Complete and sign Dispute Form TC-409",
            "Submit dispute package via county tax portal",
            "Monitor county tax portal for review status"
        ],
        "deadline_information": "November 30, 2024",
        "fees": "$0 filing fee",
        "additional_requirements": [],
        "source_information": ["kingscounty.gov/taxes/disputes"]
    }

    # User only has "Dispute Form TC-409" on hand
    user_documents = ["Dispute Form TC-409"]

    workflow = agent.build_workflow(
        document_data=document_data,
        research_data=research_data,
        user_documents=user_documents
    )

    validated = WorkflowCase(**workflow)
    assert validated.case_id.startswith("CIV-")
    assert validated.priority in ["high", "medium", "critical"]
    assert "Recorded Grant Deed" in validated.missing_documents
    assert "Proof of Prior Payment" in validated.missing_documents
    assert "Dispute Form TC-409" in validated.matched_documents

    # Verify upload tasks are generated for missing documents
    task_titles = [t.title for t in validated.tasks]
    assert any("Upload Recorded Grant Deed" in title for title in task_titles)
    assert any("Upload Proof of Prior Payment" in title for title in task_titles)
    # The document the user already has should not be an upload task
    assert not any("Upload Dispute Form TC-409" == title for title in task_titles)

def test_workflow_agent_all_documents_provided():
    """Verify when user provides all documents, no pending upload tasks are required."""
    agent = WorkflowAgent()

    document_data = {
        "notice_type": "Plan Check Correction Notice",
        "deadline": "Within 60 calendar days",
        "issue": "Plan check corrections required"
    }

    research_data = {
        "procedure_name": "Plan Check Supplemental Resubmission",
        "authority": "Department of Building Inspection",
        "submission_method": "Electronic Plan Review (EPR) Portal",
        "required_documents": [
            "Revised Structural Calculations (Stamped by PE)",
            "Single Line Electrical Diagram"
        ],
        "steps": [
            "Review plan checker markups",
            "Resubmit corrected plan set via EPR portal"
        ],
        "deadline_information": "Within 60 days",
        "fees": "$185.00",
        "additional_requirements": [],
        "source_information": ["oakridge.gov"]
    }

    user_documents = [
        "Revised Structural Calculations (Stamped by PE)",
        "Single Line Electrical Diagram"
    ]

    workflow = agent.build_workflow(
        document_data=document_data,
        research_data=research_data,
        user_documents=user_documents
    )

    validated = WorkflowCase(**workflow)
    assert len(validated.missing_documents) == 0
    assert len(validated.matched_documents) == 2
    # Ensure no upload tasks generated
    assert not any("Upload" in t.title for t in validated.tasks)

def test_api_research_endpoint():
    """Test POST /research endpoint with valid notice input."""
    payload = {
        "notice_data": {
            "notice_type": "Property Tax Delinquency Notice",
            "issuing_authority": "County of Kings",
            "department": "Office of the Tax Collector",
            "reference_number": "APN-4920-038-012",
            "citizen_name": "Jane Doe",
            "property_id": "Parcel 4920-038-012",
            "amount": "$4,911.25",
            "issue": "Unpaid property tax installment",
            "deadline": "November 30, 2024",
            "required_action": "Pay online or submit Dispute Form TC-409",
            "mentioned_documents": ["Dispute Form TC-409"]
        }
    }

    response = client.post("/research", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert "research_data" in data
    assert "procedure_name" in data["research_data"]
    assert len(data["research_data"]["required_documents"]) > 0

def test_api_workflow_endpoint_and_case_retrieval():
    """Test POST /workflow and subsequent GET /cases/{case_id}."""
    payload = {
        "document_data": {
            "notice_type": "Parking Citation",
            "issuing_authority": "City of Metropolis",
            "department": "Department of Transportation",
            "reference_number": "PC-9912",
            "citizen_name": "Not found",
            "property_id": "Not found",
            "amount": "$65.00",
            "issue": "Street sweeping parking violation",
            "deadline": "December 15, 2024",
            "required_action": "Pay citation online or contest",
            "mentioned_documents": ["Parking Citation Notice", "Proof of Permit"]
        },
        "research_data": {
            "procedure_name": "Administrative Review of Parking Citation",
            "authority": "Department of Transportation",
            "submission_method": "Online Citation Dispute Web Portal",
            "required_documents": ["Parking Citation Notice", "Proof of Permit"],
            "steps": ["Submit review online", "Await agency ruling"],
            "deadline_information": "Within 21 calendar days",
            "fees": "$0 for initial review",
            "additional_requirements": [],
            "source_information": ["metropolis.gov/transportation"]
        },
        "user_documents": ["Parking Citation Notice"]
    }

    # 1. Create workflow
    res = client.post("/workflow", json=payload)
    assert res.status_code == 200
    w_data = res.json()
    assert w_data["status"] == "success"
    case_id = w_data["workflow"]["case_id"]
    assert case_id.startswith("CIV-")
    assert "Proof of Permit" in w_data["workflow"]["missing_documents"]

    # 2. Retrieve workflow case by ID
    get_res = client.get(f"/cases/{case_id}")
    assert get_res.status_code == 200
    retrieved_case = get_res.json()
    assert retrieved_case["case_id"] == case_id
    assert retrieved_case["goal"] == w_data["workflow"]["goal"]

def test_api_get_nonexistent_case_returns_404():
    """Test GET /cases/nonexistent returns 404."""
    res = client.get("/cases/CIV-9999999")
    assert res.status_code == 404
