# Viva Questions

1. **What is RAG?**
   Retrieval-Augmented Generation (RAG) is a technique that enhances an LLM's answers by retrieving relevant information from an external knowledge base (like our ChromaDB) and providing it as context to the LLM.

2. **Why RAG instead of fine-tuning?**
   Fine-tuning is expensive, requires a lot of data, and struggles to update facts dynamically. RAG allows for real-time knowledge updates simply by adding documents to the database without retraining the model.

3. **What are embeddings?**
   Embeddings are numerical representations (vectors) of text. They capture semantic meaning, so texts with similar meanings have vectors that are closer together in the vector space.

4. **Why ChromaDB?**
   ChromaDB is a lightweight, open-source vector database that is easy to embed directly in Python applications. It's excellent for academic projects and rapid prototyping.

5. **What is chunking and why overlap?**
   Chunking splits large documents into smaller pieces. Overlap ensures that context isn't lost if a sentence or idea spans across the boundary of two chunks.

6. **How does user isolation work?**
   Every chunk stored in the database has a `user_id` in its metadata. During retrieval, the query explicitly filters results using `where={"user_id": current_user_id}` so data from other users is completely invisible.

7. **How does the confidence guard work?**
   After retrieving chunks, we check their relevance score (based on vector distance). If the best matching chunk has a relevance score below a configured threshold, we block the LLM call and return a safe "I don't know" response. This prevents hallucination.
