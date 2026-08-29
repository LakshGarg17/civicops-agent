import pytest
from backend.agents.action_agent import ActionAgent
from backend.models.application import ApplicationDocument

def test_action_agent_prepare_next_action():
    """Verify Action Agent analyzes workflow and produces structured application proposal."""
    agent = ActionAgent()

    workflow = {
        "case_id": "CIV-1024",
        "goal": "Resolve Property Tax Delinquency",
        "priority": "high",
        "deadline": "November 30, 2024",
        "matched_documents": ["Dispute Form TC-409", "Proof of prior payment"],
        "missing_documents": ["Recorded Grant Deed"],
        "tasks": [
            {"id": "task_1", "title": "Analyze notice", "status": "completed", "requires_user": False},
            {"id": "task_2", "title": "Prepare formal dispute application", "status": "pending", "requires_user": False},
            {"id": "task_3", "title": "Submit dispute to Tax Collector", "status": "pending", "requires_user": True}
        ]
    }

    notice_data = {
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
        "mentioned_documents": ["Dispute Form TC-409", "Proof of prior payment"]
    }

    research_data = {
        "procedure_name": "Property Tax Delinquency & Assessment Dispute",
        "authority": "County Office of the Tax Collector",
        "submission_method": "County Tax Portal Online Submission",
        "required_documents": ["Dispute Form TC-409", "Proof of prior payment", "Recorded Grant Deed"],
        "steps": ["Complete dispute form", "Submit via portal"],
        "deadline_information": "November 30, 2024",
        "fees": "$0",
        "additional_requirements": [],
        "source_information": ["kingscounty.gov/taxes"]
    }

    proposal = agent.prepare_next_action(
        workflow=workflow,
        notice_data=notice_data,
        research_data=research_data,
        user_data={"applicant_name": "Jane Doe"}
    )

    assert proposal["case_id"] == "CIV-1024"
    assert proposal["action_type"] == "generate_application"
    assert proposal["requires_approval"] is True
    assert proposal["risk_assessment"]["risk_level"] == "consequential"
    assert "application" in proposal

    app = proposal["application"]
    assert "Dispute Form TC-409" in app["supporting_documents"]
    assert "Recorded Grant Deed" in app["missing_documents"]
    assert "Recorded Grant Deed" not in app["supporting_documents"]
