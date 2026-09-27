import pytest
from app.services.chunking import chunk_text

def test_chunk_text():
    text = "This is a simple text that we want to chunk into smaller pieces to see if it works properly with the overlap logic."
    # 23 words total. Let's chunk by 10 words with 2 overlap
    chunks = chunk_text(text, chunk_size=10, chunk_overlap=2)
    assert len(chunks) > 0
    assert "This is a simple text that we want to chunk" in chunks[0]
    
def test_chunk_empty():
    assert chunk_text("", 10, 2) == []
    assert chunk_text("   ", 10, 2) == []

def test_chunk_overlap():
    text = "one two three four five six seven eight nine ten"
    chunks = chunk_text(text, 6, 2)
    assert chunks[0] == "one two three four five six"
    assert chunks[1] == "five six seven eight nine ten"
