# CivicOps — AI-Powered Civic Paperwork Assistant

CivicOps turns dense government notices, citations, permits, and tax bills into clear, actionable guidance using Google Gemini.

> **Status:** `Day 1 — Foundation & Architecture`  
> The basic document upload and Gemini translation flow is fully functional. Agent orchestration modules (`backend/agents/`) are stubbed and will be activated in subsequent milestones.

---

## 🏛️ Features (Day 1)

- 📄 **Document Upload**: Supports uploading `.txt` and text-based `.pdf` civic notices.
- ⚡ **Gemini Plain-Language Analysis**: Highlights what the notice means, urgent deadlines, amounts owed, and concrete next steps.
- 🎨 **Modern Civic UI**: Built with Next.js App Router, Tailwind CSS, drag-and-drop file upload, live progress indicators, and structured response cards.
- 🛡️ **Tested & Modular**: FastAPI backend with health checks, Pydantic schemas, and unit tests with mocked Gemini services.

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

Run backend automated tests with pytest (includes mocked Gemini interactions):
```bash
pytest tests/test_upload_endpoint.py -v
```

---

## 📂 Project Structure

```
civicops/
├── frontend/
│   ├── app/
│   │   ├── page.tsx          # Landing page with upload state machine
│   │   ├── layout.tsx        # App layout and styling
│   │   └── globals.css       # Tailwind base styles
│   ├── components/
│   │   ├── UploadCard.tsx    # Upload zone + drag-drop
│   │   ├── ProgressBar.tsx   # Processing indicator
│   │   └── ResponseCard.tsx  # Gemini analysis display
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.ts
│   └── .env.local.example
│
├── backend/
│   ├── agents/                # Stubs for Day 2+ multi-agent orchestration
│   │   ├── document_agent.py
│   │   ├── research_agent.py
│   │   ├── workflow_agent.py
│   │   ├── action_agent.py
│   │   └── monitoring_agent.py
│   ├── services/
│   │   └── gemini_service.py # Gemini 2.0 Flash client wrapper
│   ├── models/
│   │   └── schemas.py        # Pydantic models
│   ├── main.py               # FastAPI app & endpoints (/upload, /health)
│   └── config.py             # Settings loader and ADK configuration
│
├── data/
│   └── sample_notices/       # Sample realistic civic notices (.txt)
│
├── tests/
│   └── test_upload_endpoint.py
├── docs/
│   └── architecture.md
├── .env.example
├── .gitignore
├── requirements.txt
└── README.md
```
