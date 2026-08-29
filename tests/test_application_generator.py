import pytest
from backend.services.application_generator import ApplicationGenerator
from backend.models.application import ApplicationDocument

def test_application_generator_basic_structure():
    """Verify application generator builds complete structured petition from notice and research."""
    gen = ApplicationGenerator()

    notice_data = {
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
        "mentioned_documents": ["Revised Structural Calculations (Stamped by PE)", "Single Line Electrical Diagram"]
    }

    research_data = {
        "procedure_name": "Plan Check Supplemental Resubmission",
        "authority": "City of Oakridge — Department of Building Inspection",
        "submission_method": "Electronic Plan Review (EPR) Portal",
        "required_documents": [
            "Revised Structural Calculations (Stamped by PE)",
            "Single Line Electrical Diagram",
            "AC Disconnect Specification Sheet"
        ],
        "steps": ["Revise calculations", "Resubmit via EPR"],
        "deadline_information": "Within 60 calendar days",
        "fees": "$185.00",
        "additional_requirements": [],
        "source_information": ["oakridge.gov/building"]
    }

    workflow = {
        "matched_documents": [
            "Revised Structural Calculations (Stamped by PE)",
            "Single Line Electrical Diagram"
        ],
        "missing_documents": [
            "AC Disconnect Specification Sheet"
        ]
    }

    app_dict = gen.generate_application(
        notice_data=notice_data,
        research_data=research_data,
        user_data={"applicant_name": "Marcus Vance"},
        workflow=workflow
    )

    validated = ApplicationDocument(**app_dict)
    assert "Oakridge" in validated.to
    assert "BLD-2024-88412" in validated.subject or "BLD-2024-88412" in validated.reference_number
    assert validated.property_id == "1044 Hillcrest Ave"
    assert validated.applicant_name == "Marcus Vance"
    assert len(validated.supporting_documents) == 2
    assert "Revised Structural Calculations (Stamped by PE)" in validated.supporting_documents
    assert "Single Line Electrical Diagram" in validated.supporting_documents

def test_application_generator_missing_document_anti_fabrication():
    """
    CRITICAL ANTI-FABRICATION TEST:
    Missing document (e.g. missing ownership proof) -> generated application MUST NOT
    claim that document exists or was attached.
    """
    gen = ApplicationGenerator()

    notice_data = {
        "notice_type": "Property Tax Delinquency Notice",
        "issuing_authority": "County of Kings",
        "reference_number": "APN-990-12",
        "citizen_name": "Alice Wonderland",
        "property_id": "APN-990-12",
        "amount": "$2,500.00",
        "issue": "Unpaid second installment",
        "deadline": "December 1, 2024",
        "required_action": "Pay or contest"
    }

    research_data = {
        "procedure_name": "Property Tax Dispute",
        "authority": "Office of the Tax Collector",
        "submission_method": "Online Portal",
        "required_documents": [
            "Dispute Form TC-409",
            "Proof of Ownership / Grant Deed",
            "Prior Payment Receipt"
        ]
    }

    # Citizen ONLY has the Dispute Form. They are MISSING Ownership Proof and Payment Receipt!
    workflow = {
        "matched_documents": ["Dispute Form TC-409"],
        "missing_documents": ["Proof of Ownership / Grant Deed", "Prior Payment Receipt"]
    }

    app_dict = gen.generate_application(
        notice_data=notice_data,
        research_data=research_data,
        user_data={"applicant_name": "Alice Wonderland"},
        workflow=workflow
    )

    # Verify supporting_documents ONLY contains the 1 document the user has
    assert len(app_dict["supporting_documents"]) == 1
    assert "Dispute Form TC-409" in app_dict["supporting_documents"]

    # Verify missing documents are strictly excluded from supporting_documents
    assert "Proof of Ownership / Grant Deed" not in app_dict["supporting_documents"]
    assert "Prior Payment Receipt" not in app_dict["supporting_documents"]

    # Verify missing documents are properly flagged in missing_documents
    assert "Proof of Ownership / Grant Deed" in app_dict["missing_documents"]
    assert "Prior Payment Receipt" in app_dict["missing_documents"]
