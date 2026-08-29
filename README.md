# CivicOps — AI-Powered Civic Paperwork Assistant

CivicOps turns dense government notices, citations, permits, and tax bills into structured data, grounded official procedures, and actionable personalized step-by-step resolution plans with autonomous preparation and server-enforced human authorization using Google Gemini.

> **Status:** `Day 4 — Action Agent + Human Approval Gate Active`  
> Action Agent + human approval flow working — applications are prepared and reviewed by the user before any submission; all submissions go through a clearly labeled sandbox/demo gateway, not a real government system. Case persistence uses file-backed storage (`data/cases.json`); Firestore/cloud migration planned for Day 5. Monitoring Agent is a future milestone.

---

## 🏛️ Autonomous Agent Pipeline (Day 4 Architecture)

```
Government Notice (PDF/PNG/JPG)
         │
         ▼
[ Document Agent ]   ──▶ Extracts structured notice JSON (type, authority, APN/citation, deadline, proofs)
         │
         ▼
[ Research Agent ]   ──▶ Grounded search on .gov portals / civic codes to identify official procedure & rules
         │
         ▼
[ Citizen Inventory ] ──▶ Citizen indicates which required documents they have on hand
         │
         ▼
[ Workflow Agent ]   ──▶ Diffs required vs available docs, schedules upload tasks & sequences action plan
         │
         ▼
[ Action Agent ]     ──▶ Prepares formal dispute/petition package with verified attached documents
         │
         ▼
[ Human Approval Gate ] ──▶ Citizen reviews & explicitly authorizes consequential submission
         │
         ▼
[ Submission Agent ] ──▶ Executes filing against simulated CivicOps Demo Gateway (Sandbox receipt issued)
         │
         ▼
[ Monitoring Agent ] ──▶ (Day 5 Milestone: Status polling, webhooks & escalation)
```

---

## ✨ Features (Day 4 Milestone)

- 📄 **Multimodal Notice Ingestion (`DocumentAgent`)**: Multimodal extraction into structured schemas with `"Not found"` anti-hallucination defaults.
- 🔍 **Grounded Civic Research (`ResearchAgent`)**: Official procedure lookup biased toward `.gov` domains with citation tracking.
- ⚡ **Personalized Action Plan (`WorkflowAgent`)**: Diffs available citizen documents against statutory requirements and builds sequenced tasks.
- ✍️ **Application Generator & Action Agent (`ActionAgent`)**:
  - Automatically drafts formal administrative petitions, appeal letters, and correction requests.
  - **Strict Anti-Fabrication**: Only lists supporting documents that the citizen actually provided; explicitly flags unattached items.
- 🔒 **Server-Enforced Human Approval Gate (`ApprovalRecord`)**:
  - Distinguishes between safe preparatory actions and consequential execution.
  - Submissions are rejected with **HTTP 403 Forbidden** unless an explicit human authorization record exists for that case.
- 🧪 **CivicOps Demo Gateway (Sandbox)**:
  - Transparent simulation environment that issues realistic submission receipts (e.g. `DEMO-SUB-892147`) without contacting live government databases.
- 📊 **Unified Multi-Agent Activity Timeline (`CaseActivityTimeline`)**:
  - Real-time audit trail across Document, Research, Workflow, Action, Human Approval, Submission, and Monitoring stages.
- 💾 **Persistent Case Repository (`CivicCase`)**:
  - Preserves notice, research, workflow, application, approval tokens, and submission receipts in file-backed storage (`data/cases.json`).

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
   uvicorn backend.main:app --reload --port 8000
   ```
   The backend API will be live at `http://localhost:8000`.  
   API Documentation available at `http://localhost:8000/docs`.

---

### 4. Frontend Setup

1. **Navigate to `/frontend`:**
   ```bash
   cd frontend
   npm install
   ```

2. **Run Next.js Development Server:**
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
*Includes 26 automated test cases covering Document Agent extraction, Research Agent grounded lookup, Workflow Agent diffing, Action Agent application preparation, Anti-Fabrication document verification, and Server-Enforced Human Approval Gate submission.*

---

## 📅 Roadmap & Milestones

- [x] **Day 1: Project Skeleton & Gemini Multimodal Wiring**
- [x] **Day 2: Document Intelligence Agent & Structured Notice Extraction**
- [x] **Day 3: Research Agent + Workflow Agent (Grounded Procedures & Personalized Action Plans)**
- [x] **Day 4: Action Agent + Human Approval Gate + Sandbox Execution**
- [ ] **Day 5: Monitoring Agent (Submission Tracking & Cloud/Firestore Persistence)**
- [ ] **Day 6: Polish, E2E Integration & Demo Packaging**
