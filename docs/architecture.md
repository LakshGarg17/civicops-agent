# CivicOps Architecture

CivicOps is an autonomous multi-agent civic paperwork assistant built with Google Gemini, FastAPI, Next.js, and Google Cloud Platform.

---

## 10-Second High-Level Architecture Flow

```
┌────────┐      ┌─────────────────────────┐      ┌───────────────────────────────────┐
│ CITIZEN│ ───▶ │  NEXT.JS 14 FRONTEND    │ ───▶ │   FASTAPI BACKEND (Cloud Run)     │
└────────┘      │  (App Router / Tailwind)│      │   • Document, Research & Workflow │
                └─────────────────────────┘      │   • Server-Gated Human Approval   │
                                                 │   • Action Agent & Demo Gateway   │
                                                 └─────────────────┬─────────────────┘
                                                                   │
                                     ┌─────────────────────────────┼─────────────────────────────┐
                                     │                             │                             │
                                     ▼                             ▼                             ▼
                          ┌──────────────────────┐    ┌─────────────────────────┐   ┌─────────────────────────┐
                          │ GOOGLE GEMINI 2.0    │    │ GOOGLE CLOUD STORAGE    │   │ CLOUD FIRESTORE         │
                          │ • Multimodal OCR     │    │ • Notice PDF / PNG      │   │ • Cases & Workflows     │
                          │ • Grounded Research  │    │ • Evidence Attachments  │   │ • Status Updates Audit  │
                          │ • Agentic Reasoning  │    │   (gs://... buckets)    │   │ • Documents & Users     │
                          └──────────────────────┘    └─────────────────────────┘   └────────────┬────────────┘
                                                                                                 ▲
                                                                                                 │
                                                                                    ┌────────────┴────────────┐
                                                                                    │ CLOUD TASKS / ASYNC     │
                                                                                    │ POST /monitor/{case_id} │
                                                                                    │                         │
                                                                                    │ [ MONITORING AGENT ]    │
                                                                                    │ • Status Polling        │
                                                                                    │ • Severity Reasoning    │
                                                                                    │ • Dynamic Task Creation │
                                                                                    └─────────────────────────┘
```

---

## The 5 Autonomous Civic Agents

| Agent | Responsibilities | Technologies |
| :--- | :--- | :--- |
| **1. Document Agent** | Ingests notices (PDF, JPG, PNG), performs multimodal extraction into structured Pydantic schemas with anti-hallucination defaults. | Gemini 2.0 Flash, Cloud Storage, Pydantic |
| **2. Research Agent** | Grounded lookup of statutory codes, administrative boards, submission channels, and procedural rationale on `.gov` portals. | Grounded Search, Gemini 2.0 Flash |
| **3. Workflow Agent** | Diffs required proofs against citizen inventory; sequences numbered, chronological action plan. | Pydantic, Firestore Workflows |
| **4. Action Agent** | Prepares formal administrative petition packages with strict anti-fabrication proof checks; gates execution behind server-enforced human authorization. | FastAPI Security Gate, Jinja2 / String Templates |
| **5. Monitoring Agent** | Asynchronously polls demo portal, detects agency determinations, analyzes severity, and injects follow-up tasks into the live workflow. | Cloud Tasks, Firestore, Gemini Reasoning |

---

## Persistence & Storage Layering

Agents never interact with databases directly:
```
[ Agent Layer ] ──▶ [ Domain Service Layer ] ──▶ [ Firestore / Storage Service ] ──▶ [ Google Cloud Services ]
```
- `DocumentAgent` → `DocumentService` → `StorageService` (`GCS`) + `FirestoreService` (`Firestore`)
- `ResearchAgent` → `ResearchService` → `FirestoreService`
- `WorkflowAgent` → `WorkflowService` → `FirestoreService`
- `ActionAgent` → `CaseService` → `FirestoreService`
- `MonitoringAgent` → `CaseService` → `FirestoreService`

---

## Security & Human-in-the-Loop Governance

1. **Server-Enforced Authorization Gate**: Submissions without recorded human approval token (`ApprovalRecord`) are rejected with `HTTP 403 Forbidden`.
2. **Strict Anti-Fabrication**: Action Agent only marks documents attached if confirmed in citizen inventory; unattached requirements are flagged as missing.
3. **Demo Sandbox Isolation**: All external filings execute against the transparent CivicOps Demo Gateway, issuing deterministic receipt tokens without impacting production government databases.
