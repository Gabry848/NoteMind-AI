"""
Tests for document endpoints
"""
import pytest
from io import BytesIO


def test_list_documents_empty(client, auth_headers):
    """Test listing documents when none exist"""
    response = client.get("/api/documents", headers=auth_headers)
    assert response.status_code == 200
    data = response.json()
    assert data["total"] == 0
    assert data["documents"] == []


def test_upload_document(client, auth_headers, monkeypatch):
    """Test document upload"""
    # Mock Gemini service
    class MockGeminiService:
        async def upload_file(self, file_path, display_name):
            return "mock_gemini_file_id"

    from app.services import gemini_service
    monkeypatch.setattr(gemini_service, "gemini_service", MockGeminiService())

    # Create test file
    file_content = b"Test document content"
    files = {"file": ("test.txt", BytesIO(file_content), "text/plain")}

    response = client.post("/api/documents/upload", files=files, headers=auth_headers)
    assert response.status_code == 201
    data = response.json()
    assert data["original_filename"] == "test.txt"
    assert data["file_size"] == len(file_content)


def test_upload_invalid_file_type(client, auth_headers):
    """Test upload with invalid file type"""
    file_content = b"Test content"
    files = {"file": ("test.exe", BytesIO(file_content), "application/x-msdownload")}

    response = client.post("/api/documents/upload", files=files, headers=auth_headers)
    assert response.status_code == 400


def test_upload_without_auth(client):
    """Test upload without authentication"""
    file_content = b"Test content"
    files = {"file": ("test.txt", BytesIO(file_content), "text/plain")}

    response = client.post("/api/documents/upload", files=files)
    assert response.status_code == 403
