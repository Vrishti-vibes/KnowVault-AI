import uuid
import docx
import io
from app.services.chunking import chunk_text
from app.services.embeddings import embedding_service
from app.services.vector_store import vector_store
from app.utils.config import settings
from datetime import datetime

import PyPDF2

class IngestionService:
    def _get_next_version(self, user_id: str, source_name: str) -> (str, int):
        # Find existing document by source_name to bump version
        results = vector_store.collection.get(
            where={
                "$and": [
                    {"user_id": user_id},
                    {"source_name": source_name}
                ]
            },
            include=["metadatas"]
        )
        if not results or not results["metadatas"]:
            return str(uuid.uuid4()), 1
            
        max_version = 0
        doc_id = None
        for meta in results["metadatas"]:
            v = meta.get("version", 1)
            if v > max_version:
                max_version = v
                doc_id = meta.get("document_id")
                
        # If we found an existing doc, we reuse the same document_id (or create a new one, but let's reuse doc_id so it replaces or groups versions)
        # Actually, the user wants new versions. Let's use the same document_id.
        if not doc_id:
            doc_id = str(uuid.uuid4())
            
        # Optional: Mark old versions as inactive? 
        # But chroma doesn't support update easily without IDs, so we just add the new version.
        # Active is checked dynamically or we just assume highest version is active.
        return doc_id, max_version + 1

    def ingest_knowledge(self, text: str, user_id: str, source_name: str, source_type: str, document_id: str = None, version: int = None):
        if not text.strip():
            raise ValueError("Input text is empty")
            
        if document_id is None or version is None:
            doc_id, next_v = self._get_next_version(user_id, source_name)
            document_id = document_id or doc_id
            version = version or next_v
            
        chunks = chunk_text(text, settings.CHUNK_SIZE, settings.CHUNK_OVERLAP)
        if not chunks:
            raise ValueError("No chunks could be generated from the text")
            
        embeddings = embedding_service.embed_texts(chunks)
        
        metadatas = []
        for i, chunk in enumerate(chunks):
            metadatas.append({
                "user_id": user_id,
                "document_id": document_id,
                "version": version,
                "active": True,
                "source_name": source_name,
                "source_type": source_type,
                "chunk_index": i,
                "created_at": datetime.utcnow().isoformat()
            })
            
        vector_store.add_chunks(chunks, embeddings, metadatas)
        
        return {
            "document_id": document_id,
            "chunk_count": len(chunks),
            "message": "Successfully ingested"
        }

    def ingest_docx(self, file_bytes: bytes, user_id: str, source_name: str):
        doc = docx.Document(io.BytesIO(file_bytes))
        full_text = []
        for para in doc.paragraphs:
            if para.text.strip():
                full_text.append(para.text)
        return self.ingest_knowledge("\n\n".join(full_text), user_id, source_name, "DOCX")

    def ingest_txt(self, file_bytes: bytes, user_id: str, source_name: str):
        text = file_bytes.decode('utf-8', errors='ignore')
        return self.ingest_knowledge(text, user_id, source_name, "TXT")
        
    def ingest_pdf(self, file_bytes: bytes, user_id: str, source_name: str):
        pdf = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        full_text = []
        for page in pdf.pages:
            text = page.extract_text()
            if text:
                full_text.append(text)
        return self.ingest_knowledge("\n\n".join(full_text), user_id, source_name, "PDF")

ingestion_service = IngestionService()
