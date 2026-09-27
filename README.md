# KnowVault AI

A privacy-first Retrieval-Augmented Generation system that allows users to upload DOCX/TXT/PDF files or paste text and ask questions over their private knowledge.

## Links
- **GitHub Repository**: [https://github.com/Vrishti-vibes/KnowVault-AI](https://github.com/Vrishti-vibes/KnowVault-AI)
- **Live Demo**: *Requires manual deployment via Vercel and Railway dashboards*

## Features
- Upload knowledge documents (TXT, DOCX, PDF) or raw text.
- Unified ingestion pipeline (clean, chunk, embed).
- AI Q&A using Gemini over local vector database.
- Deep user isolation: User A cannot query User B's documents.
- Confidence guard: Refuses to hallucinate answers if knowledge isn't found.
- Document Versioning: Re-uploading increments document version safely.
- Selectable Document Mode: Chat with specific subset of documents.
- Evidence Proof: Displays exact source snippets and document metadata used to generate the answer.
- Chat History: View past questions and delete previous histories locally.

## Architecture

```text
User
 ↓
Next.js
 ↓
FastAPI
 ↓
Document ingestion
 ↓
Chunking
 ↓
Sentence Transformers
 ↓
ChromaDB
 ↓
Semantic Retrieval
 ↓
Confidence Guard
 ↓
Gemini
 ↓
Answer + Source Proof
```

## Tech Stack
- **Frontend**: Next.js (App Router), Tailwind CSS, React, Lucide Icons
- **Backend**: FastAPI, Python, Pytest
- **AI/ML**: `google-genai` (Gemini), `sentence-transformers`
- **Database**: ChromaDB (Vector Store)

## Local Setup

### Backend
1. `cd backend`
2. `python -m venv venv`
3. `.\venv\Scripts\Activate.ps1`
4. `pip install -r requirements.txt`
5. Create `.env` based on `.env.example` with `LLM_PROVIDER=gemini` and `LLM_API_KEY=<your_key>`.
6. Run server: `uvicorn app.main:app --port 8000`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## Deployment Architecture
**Backend** is designed to run on a platform like Railway or Render.
**Frontend** is designed to run on Vercel or Netlify.

### Environment Variables
**Backend:**
- `LLM_PROVIDER=gemini`
- `LLM_API_KEY=<your_key>`
- `LLM_MODEL=gemini-1.5-flash`
- `CHROMA_PATH=./chroma_db` (For production, ensure a persistent volume is mounted here)
- `CORS_ORIGINS=<deployed_frontend_url>`

**Frontend:**
- `NEXT_PUBLIC_API_URL=<deployed_backend_url>`

## Known Limitations
1. **User Authentication:** Demo user switching (User A / User B) is for demonstration only and is not real authentication. A proper production system would require JWTs and an Auth provider (e.g. NextAuth/Clerk).
2. **ChromaDB Persistence:** ChromaDB stores data locally on disk by default. When deployed to a PaaS like Railway, you *must* attach a persistent volume to the `CHROMA_PATH` directory, otherwise vector data will be lost on container restart.
