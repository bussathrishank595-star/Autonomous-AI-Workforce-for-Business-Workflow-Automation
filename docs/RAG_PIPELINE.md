# Retrieval-Augmented Generation (RAG) Pipeline

This document explains the technical details of the AgentOS RAG implementation.

## Ingestion Flow
1. Files (PDF, DOCX, TXT) are processed by `DocumentIngestionAgent`.
2. Hashing: A SHA-256 hash is computed for each uploaded file's binary buffer. If the hash exists in the database, ingestion is skipped.
3. Parsing: Text is extracted.
4. Chunking: Text is split semantically at punctuation boundaries (max 800 characters per chunk).
5. Embedding Generation: Chunks are batched and sent to Cohere (`embed-english-v3.0`).
6. Storage: Segment blocks and 1024-dimensional float arrays are saved inside Supabase PostgreSQL.

## Retrieval Flow
1. The user's query is converted to a vector embedding.
2. Cosine similarity calculations are executed using `pgvector` database indexing:
   `1 - (embedding <=> query_vector::vector)`
3. The top-K segments are merged and parsed by the LLM (Groq) for final semantic filtering.
