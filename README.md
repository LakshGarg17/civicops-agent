# CivicOps
Turn government paperwork into action.

CivicOps is an autonomous AI-powered civic paperwork assistant that turns dense government notices, citations, permits, and tax bills into structured data, grounded official procedures, personalized action plans, formal administrative petitions, and continuous asynchronous case tracking using Google Gemini and Google Cloud Platform.

---

## Problem
Millions of citizens receive confusing, high-stakes government paperwork every year—property tax assessments, code compliance warnings, building permit corrections, and municipal citations. Citizens struggle to understand legal jargon, miss strict statutory appeal windows, lack clarity on required evidence, and have no automated way to track case determinations after filing.

---

## Solution
CivicOps provides a complete autonomous pipeline with server-enforced human authorization:
1. **Multimodal Document Understanding**: Ingests notice PDFs and scans, extracting structured data without hallucination.
2. **Grounded Civic Research**: Researches governing municipal codes, filing fees, and authorities on `.gov` portals.
3. **Personalized Action Sequencing**: Diffs statutory requirements against citizen evidence to sequence a personalized plan.
4. **Autonomous Action Drafting**: Assembles formal dispute applications and petitions.
5. **Human-in-the-Loop Gate**: Consequential submissions require explicit user authorization before execution.
6. **Continuous Asynchronous Monitoring**: Cloud Tasks and the Monitoring Agent track case determinations in Cloud Firestore and dynamically update tasks when agencies request additional information.

---

## Features
- 📄 **Multimodal Notice Intelligence**: Multimodal parsing into structured schemas with `"Not found"` anti-hallucination defaults and trust verification badges.
- 🔍 **Grounded Procedure Research**: Official procedure lookup biased toward `.gov` sources with statutory rationale.
- ⚡ **Dynamic Action Plan & Next Action Highlight**: Interactive numbered checklist (`01`, `02`, `03`) with auto-computed prominent `NEXT ACTION` callout.
- ✍️ **Formal Petition Generator**: Formats formal administrative letters with strict anti-fabrication proof verification.
- 🔒 **Server-Enforced Human Approval Gate**: Preparatory actions run autonomously; filings require cryptographic human approval records (or return `403 Forbidden`).
- 🧪 **CivicOps Demo Gateway (Sandbox)**: Safe simulation portal issuing realistic filing receipts (`DEMO-SUB-...`).
- 🤖 **Autonomous Monitoring Agent**: Tracks case status in Firestore, reasons over agency determinations, and dynamically injects new follow-up tasks into the citizen's workflow.
- 🔔 **In-App Citizen Alert Banner**: Real-time status change detection callouts and action notifications.
- ☁️ **Cloud-Native Architecture**: Google Cloud Run, Cloud Firestore, Cloud Storage, and Cloud Tasks.

---

## How It Works
```
Understand (Document Agent) ──▶ Plan (Research & Workflow Agents) ──▶ Act (Action Agent + Human Gate) ──▶ Track (Monitoring Agent)
```

1. **Understand**: Citizen uploads a notice (`.pdf`, `.jpg`, `.png`). The Document Agent uploads the asset to Cloud Storage and extracts structured notice data.
2. **Plan**: The Research Agent queries official sources and provides procedural rationale; the Workflow Agent generates a numbered action plan based on available documents.
3. **Act**: The Action Agent drafts a formal dispute letter. The citizen reviews the package and grants explicit authorization. The filing is executed against the sandbox gateway.
4. **Track**: Background Cloud Tasks trigger the Monitoring Agent. When the demo agency updates the status (e.g., *Additional Information Required*), the agent updates the workflow and alerts the citizen.

---

## Agent Architecture

```
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Document Agent  │ ───▶  │ Research Agent  │ ───▶  │ Workflow Agent  │
│ Multimodal OCR  │       │ Grounded .gov   │       │ Diff & Sequence │
└─────────────────┘       └─────────────────┘       └─────────────────┘
                                                             │
                                                             ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ Monitoring Agent│ ◀───  │ Submission Gate │ ◀───  │  Action Agent   │
│ Async Reasoning │       │ Human Approval  │       │ Formal Petition │
└─────────────────┘       └─────────────────┘       └─────────────────┘
```

---

## Tech Stack
- **AI / Models**: Google Gemini 2.0 Flash (`google.generativeai` & Google AI Studio)
- **Backend**: Python 3.11, FastAPI, Pydantic, Uvicorn, Pytest
- **Frontend**: Next.js 14 (App Router), React 18, TypeScript, Tailwind CSS, Lucide Icons
- **Cloud Infrastructure**: Google Cloud Run, Cloud Firestore, Cloud Storage, Cloud Tasks

