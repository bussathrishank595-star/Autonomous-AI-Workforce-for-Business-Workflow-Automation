# AgentOS – Autonomous AI Workforce for Business Workflow Automation

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Framework: Next.js](https://img.shields.io/badge/Framework-Next.js-blue.svg)](https://nextjs.org/)
[![Database: Supabase](https://img.shields.io/badge/Database-Supabase-green.svg)](https://supabase.com/)
[![Vector: pgvector](https://img.shields.io/badge/Vector-pgvector-orange.svg)](https://github.com/pgvector/pgvector)
[![Embeddings: Voyage AI](https://img.shields.io/badge/Embeddings-Voyage%20AI-purple.svg)](https://www.voyageai.com/)
[![LLM: Groq Llama-3](https://img.shields.io/badge/LLM-Groq%20Llama--3-red.svg)](https://groq.com/)

**AgentOS** is an enterprise-grade autonomous AI workforce orchestrator designed to transform natural language goal directives into structured, executable business workflows. By leveraging Retrieval-Augmented Generation (RAG), a specialized Mission Planner, and a network of cooperative AI agents, AgentOS automates end-to-end recruitment pipelines—from document ingestion to Gmail outreach, Google Calendar event scheduling, and final report compilation.

---

## 📖 Table of Contents
- [Overview](#-overview)
- [Key Features](#-key-features)
- [System Architecture](#-system-architecture)
- [RAG Pipeline](#-rag-pipeline)
- [Multi-Agent Workforce](#-multi-agent-workforce)
- [Workflow Example](#-workflow-example)
- [Tech Stack](#-tech-stack)
- [Folder Structure](#-folder-structure)
- [Installation](#-installation)
- [Environment Variables](#-environment-variables)
- [Usage Guide](#-usage-guide)
- [Security Model](#-security-model)
- [Performance & Optimization](#-performance--optimization)
- [Roadmap](#-roadmap)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🌟 Overview

### The Business Challenge
Traditional conversational AI systems are *passive responders*. They produce recommendations, drafts, or analysis, but cannot take actions. Resolving complex business workflows—like candidate selection, screening, email invitation, calendar coordination, and generating feedback reports—still requires human teams to copy-paste context between multiple disconnected applications.

### The AgentOS Solution
AgentOS bridges the gap between reasoning and action by deploying an **Autonomous Multi-Agent Workforce**. Instead of reading entire files directly, the system uses a **Retrieval-Augmented Generation (RAG)** pipeline backed by `pgvector` and Voyage AI. Agents only pull relevant candidate chunks through a centralized Knowledge Agent, creating a secure, highly scalable sandbox where goal-directed tasks are planned, approved, and executed.

---

## ⚡ Key Features

| Feature | Description |
| :--- | :--- |
| **Multi-Agent Architecture** | Interoperative agents executing specialized steps (Ingestion, Search, Filter, Rank, Email, Calendar, Report). |
| **RAG Knowledge Base** | Powered by Supabase PostgreSQL and `pgvector` for scalable, semantic-based chunk searches. |
| **Duplicate File Hashing** | SHA-256 duplicate validation logic to skip redundant embedding calculations. |
| **Modular Provider Model** | Pluggable interface bindings allowing hot-swappable LLM (Groq) and Embedding (Voyage) providers. |
| **Human-In-The-Loop Approval** | Email and Meeting drafts are staged as pending actions; never dispatched without explicit user confirmation. |
| **Semantic Matching** | Matches context intelligently (e.g. *React Developer* matches *Frontend Engineer*). |
| **Explainable AI Logging** | Every agent records its cognitive execution timeline to a unified dashboard console log. |

---

## 📐 System Architecture

The following flowchart outlines how user goal directives cascade through the planner, database, and specialized agents:

```mermaid
graph TD
    User([User Directive]) -->|Submits Goal| MP[Mission Planner Agent]
    MP -->|Generates Task Sequence| WEE[Workflow Execution Engine]
    WEE -->|Executes Tasks| IA[Ingestion Agent]
    WEE -->|Executes Tasks| FA[Filter Agent]
    WEE -->|Executes Tasks| RA[Ranking Agent]
    WEE -->|Executes Tasks| EA[Email Agent]
    WEE -->|Executes Tasks| CA[Calendar Agent]
    WEE -->|Executes Tasks| RepA[Report Agent]
    
    FA -->|Query Context| KA[Knowledge Agent]
    KA -->|Query Embeddings| VDB[(pgvector DB)]
    
    EA -->|Stages Outbox| Hil[Human-in-the-Loop Approval]
    CA -->|Stages Invites| Hil
    
    Hil -->|Approved| Gmail[Gmail API]
    Hil -->|Approved| Calendar[Google Calendar API]
    RepA -->|Compiles| Out([Printable Report & Metrics])
```

---

## 🔍 RAG Pipeline

AgentOS operates on a secure, query-driven RAG execution architecture:

```mermaid
sequenceDiagram
    autonumber
    actor User
    participant Ingest as Ingestion Agent
    participant Voyage as Voyage AI
    participant DB as Supabase pgvector
    participant Knowledge as Knowledge Agent
    participant LLM as Llama-3 (Groq)

    User->>Ingest: Uploads Resume Document
    Ingest->>Ingest: Extract text & SHA-256 Hash check
    Ingest->>Voyage: Request embeddings for chunks (voyage-3)
    Voyage-->>Ingest: Return 1024-dimension float array
    Ingest->>DB: Store chunks & vector embeddings
    User->>Knowledge: Execute search query
    Knowledge->>Voyage: Convert search query to embedding
    Voyage-->>Knowledge: Return query vector
    Knowledge->>DB: Search top-K similarity chunks (<=> Cosine Distance)
    DB-->>Knowledge: Return relevant chunks context
    Knowledge->>LLM: Pass merged context for semantic ranking/outreach
    LLM-->>User: Return structured JSON match recommendations
```

---

## 🤖 Multi-Agent Workforce

AgentOS splits execution responsibilities across specialized cooperative agents:

*   **Mission Planner**: The mastermind agent. Translates natural language directives into structured JSON tasks and execution plans.
*   **Knowledge Agent**: The sole gatekeeper of the Vector Database. Generates query embeddings and performs similarity searches.
*   **Ingestion Agent**: Manages text parsing (PDF, DOCX, TXT), paragraph segmentation, and uploads chunk embeddings to `pgvector`.
*   **Filter Agent**: Synthesizes RAG chunks to screen candidates matching requirements.
*   **Ranking Agent**: Grades filtered resumes (0-100) using multi-factor parameters (skills, education, relevance).
*   **Email Agent**: Stages outreach templates in the database and dispatches live Gmail messages upon approval.
*   **Calendar Agent**: Sets up Google Calendar invites and Meet URLs for shortlisted candidates.
*   **Report Agent**: Automatically compiles a structured breakdown of selected/rejected candidates into a printable HTML report.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Next.js (App Router), Tailwind CSS, Lucide icons |
| **Backend** | Next.js Server Actions & API Routes |
| **Database** | Supabase (PostgreSQL) |
| **Vector Index** | `pgvector` (1024-dimension cosine similarity indexing) |
| **AI Engine** | Groq (`llama-3.3-70b-versatile`) |
| **Embeddings** | Voyage AI (`voyage-3`) |
| **ORM** | Prisma v7 |
| **Authentication** | NextAuth.js (Credentials Strategy) |
| **Integrations** | Google Gmail API, Google Calendar API (OAuth2) |

---

## 📂 Folder Structure

```
├── prisma/
│   └── schema.prisma        # Database models & pgvector configurations
├── src/
│   ├── agents/              # AI Workforce Agents
│   │   ├── ingestion-agent/ # Chunking & embedding ingestion
│   │   ├── knowledge-agent/ # pgvector querying & similarity search
│   │   ├── filter-agent/    # Semantic matching
│   │   ├── ranking-agent/   # Multi-factor candidate scoring
│   │   ├── email-agent/     # Gmail helper
│   │   ├── calendar-agent/  # Google Calendar coordinator
│   │   ├── report-agent/    # Summary HTML builder
│   │   └── index.ts         # Agent interface typings
│   ├── app/                 # Next.js App Router Pages & API handlers
│   ├── components/          # Reusable UI widgets
│   ├── services/            # Client integrations (Voyage, Groq, Google)
│   └── types/               # TypeScript type definitions
```

---

## ⚡ Installation

### Prerequisites
- Node.js (v18.x or later)
- PostgreSQL Database with `pgvector` extension enabled (e.g., Supabase)

### Setup Steps
1. **Clone the Repository**
   ```bash
   git clone https://github.com/tejosai09-sketch/Autonomous-AI-Workforce-for-Business-Workflow-Automation-.git
   cd Autonomous-AI-Workforce-for-Business-Workflow-Automation-
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   DATABASE_URL="postgresql://username:password@host:port/dbname?schema=public"
   GROQ_API_KEY="your-groq-api-key"
   VOYAGE_API_KEY="your-voyage-api-key"
   NEXTAUTH_SECRET="your-jwt-nextauth-secret-key"
   NEXTAUTH_URL="http://localhost:3000"
   GOOGLE_CLIENT_ID="your-google-oauth-client-id"
   GOOGLE_CLIENT_SECRET="your-google-oauth-client-secret"
   GOOGLE_REDIRECT_URI="http://localhost:3000/api/auth/callback/google"
   ```

4. **Initialize pgvector & Database Schema**
   ```bash
   npx prisma db push
   npx prisma generate
   ```

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🛡️ Security Model
- **Google OAuth2**: Candidate outreaches are dispatched through your personal connected Google account using offline-access authorization.
- **Human-In-The-Loop (HITL)**: All calendar meetings and outreach emails remain staged under `PENDING_APPROVAL` status. No message is sent without explicit user confirmation.
- **Credential Storage**: Access tokens are stored as encrypted JSON payloads inside PostgreSQL.

---

## 📄 License
This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👥 Authors
- **Tejosai** - [GitHub](https://github.com/tejosai09-sketch)
- **Thrishank** - [GitHub](https://github.com/bussathrishank595-star)
