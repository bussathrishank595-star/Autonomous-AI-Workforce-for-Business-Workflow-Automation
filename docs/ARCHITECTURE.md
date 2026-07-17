# Detailed System Architecture

This document describes the design principles and system components of **AgentOS**.

## Component Interactions

### 1. Document Ingestion Pipeline
When a user uploads resume documents, the `IngestionAgent` parses the files, segments the plain text semantically into sentences/paragraphs (max 800 characters), and requests 1024-dimensional float arrays from Voyage AI (`voyage-3`). The chunks are written to PostgreSQL using Prisma raw SQL injections matching the target `vector` type.

### 2. Centralized Knowledge Agent (RAG Gatekeeper)
No AI workforce agent has direct select/read access to the `DocumentChunk` table. If an agent (e.g., `FilterAgent`) requires candidate resume information:
1. It queries `KnowledgeAgent` with a description prompt.
2. `KnowledgeAgent` converts the prompt to a search vector.
3. It performs a cosine distance lookup (`<=>` operator) using pgvector.
4. It merges the top-K chunks and returns a secure, structured context payload.

### 3. Agent Execution Engine
The `MissionPlanner` creates sequential `Task` rows in the database linked to the master `Workflow` run. The main server executes these tasks sequentially. The interface maps intermediate task states on the dashboard UI timeline.
