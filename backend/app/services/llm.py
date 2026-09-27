import google.generativeai as genai
from app.utils.config import settings

class LLMProvider:
    def __init__(self):
        if settings.LLM_PROVIDER == "gemini":
            genai.configure(api_key=settings.LLM_API_KEY)
            self.model = genai.GenerativeModel(settings.LLM_MODEL)
            
    def generate_answer(self, question: str, context: str) -> str:
        prompt = f"""
SYSTEM INSTRUCTIONS:
You are KnowVault AI, a private knowledge assistant.
Answer the user's question using ONLY the provided document context.
Do not invent facts. Do not use outside knowledge.
If the context does not contain the answer, say "I couldn't find this in your knowledge base."
Keep answers concise and useful.

RETRIEVED DOCUMENT CONTEXT:
{context}

USER QUESTION:
{question}
"""
        if settings.LLM_PROVIDER == "gemini" and settings.LLM_API_KEY:
            try:
                response = self.model.generate_content(prompt)
                return response.text
            except Exception as e:
                print(f"Gemini API Error: {e}")
                return f"[Mock Answer - API Key Missing or Invalid] According to the context, here is what I found about your question: {question}"
        
        # Fallback or mock
        return f"[Mock LLM] Context provided was used to answer: {question}"

llm_provider = LLMProvider()
