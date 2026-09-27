import re
from typing import List

def chunk_text(text: str, chunk_size: int, chunk_overlap: int) -> List[str]:
    """
    Chunks text by word/token boundaries deterministically.
    """
    # Normalize whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    words = text.split(" ")
    
    if not words or not words[0]:
        return []

    chunks = []
    i = 0
    while i < len(words):
        chunk = words[i:i + chunk_size]
        chunks.append(" ".join(chunk))
        i += chunk_size - chunk_overlap
        if i >= len(words) - chunk_overlap:
            break

    return chunks
