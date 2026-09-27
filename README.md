# KnowVault AI
**Your Knowledge. Your Vault. Your AI.**

KnowVault AI is a privacy-first personal knowledge assistant. It allows users to upload documents (TXT, DOCX) or paste text, and then ask questions. The system strictly isolates data per user, preventing cross-user data leakage.

## Architecture & Pipeline
- **Frontend**: Next.js (App Router), Tailwind CSS, TypeScript
- **Backend**: FastAPI, Python
- **RAG Pipeline**:
  - Upload -> Text Extraction -> Normalization -> Chunking
  - Embeddings generation via `SentenceTransformers` (`all-MiniLM-L6-v2`)
  - Storage in `ChromaDB` (Persistent)
  - Semantic retrieval with user filtering
  - Confidence guard to prevent hallucination
  - LLM generation (Gemini) with Source Proof

## Privacy Model
This project implements application-level tenant isolation. Every chunk stored in the vector DB is tagged with a `user_id`. Queries strictly enforce `where={"user_id": user_id}`. (Note: Demo authentication is used for the prototype).

## Installation & Setup
1. Clone the repository and navigate to `knowvault-ai`.
2. **Backend**:
   - `cd backend`
   - `python -m venv venv`
   - `.\venv\Scripts\Activate.ps1`
   - `pip install -r requirements.txt`
   - Configure `.env` with `LLM_API_KEY`
   - Start: `uvicorn app.main:app --reload --port 8000`
3. **Frontend**:
   - `cd frontend`
   - `npm install`
   - Start: `npm run dev`

## Sample Demo
- Open `http://localhost:3000`
- Select **User A** -> Upload `sample_data/company_report.txt`
- Select **User B** -> Upload `sample_data/ai_research_report.docx`
- Ask questions. You'll observe User A cannot access User B's knowledge.

## Limitations
- OCR / PDF not supported out of the box.
- Authentication is a dropdown for demo purposes.
