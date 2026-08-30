# CivicOps — AI-Powered Civic Paperwork Assistant

CivicOps turns dense government notices, citations, permits, and tax bills into structured data, grounded official procedures, and actionable personalized step-by-step resolution plans with autonomous preparation, server-enforced human authorization, persistent cloud storage, and continuous asynchronous monitoring.

> **Status:** `Day 5 — Production + Monitoring (Firestore, Cloud Storage, Monitoring Agent, Async Execution, Cloud Run Deployment)`  
> The 5-agent suite (Document, Research, Workflow, Action, Monitoring) is complete. Documents persist in Google Cloud Storage with metadata in Cloud Firestore. The Monitoring Agent autonomously tracks case status via Cloud Tasks and a transparent Demo Status Provider, detects agency determinations, reasons about severity, and dynamically updates workflows and citizen alerts.

---

## 🏛️ Autonomous 5-Agent Architecture

```
Government Notice (PDF/PNG/JPG)
         │
         ▼
[ Document Agent ]   ──▶ GCS ingestion & structured notice extraction into Firestore
         │
         ▼
[ Research Agent ]   ──▶ Grounded search on .gov portals / civic codes to identify official procedure & rules
         │
         ▼
[ Citizen Inventory ] ──▶ Citizen indicates available documents
         │
         ▼
[ Workflow Agent ]   ──▶ Diffs required vs available docs & sequences Firestore-backed action plan
         │
         ▼
[ Action Agent ]     ──▶ Prepares formal dispute/petition package with strict anti-fabrication proof matching
         │
         ▼
[ Human Approval Gate ] ──▶ Citizen explicitly authorizes consequential submission
         │
         ▼
[ Submission Agent ] ──▶ Executes filing against simulated CivicOps Demo Gateway (Sandbox receipt issued)
         │
         ▼
[ Cloud Tasks / Async ] ──▶ Schedules periodic background monitoring checks hitting POST /monitor/{case_id}
         │
         ▼
[ Monitoring Agent ] ──▶ Compares status:
                           ├── (Status Same) ──▶ Continue monitoring
                           └── (Status Changed) ──▶ Reason about severity ──▶ Inject new task into Workflow ──▶ Notify citizen
```

---

## ✨ Features (Day 5 Milestone)

- 📄 **Cloud Storage Document Ingestion (`StorageService` & `DocumentAgent`)**:
  - Moves uploads to Google Cloud Storage (`gs://...`) with structured metadata indexed in Firestore.
  - Multimodal parsing with `"Not found"` anti-hallucination defaults.
- 🔍 **Grounded Civic Research (`ResearchAgent`)**:
  - Official procedure lookup biased toward `.gov` domains with statutory citation tracking.
- ⚡ **Personalized Action Plan (`WorkflowAgent`)**:
  - Diffs citizen documents against official requirements and creates sequenced tasks.
- ✍️ **Application Generator & Action Agent (`ActionAgent`)**:
  - Automatically drafts formal administrative petitions, appeal letters, and correction requests.
  - Strict anti-fabrication: only lists attached supporting proofs verified by the citizen.
- 🔒 **Server-Enforced Human Approval Gate (`ApprovalRecord`)**:
  - Submissions are rejected with **HTTP 403 Forbidden** unless explicit human authorization is recorded on the server.
- 🧪 **Demo Status Provider (`DemoStatusProvider`)**:
  - Transparent simulated government gateway providing live polling and state flipping (e.g. `under_review`, `additional_information_required`, `approved`, `rejected`).
- 🤖 **Autonomous Monitoring Agent (`MonitoringAgent`)**:
  - Autonomous reasoning over agency determinations.
  - Decides on severity (`low`, `medium`, `high`), generates plain-language explanations, and dynamically mutates the case's workflow with follow-up tasks (e.g. *"Upload ownership proof"*).
- 🔔 **In-App Citizen Notifications & Timeline (`CaseNotification` & `FirestoreService`)**:
  - Real-time alert banners and audit log tracking status changes across the case lifecycle.
- ⏳ **Asynchronous Execution via Cloud Tasks (`CloudTasksService`)**:
  - Schedules background monitoring tasks hitting `POST /monitor/{case_id}` so case tracking continues after the citizen departs.
- ☁️ **Cloud Run Production Deployment (`Dockerfile`)**:
  - Containerized FastAPI backend with environment-driven configuration and zero hardcoded localhost paths.

---

## 🚀 Quick Start

### 1. Prerequisites
- **Python 3.10+** (Python 3.11 recommended)
- **Node.js 18+** & `npm`
- **Google Cloud SDK (`gcloud`)** (for GCP deployment)

---

### 2. Configure Environment Variables

Copy `.env.example` to `.env` in the root folder:
```bash
cp .env.example .env
```
Configure your credentials:
```env
GEMINI_API_KEY=AIzaSy...your_gemini_key_here
GEMINI_MODEL=gemini-2.0-flash
PORT=8000
HOST=0.0.0.0
BACKEND_SERVICE_URL=http://localhost:8000

# Google Cloud Platform (Optional for local testing, required for Cloud Run)
GOOGLE_CLOUD_PROJECT=your-gcp-project-id
FIRESTORE_DATABASE=(default)
GCS_BUCKET=civicops-documents-bucket
CLOUD_TASKS_QUEUE=civicops-monitoring-queue
CLOUD_TASKS_LOCATION=us-central1
```

---

### 3. Run Backend Locally

```bash
# 1. Activate virtual environment
python -m venv .venv
.venv\Scripts\activate  # Windows
# source .venv/bin/activate  # macOS/Linux

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start FastAPI server
uvicorn backend.main:app --reload --port 8000
```
Backend API docs available at `http://localhost:8000/docs`.

---

### 4. Run Frontend Locally

```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

---

### 5. Deploy to Google Cloud Run

See [`docs/deployment.md`](docs/deployment.md) for full instructions:
```bash
gcloud run deploy civicops-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,FIRESTORE_DATABASE=(default),GCS_BUCKET=YOUR_BUCKET"
```

---

## 🧪 Testing

Run all unit and integration test suites:
```bash
python -m pytest
```
*Includes 33 automated test cases covering Document Agent extraction, Research Agent grounded lookup, Workflow Agent diffing, Action Agent application preparation, Human Approval Gate, Firestore persistence, Demo Status Provider, Monitoring Agent reasoning, and full end-to-end autonomous lifecycle.*

---

## 📅 Roadmap & Milestones

- [x] **Day 1: Project Skeleton & Gemini Multimodal Wiring**
- [x] **Day 2: Document Intelligence Agent & Structured Notice Extraction**
- [x] **Day 3: Research Agent + Workflow Agent (Grounded Procedures & Personalized Action Plans)**
- [x] **Day 4: Action Agent + Human Approval Gate + Sandbox Execution**
- [x] **Day 5: Production + Monitoring (Firestore, Cloud Storage, Monitoring Agent, Cloud Tasks, Cloud Run)**
- [ ] **Day 6: UI Polish, Final Architecture Diagram, Screenshots & Demo Packaging**
