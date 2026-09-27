from pydantic import BaseModel
from typing import List, Optional

class SourceProof(BaseModel):
    source_name: str
    chunk_id: str
    snippet: str
    relevance: float
    version: Optional[int] = 1
    source_type: Optional[str] = "UNKNOWN"

class ChatRequest(BaseModel):
    user_id: str
    question: str
    document_ids: Optional[List[str]] = None

class ChatResponse(BaseModel):
    answer: str
    sources: List[SourceProof]
    found: bool

class UploadResponse(BaseModel):
    document_id: str
    chunk_count: int
    message: str

class PasteRequest(BaseModel):
    user_id: str
    text: str
    source_name: Optional[str] = "Pasted Knowledge"