---

## Google Cloud Services
- **Google Cloud Run**: Fully managed container runtime hosting the FastAPI backend.
- **Google Cloud Firestore**: Scalable NoSQL database persisting cases, documents, workflows, and status history.
- **Google Cloud Storage (GCS)**: Secure bucket storage for citizen-uploaded notices and supporting evidence.
- **Google Cloud Tasks**: Asynchronous queue scheduling background monitoring cycles (`POST /monitor/{case_id}`).

---

## Screenshots

| Feature | Description |
| :--- | :--- |
| **Notice Extraction** | Multimodal OCR extracting issuing authority, amount, deadline, and reference IDs with trust badges. |
| **Action Plan** | Sequenced 8-step roadmap highlighting the active `NEXT ACTION`. |
| **Petition Package** | Formal administrative dispute document with verified supporting attachments. |
| **Human Approval Gate** | Unmistakable modal preventing unauthorized execution. |
| **Monitoring Callout** | Real-time `⚡ STATUS CHANGE DETECTED` callout with adaptive task injection. |

---

## Setup

### 1. Prerequisites
- Python 3.10+ (Python 3.11 recommended)
- Node.js 18+ and npm
- Google Gemini API Key ([Google AI Studio](https://aistudio.google.com/))
- Google Cloud SDK (`gcloud`) (for Cloud deployment)

---

## Environment Variables

Copy `.env.example` to `.env`:
```env
# Gemini Configuration
GEMINI_API_KEY=AIzaSy...your_gemini_api_key_here
GEMINI_MODEL=gemini-2.0-flash

# Server Configuration
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

## Running Locally

### 1. Start Backend (FastAPI)
```bash
# In root directory
python -m venv .venv
.venv\Scripts\activate   # Windows (or source .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt
uvicorn backend.main:app --reload --port 8000
```
Backend API docs will be live at `http://localhost:8000/docs`.

### 2. Start Frontend (Next.js)
```bash
cd frontend
npm install
npm run dev
```
Open `http://localhost:3000` in your browser.

### 3. Run Automated Tests
```bash
python -m pytest
```
*Executes all 33 unit and integration tests across Document, Research, Workflow, Action, Approval, and Monitoring agents.*

---

## Deployment

CivicOps is configured for a split deployment:
- **Backend (FastAPI)**: Deployed to **Google Cloud Run** for containerized execution, direct Firestore/GCS access, and Cloud Tasks background monitoring callbacks.
- **Frontend (Next.js)**: Deployed to **Vercel** with client-side API communication to Cloud Run.

### 1. Deploy Backend to Google Cloud Run
```bash
gcloud run deploy civicops-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,FIRESTORE_DATABASE=(default),GCS_BUCKET=YOUR_BUCKET,CLOUD_TASKS_QUEUE=civicops-monitoring-queue,CLOUD_TASKS_LOCATION=us-central1,ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:3000" \
  --set-secrets="GEMINI_API_KEY=civicops-gemini-api-key:latest"
```

### 2. Deploy Frontend to Vercel
1. Import repository to [Vercel](https://vercel.com) with root directory `frontend` (or using repository `vercel.json`).
2. Add Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://civicops-backend-xyz.a.run.app` (your Cloud Run service URL).
3. Deploy!

See [`docs/deployment.md`](docs/deployment.md) for full step-by-step instructions.


---

## Demo
Use the sample notices included in the app or under `data/sample_notices/`:
1. **Property Tax Delinquency Notice** (`property_tax_notice.pdf`): Tests full dispute loop, evidence check, and status monitoring.
2. **Plan Check Correction Notice** (`building_permit_correction_notice.txt`): Demonstrates building department technical review.
3. **Parking Citation Notice** (`parking_citation.txt`): Demonstrates municipal administrative review.
4. **Interactive Demo Controller**: Toggle case status between `Under Review`, `Additional Information Required`, `Approved`, and `Rejected` to see the Monitoring Agent dynamically adapt in real time.

---

## Limitations
- Document extraction is optimized for civic notices, property tax statements, and administrative citations in English.
- Real-world government portals lack standardized public APIs; submissions are executed against the transparent CivicOps Demo Gateway.

---

## Future Scope
- Multi-lingual notice translation and localized vernacular dispute petitions.
- Real-time SMS and WhatsApp citizen alert dispatches via Twilio / Cloud Functions.
- Direct OAuth integration with municipal Tyler Technologies / Accela citizen portals.
