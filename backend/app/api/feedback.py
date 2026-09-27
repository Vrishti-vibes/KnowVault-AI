from fastapi import APIRouter
from pydantic import BaseModel
from typing import Optional
from datetime import datetime

router = APIRouter()

class FeedbackRequest(BaseModel):
    user_id: str
    answer_id: str
    is_helpful: bool
    comment: Optional[str] = None

class FeedbackResponse(BaseModel):
    message: str

# In a real app, this would save to a database.
# For the prototype, we just log it conceptually.
@router.post("/feedback", response_model=FeedbackResponse)
def submit_feedback(request: FeedbackRequest):
    # Here we would save to Postgres or SQLite
    return FeedbackResponse(message="Feedback received successfully.")
