# API Reference

## `GET /api/health`
Check if the backend is running.

## `POST /api/documents/upload`
Upload a DOCX or TXT file.
- **Form Data**: `file` (File), `user_id` (string)
- **Response**: `{ "document_id": "...", "chunk_count": N, "message": "..." }`

## `POST /api/documents/paste`
Upload pasted text.
- **Body**: `{ "user_id": "...", "text": "...", "source_name": "..." }`

## `POST /api/chat`
Ask a question.
- **Body**: `{ "user_id": "...", "question": "..." }`
- **Response**: `{ "answer": "...", "sources": [...], "found": true/false }`
