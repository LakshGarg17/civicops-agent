import json
import pytest
from unittest.mock import patch, MagicMock
from backend.agents.research_agent import ResearchAgent, DEFAULT_RESEARCH_FALLBACK
from backend.models.research import ProcedureResearchData
from backend.models.notice import NoticeStructuredData

def test_research_agent_clean_and_parse_valid_json():
    """Verify ResearchAgent cleans and parses valid JSON into expected schema."""
    agent = ResearchAgent(api_key="mock_key")
    sample_json = json.dumps({
        "procedure_name": "Property Tax Assessment Appeal",
        "authority": "County Assessment Appeals Board",
        "submission_method": "County Tax Appeal Portal",
        "required_documents": ["Form AAB-100", "Comparable Sales Evidence", "Proof of Purchase"],
        "steps": [
            "File Form AAB-100 online",
            "Submit comparable sales analysis",
            "Attend scheduled hearing"
        ],
        "deadline_information": "September 15 of current tax year",
        "fees": "$45 filing fee",
        "additional_requirements": ["Must provide 3 comparable property comps"],
        "source_information": ["County Assessor Official Portal (.gov)"]
    })

    parsed = agent.clean_and_parse_json(sample_json)
    validated = ProcedureResearchData(**parsed)
    assert validated.procedure_name == "Property Tax Assessment Appeal"
    assert validated.authority == "County Assessment Appeals Board"
    assert len(validated.required_documents) == 3
    assert "Form AAB-100" in validated.required_documents
    assert validated.deadline_information == "September 15 of current tax year"

def test_research_agent_fenced_markdown_stripping():
    """Verify ResearchAgent cleanly strips markdown ```json fences."""
    agent = ResearchAgent(api_key="mock_key")
    fenced = """```json
    {
        "procedure_name": "Parking Ticket Contest",
        "authority": "Parking Violations Bureau",
        "submission_method": "Online Web Portal",
        "required_documents": ["Citation Copy", "Residential Permit"],
        "steps": ["Submit review online", "Await written ruling"],
        "deadline_information": "Within 21 days",
        "fees": "No fee",
        "additional_requirements": [],
        "source_information": ["City DOT (.gov)"]
    }
    ```"""
    parsed = agent.clean_and_parse_json(fenced)
    validated = ProcedureResearchData(**parsed)
    assert validated.procedure_name == "Parking Ticket Contest"
    assert validated.authority == "Parking Violations Bureau"

def test_research_agent_anti_hallucination_missing_deadline():
    """
    Test 3 requirement: Missing deadline in input → agent must NOT invent one,
    should mark deadline_information as unverified or 'Not found'.
    """
    agent = ResearchAgent(api_key="mock_key")
    # Notice with missing/unstated deadline
    notice_data = {
        "notice_type": "Code Compliance Advisory",
        "issuing_authority": "Department of Code Compliance",
        "department": "Neighborhood Services",
        "reference_number": "CC-901",
        "citizen_name": "John Smith",
        "property_id": "Lot 12",
        "amount": "Not found",
        "issue": "Overgrown vegetation advisory",
        "deadline": "Not found",
        "required_action": "Trim vegetation",
        "mentioned_documents": []
    }

    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "procedure_name": "Vegetation Abatement Compliance Review",
        "authority": "Department of Code Compliance",
        "submission_method": "Online or In-Person Re-Inspection Request",
        "required_documents": ["Proof of Abatement Photos"],
        "steps": ["Remedy cited vegetation condition", "Submit abatement photos"],
        "deadline_information": "Not found",
        "fees": "Not found",
        "additional_requirements": [],
        "source_information": ["Municipal Code § 14 (.gov)"]
    })
    mock_model.generate_content.return_value = mock_response
    agent._model = mock_model

    result = agent.research_procedure(notice_data)
    assert result["deadline_information"] == "Not found" or "Unverified" in result["deadline_information"]
    assert result["fees"] == "Not found"
    assert "Proof of Abatement Photos" in result["required_documents"]

def test_research_agent_property_tax_grounded_lookup():
    """
    Test 1: Property tax notice → property tax correction workflow (happy path).
    Verifies grounded research returns authoritative procedure and sources.
    """
    agent = ResearchAgent(api_key="mock_key")
    tax_notice = {
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

    result = agent.research_procedure(tax_notice)
    assert "Tax" in result["procedure_name"] or "Assessment" in result["procedure_name"]
    assert len(result["required_documents"]) >= 2
    assert any("409" in doc for doc in result["required_documents"])
    assert len(result["steps"]) >= 3
    assert any(".gov" in src or "Tax Collector" in src for src in result["source_information"])

def test_research_agent_building_permit_grounded_lookup():
    """
    Test 2: Building permit notice → permit-related workflow (different procedure type).
    Verifies grounded lookup accurately identifies plan check and engineering requirements.
    """
    agent = ResearchAgent(api_key="mock_key")
    permit_notice = {
        "notice_type": "Plan Check Correction Notice",
        "issuing_authority": "City of Oakridge",
        "department": "Department of Building Inspection",
        "reference_number": "BLD-2024-88412",
        "citizen_name": "Marcus Vance",
        "property_id": "1044 Hillcrest Ave",
        "amount": "$185.00",
        "issue": "Plan check corrections required for rooftop solar PV",
        "deadline": "Within 60 calendar days",
        "required_action": "Revise structural calculations and resubmit",
        "mentioned_documents": [
            "Revised Structural Calculations (Stamped by PE)",
            "Single Line Electrical Diagram",
            "AC Disconnect Specification Sheet"
        ]
    }

    result = agent.research_procedure(permit_notice)
    assert "Plan Check" in result["procedure_name"] or "Building" in result["procedure_name"]
    assert any("Structural Calculations" in doc for doc in result["required_documents"])
    assert len(result["steps"]) >= 3
    assert any("oakridge.gov" in src or "Building Code" in src or ".gov" in src for src in result["source_information"])
