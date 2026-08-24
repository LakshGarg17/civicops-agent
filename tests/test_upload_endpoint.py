import io
import pytest
from unittest.mock import patch, MagicMock
from fastapi.testclient import TestClient
from backend.main import app

client = TestClient(app)

def test_health_check():
    """Verify that the health check endpoint returns 200 and standard metadata."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "ok"
    assert data["service"] == "CivicOps Backend"
    assert "gemini_configured" in data
    assert "adk_status" in data

def test_upload_empty_file():
    """Verify that uploading an empty file returns 400 Bad Request."""
    file_payload = {"file": ("empty_notice.txt", io.BytesIO(b""), "text/plain")}
    response = client.post("/upload", files=file_payload)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

@patch("backend.main.gemini_service.generate_response")
def test_upload_text_file_success(mock_gemini):
    """Verify successful upload of a text document and mocked Gemini generation."""
    mock_ai_output = (
        "### Summary of Property Tax Notice\n"
        "- **What this is:** Final notice for overdue property taxes totaling $4,911.25.\n"
        "- **Deadline:** November 30, 2024.\n"
        "- **Actions:** Pay online or file dispute form TC-409."
    )
    mock_gemini.return_value = mock_ai_output

    sample_content = b"COUNTY OF KINGS - FINAL NOTICE OF DELINQUENT PROPERTY TAX. DUE: NOV 30."
    file_payload = {"file": ("tax_notice.txt", io.BytesIO(sample_content), "text/plain")}
    
    response = client.post("/upload", files=file_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["filename"] == "tax_notice.txt"
    assert "COUNTY OF KINGS" in data["extracted_text"]
    assert data["ai_response"] == mock_ai_output
    assert data["metadata"]["file_size_bytes"] == len(sample_content)
    
    # Ensure Gemini service was called with the system prompt and document text
    mock_gemini.assert_called_once()
