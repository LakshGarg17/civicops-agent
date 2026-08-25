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
    file_payload = {"file": ("empty_notice.pdf", io.BytesIO(b""), "application/pdf")}
    response = client.post("/upload", files=file_payload)
    assert response.status_code == 400
    assert "empty" in response.json()["detail"].lower()

def test_upload_unsupported_file_extension():
    """Verify that uploading an unsupported file type (e.g. .exe or .zip) returns 400 Bad Request."""
    file_payload = {"file": ("malicious.exe", io.BytesIO(b"binary data"), "application/x-msdownload")}
    response = client.post("/upload", files=file_payload)
    assert response.status_code == 400
    assert "unsupported file type" in response.json()["detail"].lower()

@patch("backend.services.document_service.DocumentAgent.process_document")
def test_upload_pdf_file_success(mock_agent):
    """Verify successful upload of a PDF document returning structured notice data."""
    mock_agent.return_value = {
        "notice_type": "Property Tax Delinquency Notice",
        "issuing_authority": "County of Kings",
        "department": "Office of the Tax Collector",
        "reference_number": "APN-4920-038-012",
        "citizen_name": "Jane Doe",
        "property_id": "4920-038-012",
        "amount": "$4,911.25",
        "issue": "Unpaid second installment property tax",
        "deadline": "November 30, 2024",
        "required_action": "Remit full payment or submit dispute",
        "mentioned_documents": ["Dispute Form TC-409", "Proof of prior payment"]
    }

    sample_pdf_bytes = b"%PDF-1.4 sample content"
    file_payload = {"file": ("property_tax_notice.pdf", io.BytesIO(sample_pdf_bytes), "application/pdf")}

    response = client.post("/upload", files=file_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["filename"] == "property_tax_notice.pdf"
    assert "notice_data" in data
    assert data["notice_data"]["notice_type"] == "Property Tax Delinquency Notice"
    assert data["notice_data"]["amount"] == "$4,911.25"
    assert len(data["notice_data"]["mentioned_documents"]) == 2
    assert len(data["processing_stages"]) == 5
    mock_agent.assert_called_once()

@patch("backend.services.document_service.DocumentAgent.process_document")
def test_upload_image_png_success(mock_agent):
    """Verify successful upload of a PNG image notice returning structured JSON."""
    mock_agent.return_value = {
        "notice_type": "Parking Citation",
        "issuing_authority": "City Department",
        "department": "Traffic Bureau",
        "reference_number": "PK-8819",
        "citizen_name": "Not found",
        "property_id": "Not found",
        "amount": "$50.00",
        "issue": "Expired meter parking",
        "deadline": "December 5, 2024",
        "required_action": "Pay citation online",
        "mentioned_documents": []
    }

    sample_png_bytes = b"\x89PNG\r\n\x1a\n\x00\x00\x00\rIHDR"
    file_payload = {"file": ("citation_photo.png", io.BytesIO(sample_png_bytes), "image/png")}

    response = client.post("/upload", files=file_payload)
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "success"
    assert data["notice_data"]["notice_type"] == "Parking Citation"
    assert data["notice_data"]["citizen_name"] == "Not found"
