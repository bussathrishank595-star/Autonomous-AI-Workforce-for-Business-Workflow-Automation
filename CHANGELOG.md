# Changelog

All notable changes to this project will be documented in this file.

## [1.0.0] - 2026-07-17
### Added
- Created modular RAG database schemas (`Workflow`, `Task`, `Resume`, `DocumentChunk`, `EmailHistory`, `MeetingHistory`).
- Implemented Cohere `embed-english-v3.0` 1024-dimension vector embeddings extraction.
- Enabled `pgvector` indexing and Cosine Distance similarity query integrations inside PostgreSQL database.
- Created cooperative workforce AI Agents (Planner, Filter, Ingestion, Knowledge, Ranking, Email, Calendar, and Report).
- Implemented Next.js Serverless Await configurations to support serverless deployment runtimes on Vercel.
