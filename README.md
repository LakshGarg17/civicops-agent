# CivicOps — AI-Powered Civic Paperwork Assistant

CivicOps turns dense government notices, citations, permits, and tax bills into structured data and clear, actionable guidance using Google Gemini.

> **Status:** `Day 2 — Document Intelligence Agent Active`  
> Document Agent working: upload PDF/JPG/PNG → structured notice extraction via Gemini multimodal → formatted Notice Summary card + Document Checklist UI. Research Agent, Workflow Agent, Action Agent, and Monitoring Agent are not yet built.

---

## 🏛️ Features (Day 2 Milestone)

- 📄 **Multimodal Notice Upload**: Upload government notices in **PDF, JPG, JPEG, and PNG** (or `.txt`).
- 🤖 **Document Intelligence Agent (`DocumentAgent`)**:
  - Leverages Google Gemini's multimodal vision and document analysis directly.
  - Extracts key notice metadata into a structured JSON schema (`NoticeStructuredData`):
    - `notice_type`
    - `issuing_authority`
    - `department`
    - `reference_number`
    - `citizen_name`
    - `property_id`
    - `amount`
    - `issue`
    - `deadline`
    - `required_action`
    - `mentioned_documents`
  - **Strict Anti-Hallucination**: Defaults to `"Not found"` for unstated or uncertain fields.
  - **Defensive Error Handling**: Strips markdown fences, parses JSON safely, and falls back gracefully to default structures.
- ⚙️ **Service Layer (`DocumentService`)**: Clean file validation, local disk persistence under `backend/uploads/`, and orchestration.
- 📊 **5-Stage Animated Processing Indicator**:
  1. Uploading document ✓
  2. Reading document ✓
  3. Extracting information ✓
  4. Identifying notice type ✓
  5. Building notice summary ✓
- 📋 **Formatted Notice Summary Card & Document Checklist UI**:
  - Highlights core issues and required immediate actions.
  - Distinct styling for unstated (`"Not found"`) fields.
  - Document Checklist showing required evidence and supporting forms (e.g. dispute forms, prior payment proofs).
  - 1-Click test samples including synthetic property tax notices, plan check correction notices, and parking citations.

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

1. **Navigate to the frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install Node dependencies:**
   ```bash
   npm install
   ```

3. **Configure Frontend Environment:**
   Copy `.env.local.example` to `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```
   Ensure `NEXT_PUBLIC_API_URL` points to `http://localhost:8000`:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```

4. **Start Next.js Development Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) in your browser.

---

### 5. Running Tests

Run backend automated unit and integration tests with pytest:
```bash
python -m pytest tests/ -v
```

---

## 📂 Project Structure

```
civicops/
├── frontend/
│   ├── app/
│   │   ├── page.tsx               # Main interactive notice workspace
│   │   ├── layout.tsx             # Root layout and styling
│   │   └── globals.css            # Tailwind styles
│   ├── components/
│   │   ├── UploadCard.tsx         # Drag-and-drop multimodal upload zone
│   │   ├── ProgressBar.tsx        # 5-stage animated processing pipeline
│   │   ├── NoticeSummaryCard.tsx  # Structured notice extraction card
│   │   ├── DocumentChecklist.tsx  # Supporting documents checklist
│   │   └── ResponseCard.tsx       # Plain-language overview display
│   ├── package.json
│   ├── tsconfig.json
│   └── tailwind.config.ts
│
├── backend/
│   ├── agents/
│   │   ├── document_agent.py      # Multimodal Document Intelligence Agent
│   │   ├── research_agent.py      # Stub (Day 3 milestone)
│   │   ├── workflow_agent.py      # Stub (Day 4 milestone)
│   │   ├── action_agent.py        # Stub (Day 5 milestone)
│   │   └── monitoring_agent.py    # Stub (Day 6 milestone)
│   ├── services/
│   │   ├── document_service.py    # Ingestion, validation & orchestration
│   │   └── gemini_service.py      # Gemini client wrapper
│   ├── models/
│   │   ├── notice.py              # NoticeStructuredData Pydantic schema
│   │   └── schemas.py             # UploadResponse & ErrorResponse schemas
│   ├── uploads/                   # Local working directory for uploaded notices
│   ├── main.py                    # FastAPI app & endpoints (/upload, /health)
│   └── config.py                  # Settings & environment configuration
│
├── data/
│   └── sample_notices/            # Realistic sample notices (.pdf, .txt)
│       ├── property_tax_notice.pdf
│       ├── building_permit_correction_notice.txt
│       └── property_tax_delinquency_notice.txt
│
├── tests/
│   ├── test_document_agent.py     # DocumentAgent unit tests & parsing tests
│   └── test_upload_endpoint.py    # Multimodal endpoint validation tests
├── docs/
│   └── architecture.md
├── .env.example
├── requirements.txt
└── README.md
```
