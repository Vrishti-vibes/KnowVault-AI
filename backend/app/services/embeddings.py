from app.utils.config import settings

class EmbeddingService:
    def __init__(self):
        self._model = None
        
    @property
    def model(self):
        if self._model is None:
            # Lazy import and load
            from sentence_transformers import SentenceTransformer
            self._model = SentenceTransformer(settings.EMBEDDING_MODEL)
        return self._model
        
    def embed_text(self, text: str) -> list:
        return self.model.encode(text).tolist()

    def embed_texts(self, texts: list) -> list:
        return self.model.encode(texts).tolist()

embedding_service = EmbeddingService()
