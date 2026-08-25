import json
import pytest
from unittest.mock import patch, MagicMock
from pathlib import Path

from backend.agents.document_agent import DocumentAgent, DEFAULT_FALLBACK_DATA
from backend.models.notice import NoticeStructuredData

def test_clean_and_parse_valid_json():
    """Verify that a valid JSON string parses cleanly into the structured dictionary."""
    agent = DocumentAgent(api_key="mock_key")
    raw_json = json.dumps({
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
    })

    result = agent.clean_and_parse_json(raw_json)
    validated = NoticeStructuredData(**result)
    assert validated.notice_type == "Property Tax Delinquency Notice"
    assert validated.issuing_authority == "County of Kings"
    assert validated.amount == "$4,911.25"
    assert len(validated.mentioned_documents) == 2
    assert "Dispute Form TC-409" in validated.mentioned_documents

def test_clean_and_parse_markdown_fenced_json():
    """Verify that JSON wrapped in markdown fences (```json ... ```) is cleanly stripped and parsed."""
    agent = DocumentAgent(api_key="mock_key")
    fenced_content = """```json
{
  "notice_type": "Parking Citation",
  "issuing_authority": "City of Metropolis",
  "department": "Department of Transportation",
  "reference_number": "PC-12345",
  "citizen_name": "Not found",
  "property_id": "Not found",
  "amount": "$65.00",
  "issue": "Street sweeping parking violation",
  "deadline": "December 1, 2024",
  "required_action": "Pay citation online within 21 days",
  "mentioned_documents": []
}
```"""

    result = agent.clean_and_parse_json(fenced_content)
    validated = NoticeStructuredData(**result)
    assert validated.notice_type == "Parking Citation"
    assert validated.issuing_authority == "City of Metropolis"
    assert validated.amount == "$65.00"
    assert validated.citizen_name == "Not found"
    assert validated.mentioned_documents == []

def test_clean_and_parse_malformed_json_fallback():
    """Verify that malformed/non-JSON text falls back gracefully without crashing."""
    agent = DocumentAgent(api_key="mock_key")
    malformed_text = "I am an AI assistant and I think this notice is about taxes but here is no valid JSON."

    result = agent.clean_and_parse_json(malformed_text)
    assert result["notice_type"] == "Not found"
    assert result["issuing_authority"] == "Not found"
    assert result["amount"] == "Not found"
    assert result["mentioned_documents"] == []
    
    # Verify it can instantiate Pydantic model
    validated = NoticeStructuredData(**result)
    assert validated.notice_type == "Not found"

def test_clean_and_parse_missing_fields_default_to_not_found():
    """Verify that missing fields in partial JSON output correctly default to 'Not found'."""
    agent = DocumentAgent(api_key="mock_key")
    partial_json = json.dumps({
        "notice_type": "Building Violation",
        "amount": "$250.00"
    })

    result = agent.clean_and_parse_json(partial_json)
    assert result["notice_type"] == "Building Violation"
    assert result["amount"] == "$250.00"
    assert result["issuing_authority"] == "Not found"
    assert result["department"] == "Not found"
    assert result["deadline"] == "Not found"
    assert result["mentioned_documents"] == []

def test_process_document_with_mocked_gemini(tmp_path):
    """Verify process_document reads a file, builds multimodal payload, and calls Gemini."""
    sample_file = tmp_path / "sample_notice.pdf"
    sample_file.write_bytes(b"%PDF-1.4 dummy pdf bytes")

    agent = DocumentAgent(api_key="test_api_key_valid")
    mock_model = MagicMock()
    mock_response = MagicMock()
    mock_response.text = json.dumps({
        "notice_type": "Zoning Hearing Notice",
        "issuing_authority": "Planning Commission",
        "department": "Zoning Board",
        "reference_number": "ZN-2024-09",
        "citizen_name": "Alice Smith",
        "property_id": "Lot 44",
        "amount": "Not found",
        "issue": "Variance request for setback",
        "deadline": "November 15, 2024",
        "required_action": "Attend public hearing or submit written comments",
        "mentioned_documents": ["Site Plan", "Notice of Hearing"]
    })
    mock_model.generate_content.return_value = mock_response
    agent._model = mock_model

    result = agent.process_document(str(sample_file))
    assert result["notice_type"] == "Zoning Hearing Notice"
    assert result["citizen_name"] == "Alice Smith"
    assert result["amount"] == "Not found"
    assert "Site Plan" in result["mentioned_documents"]
    mock_model.generate_content.assert_called_once()
