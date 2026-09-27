import pytest
from fastapi.testclient import TestClient
from app.main import app
from unittest.mock import patch

client = TestClient(app)

def test_health():
    res = client.get("/api/health")
    assert res.status_code == 200
    assert res.json() == {"status": "ok"}

def test_upload_paste():
    # Mocking embedding and chroma DB to avoid needing it in unit tests
    with patch("app.services.ingestion.vector_store.add_chunks"):
        with patch("app.services.ingestion.embedding_service.embed_texts", return_value=[[0.1]]):
            res = client.post(
                "/api/documents/paste",
                json={"user_id": "test_user", "text": "This is a test document.", "source_name": "Test"}
            )
            assert res.status_code == 200
            assert "document_id" in res.json()
            assert res.json()["chunk_count"] == 1

def test_chat_mocked():
    mock_retrieved = [
        {"chunk": "This is a test document.", "metadata": {"source_name": "Test", "chunk_index": 0}, "relevance": 0.9}
    ]
    with patch("app.services.retrieval.retrieval_service.retrieve", return_value=mock_retrieved):
        with patch("app.services.llm.llm_provider.generate_answer", return_value="Mocked answer"):
            res = client.post(
                "/api/chat",
                json={"user_id": "test_user", "question": "What is this?"}
            )
            assert res.status_code == 200
            assert res.json()["answer"] == "Mocked answer"
            assert len(res.json()["sources"]) == 1
            assert res.json()["sources"][0]["relevance"] == 0.9
def test_chat_no_answer():
    mock_retrieved = [
        {"chunk": "Unrelated stuff.", "metadata": {"source_name": "Test", "chunk_index": 0}, "relevance": 0.1}
    ]
    with patch("app.services.retrieval.retrieval_service.retrieve", return_value=mock_retrieved):
        res = client.post("/api/chat", json={"user_id": "test_user", "question": "What?"})
        assert res.status_code == 200
        assert res.json()["found"] == False

def test_delete():
    with patch("app.services.vector_store.vector_store.delete_document") as mock_delete:
        res = client.delete("/api/documents/123?user_id=test_user")
        assert res.status_code == 200
        mock_delete.assert_called_with("test_user", "123")

def test_feedback():
    res = client.post("/api/feedback", json={"user_id": "test_user", "question": "What?", "is_helpful": True})
    assert res.status_code == 200
