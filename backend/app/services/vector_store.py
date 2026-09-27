import chromadb
from chromadb.config import Settings as ChromaSettings
from app.utils.config import settings
import uuid

class VectorStore:
    def __init__(self):
        self.client = chromadb.PersistentClient(path=settings.CHROMA_PATH)
        self.collection = self.client.get_or_create_collection(name="knowvault_knowledge")

    def add_chunks(self, chunks: list[str], embeddings: list[list[float]], metadatas: list[dict]):
        ids = [str(uuid.uuid4()) for _ in chunks]
        self.collection.add(
            documents=chunks,
            embeddings=embeddings,
            metadatas=metadatas,
            ids=ids
        )

    def query_chunks(self, user_id: str, query_embedding: list[float], top_k: int, document_ids: list[str] = None):
        where_clause = {"user_id": user_id}
        if document_ids:
            if len(document_ids) == 1:
                where_clause = {
                    "$and": [
                        {"user_id": user_id},
                        {"document_id": document_ids[0]}
                    ]
                }
            else:
                where_clause = {
                    "$and": [
                        {"user_id": user_id},
                        {"document_id": {"$in": document_ids}}
                    ]
                }
                
        results = self.collection.query(
            query_embeddings=[query_embedding],
            n_results=top_k,
            where=where_clause
        )
        return results

    def delete_document(self, user_id: str, document_id: str):
        self.collection.delete(
            where={
                "$and": [
                    {"user_id": user_id},
                    {"document_id": document_id}
                ]
            }
        )

vector_store = VectorStore()
