# CivicOps — AI-Powered Civic Paperwork Assistant

CivicOps turns dense government notices, citations, permits, and tax bills into structured data, grounded official procedures, and actionable personalized step-by-step resolution plans using Google Gemini.

> **Status:** `Day 3 — Research Agent + Workflow Agent Active`  
> Research Agent + Workflow Agent working — Research Agent has web/gov-source lookup tools rather than pure model recall for procedures. Workflow Agent diffs required vs. available documents and schedules personalized action tasks. Action Agent and Monitoring Agent are not yet built (future milestones).

---

## 🏛️ Autonomous Agent Pipeline (Day 3 Architecture)

```
Government Notice (PDF/PNG/JPG)
         │
         ▼
[ Document Agent ]  ──▶ Extracts structured notice JSON (type, authority, APN/citation, deadline, proofs)
         │
         ▼
[ Research Agent ]  ──▶ Grounded search on .gov portals / civic codes to identify official procedure, rules & fees
         │
         ▼
[ Citizen Inventory ] ──▶ Citizen indicates which required documents they have on hand
         │
         ▼
[ Workflow Agent ]  ──▶ Diffs required vs available docs, schedules upload tasks & sequences personalized action plan
         │
         ▼
[ Action Plan UI ]  ──▶ Case tracking, dynamic progress %, missing document alerts & interactive task execution
```

---

## ✨ Features (Day 3 Milestone)

- 📄 **Multimodal Notice Upload & Extraction (`DocumentAgent`)**:
  - Leverages Google Gemini multimodal capabilities.
  - Extracts key notice metadata into `NoticeStructuredData` schema with strict anti-hallucination (`"Not found"` fallback).
- 🔍 **Grounded Civic Research Agent (`ResearchAgent`)**:
  - Grounded lookup with government domain filtering (`.gov`, municipal portals, county assessor portals).
  - Determines formal procedure name, administering authority, submission channel, required documents, sequential steps, deadline rules, and fees.
  - Output conforms to `ProcedureResearchData` strict schema without guessing unverified information.
- ⚡ **Personalized Workflow Agent (`WorkflowAgent`)**:
  - Diffs required procedure documents against user-provided documents.
  - Automatically schedules `"Upload {missing document}"` tasks for items the citizen lacks.
  - Generates a unique tracking case identifier (`CIV-XXXX`), priority assessment, and ordered task sequence.
- 🌐 **Interactive Frontend UI**:
  - **Document Checklist**: Citizens check off documents they have on hand or add additional evidence.
  - **Live Agent Activity Terminal (`AgentActivity`)**: Real-time staged reveal of multi-agent collaboration with authoritative sources citations.
  - **Personalized Action Plan (`ActionPlanCard`)**: Progress bar, priority badges, deadline countdowns, missing document alerts, and interactive task completion toggles.
  - **1-Click Test Samples**: Property tax delinquency, building permit correction resubmission, and parking citations.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** & `npm`

---

### 2. Obtain a Google Gemini API Key
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Sign in with your Google account and click **Get API key**.
3. Create a new key and copy the value.

---

### 3. Backend Setup

1. **Navigate to project root and create a virtual environment:**
   ```bash
   # Windows (PowerShell)
   python -m venv .venv
   .venv\Scripts\activate

   # macOS / Linux
   python3 -m venv .venv
   source .venv/bin/activate
   ```

2. **Install Python dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure Environment Variables:**
   Copy `.env.example` to `.env` in the root folder:
   ```bash
   cp .env.example .env
   ```
   Open `.env` and set your key:
   ```env
   GEMINI_API_KEY=AIzaSy...your_actual_key_here
   GEMINI_MODEL=gemini-2.0-flash
   PORT=8000
   UPLOAD_DIR=backend/uploads
   MAX_FILE_SIZE_MB=10
   ```

4. **Run Backend Server:**
   ```bash
   # From root directory:
   uvicorn backend.main:app --reload --port 8000
   ```
   The backend API will be live at `http://localhost:8000`.  
   API Documentation available at `http://localhost:8000/docs`.

---

### 4. Frontend Setup

1. **Open a new terminal, navigate to `/frontend`:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run the Next.js Development Server:**
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.

---

## 🧪 Testing

Run all unit and integration test suites:
```bash
pytest
```
*Includes 21 automated test cases covering Document Agent extraction, Research Agent grounded lookup, anti-hallucination unverified field preservation, Workflow Agent document diffing, upload task generation, and API endpoints.*

---

## 📅 Roadmap & Milestones

- [x] **Day 1: Project Skeleton & Gemini Multimodal Wiring**
- [x] **Day 2: Document Intelligence Agent & Structured Notice Extraction**
- [x] **Day 3: Research Agent + Workflow Agent (Grounded Procedures & Personalized Action Plans)**
- [ ] **Day 4: Action Agent (Automated Form Filling & Dispute Letter Generation)**
- [ ] **Day 5: Monitoring Agent (Submission Tracking & Status Webhooks)**
- [ ] **Day 6: Polish, E2E Integration & Demo Packaging**
