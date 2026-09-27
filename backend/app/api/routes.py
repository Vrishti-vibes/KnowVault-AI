from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from app.models.schemas import ChatRequest, ChatResponse, UploadResponse, PasteRequest, SourceProof
from app.services.ingestion import ingestion_service
from app.services.retrieval import retrieval_service
from app.services.confidence import confidence_guard
from app.services.llm import llm_provider

router = APIRouter()

@router.get("/health")
def health_check():
    return {"status": "ok"}

@router.post("/documents/upload", response_model=UploadResponse)
async def upload_document(
    file: UploadFile = File(...),
    user_id: str = Form(...),
):
    contents = await file.read()
    source_name = file.filename
    
    if file.filename.endswith(".docx"):
        result = ingestion_service.ingest_docx(contents, user_id, source_name)
    elif file.filename.endswith(".txt"):
        result = ingestion_service.ingest_txt(contents, user_id, source_name)
    elif file.filename.endswith(".pdf"):
        result = ingestion_service.ingest_pdf(contents, user_id, source_name)
    else:
        raise HTTPException(status_code=400, detail="Unsupported file format")
        
    return result

@router.post("/documents/paste", response_model=UploadResponse)
def paste_document(request: PasteRequest):
    result = ingestion_service.ingest_knowledge(
        text=request.text,
        user_id=request.user_id,
        source_name=request.source_name,
        source_type="PASTE"
    )
    return result

@router.get("/documents")
def get_documents(user_id: str):
    from app.services.vector_store import vector_store
    results = vector_store.collection.get(where={"user_id": user_id}, include=["metadatas"])
    
    docs = {}
    if results and results["metadatas"]:
        for meta in results["metadatas"]:
            doc_id = meta.get("document_id")
            version = meta.get("version", 1)
            
            if doc_id not in docs:
                docs[doc_id] = {
                    "document_id": doc_id,
                    "source_name": meta.get("source_name"),
                    "version": version,
                    "source_type": meta.get("source_type"),
                    "created_at": meta.get("created_at"),
                    "chunk_count": 0
                }
            
            # If we find a newer version for this document ID, reset the chunk count and update version
            if version > docs[doc_id]["version"]:
                docs[doc_id]["version"] = version
                docs[doc_id]["chunk_count"] = 1
                docs[doc_id]["created_at"] = meta.get("created_at")
            elif version == docs[doc_id]["version"]:
                docs[doc_id]["chunk_count"] += 1
            
    return list(docs.values())

@router.delete("/documents/{document_id}")
def delete_document(document_id: str, user_id: str):
    from app.services.vector_store import vector_store
    vector_store.delete_document(user_id, document_id)
    return {"message": "Document deleted successfully"}

@router.post("/chat", response_model=ChatResponse)
def chat(request: ChatRequest):
    # 1. Retrieve
    retrieved_items = retrieval_service.retrieve(
        request.user_id, 
        request.question,
        document_ids=request.document_ids
    )
    
    # 2. Confidence Guard
    if not confidence_guard.check_confidence(retrieved_items):
        return ChatResponse(
            answer="I couldn't find enough relevant information in your knowledge base to answer this.",
            sources=[],
            found=False
        )
        
    # 3. Construct Context
    context_texts = []
    sources = []
    for item in retrieved_items:
        meta = item['metadata']
        chunk_text = item['chunk']
        context_texts.append(f"[Source: {meta['source_name']}]\n{chunk_text}")
        sources.append(SourceProof(
            source_name=meta['source_name'],
            chunk_id=str(meta['chunk_index']),
            snippet=chunk_text[:300] + ("..." if len(chunk_text) > 300 else ""),
            relevance=item['relevance'],
            version=meta.get('version', 1),
            source_type=meta.get('source_type', 'UNKNOWN')
        ))
        
    full_context = "\n\n".join(context_texts)
    
    # 4. Generate Answer
    try:
        answer = llm_provider.generate_answer(request.question, full_context)
    except Exception as e:
        # Avoid exposing stack traces
        raise HTTPException(status_code=500, detail="Error generating answer from LLM")
        
    return ChatResponse(
        answer=answer,
        sources=sources,
        found=True
    )

from pydantic import BaseModel
from typing import Optional

class FeedbackRequest(BaseModel):
    user_id: str
    question: str
    is_helpful: bool
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    message: str

@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(request: FeedbackRequest):
    return FeedbackResponse(message="Feedback received successfully.")

