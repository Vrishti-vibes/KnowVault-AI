# Architecture

## Overview
KnowVault AI uses a client-server architecture with Next.js serving the UI and a FastAPI backend handling the logic and AI integrations.

## Components
1. **Frontend (Next.js)**: Handles user interaction, file selection, and displaying answers.
2. **Backend (FastAPI)**: REST API layer.
3. **Ingestion Pipeline**: Processes DOCX/TXT/text, chunks it, and creates embeddings.
4. **Vector Database (ChromaDB)**: Stores embeddings with metadata for fast similarity search.
5. **LLM Engine (Gemini)**: Generates human-readable answers grounded in the retrieved context.

## Privacy Model
Application-level filtering. Every chunk has a `user_id`. Queries apply a hard filter `where={"user_id": current_user_id}`.
