from app.utils.config import settings

class ConfidenceGuard:
    def check_confidence(self, retrieved_items: list) -> bool:
        if not retrieved_items:
            return False
            
        # Check if the best match meets the threshold
        best_relevance = retrieved_items[0]['relevance']
        if best_relevance < settings.RETRIEVAL_THRESHOLD:
            return False
            
        return True

confidence_guard = ConfidenceGuard()
