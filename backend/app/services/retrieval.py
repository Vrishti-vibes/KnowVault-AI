from app.services.vector_store import vector_store
from app.services.embeddings import embedding_service
from app.utils.config import settings

class RetrievalService:
    def retrieve(self, user_id: str, question: str, document_ids: list[str] = None):
        query_embedding = embedding_service.embed_text(question)
        
        results = vector_store.query_chunks(
            user_id=user_id,
            query_embedding=query_embedding,
            top_k=settings.RETRIEVAL_TOP_K,
            document_ids=document_ids
        )
        
        if not results or not results['documents'] or len(results['documents'][0]) == 0:
            return []
            
        # Determine max version for each document_id to filter out old versions
        all_user_docs = vector_store.collection.get(where={"user_id": user_id}, include=["metadatas"])
        active_versions = {}
        if all_user_docs and all_user_docs["metadatas"]:
            for m in all_user_docs["metadatas"]:
                doc_id = m.get("document_id")
                v = m.get("version", 1)
                if doc_id not in active_versions or v > active_versions[doc_id]:
                    active_versions[doc_id] = v
            
        retrieved_items = []
        for i in range(len(results['documents'][0])):
            doc = results['documents'][0][i]
            meta = results['metadatas'][0][i]
            distance = results['distances'][0][i]
            
            relevance = max(0.0, 1.0 - (distance / 2.0))
            
            doc_id = meta.get("document_id")
            chunk_version = meta.get("version", 1)
            
            # Only include active versions (the highest version for this document_id)
            if chunk_version >= active_versions.get(doc_id, 1):
                retrieved_items.append({
                    "chunk": doc,
                    "metadata": meta,
                    "relevance": relevance,
                    "distance": distance
                })
                
        return retrieved_items

retrieval_service = RetrievalService()
