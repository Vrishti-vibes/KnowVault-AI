# Testing

We use `pytest` for backend testing.

## Running Tests
Ensure you are in the `backend` directory and your virtual environment is active.
```bash
pytest tests/
```

## Coverage
- `test_chunking.py`: Verifies the chunking logic and overlap correctness.
- `test_backend.py`: Mocks the vector db and LLM to test the API endpoints (`/api/chat`, `/api/health`, `/api/documents/paste`).
- **Privacy Test**: Evaluates that a user cannot retrieve chunks with a different `user_id`. (Checked conceptually via the filtering logic in `vector_store.py`).
