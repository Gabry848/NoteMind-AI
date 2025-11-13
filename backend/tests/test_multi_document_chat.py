"""
Test for multi-document chat functionality
"""
import pytest
from fastapi.testclient import TestClient
from app.models.document import Document
from app.models.conversation import Conversation


def test_chat_with_single_document(client: TestClient, auth_headers: dict, test_document: Document):
    """Test chat with single document (backward compatibility)"""
    response = client.post(
        "/api/chat",
        headers=auth_headers,
        json={
            "document_id": test_document.id,
            "message": "What is this document about?",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "conversation_id" in data
    assert data["message"]["role"] == "assistant"
    assert len(data["message"]["content"]) > 0


def test_chat_with_multiple_documents(
    client: TestClient, 
    auth_headers: dict, 
    test_document: Document,
    db_session
):
    """Test chat with multiple documents"""
    # Create a second document
    from app.models.user import User
    user = db_session.query(User).first()
    
    doc2 = Document(
        user_id=user.id,
        filename="test2.txt",
        original_filename="test2.txt",
        file_path="/uploads/test2.txt",
        file_size=100,
        file_type="text/plain",
        gemini_file_id="test_file_2",
        status="ready",
    )
    db_session.add(doc2)
    db_session.commit()
    
    response = client.post(
        "/api/chat",
        headers=auth_headers,
        json={
            "document_ids": [test_document.id, doc2.id],
            "message": "Compare these two documents",
        },
    )
    
    assert response.status_code == 200
    data = response.json()
    assert "conversation_id" in data
    assert data["message"]["role"] == "assistant"


def test_chat_without_documents_fails(client: TestClient, auth_headers: dict):
    """Test that chat fails without documents"""
    response = client.post(
        "/api/chat",
        headers=auth_headers,
        json={
            "message": "Hello",
        },
    )
    
    assert response.status_code == 400


def test_chat_with_nonexistent_document_fails(client: TestClient, auth_headers: dict):
    """Test that chat fails with non-existent document"""
    response = client.post(
        "/api/chat",
        headers=auth_headers,
        json={
            "document_ids": [99999],
            "message": "Hello",
        },
    )
    
    assert response.status_code == 404


def test_conversation_shows_multiple_documents(
    client: TestClient,
    auth_headers: dict,
    test_document: Document,
    db_session
):
    """Test that conversation response includes multiple document IDs"""
    # Create conversation with chat
    response = client.post(
        "/api/chat",
        headers=auth_headers,
        json={
            "document_id": test_document.id,
            "message": "Test message",
        },
    )
    
    conversation_id = response.json()["conversation_id"]
    
    # Get conversation history
    response = client.get(
        f"/api/chat/history/{test_document.id}",
        headers=auth_headers,
    )
    
    assert response.status_code == 200
    conversations = response.json()
    assert len(conversations) > 0
    conv = conversations[0]
    assert "document_ids" in conv
    assert test_document.id in conv["document_ids"]
