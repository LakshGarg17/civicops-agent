# CivicOps Split Deployment Guide: Cloud Run Backend & Vercel Frontend

CivicOps employs a cloud-native split architecture:
- **Backend (FastAPI)**: Deployed to **Google Cloud Run** to support long-running tasks, direct Cloud Storage streaming, Firestore persistence, and Google Cloud Tasks async callbacks.
- **Frontend (Next.js 14)**: Deployed to **Vercel** with edge routing, automatic asset optimization, and client-side communication with Cloud Run.

---

## 1. Architecture Overview & Services

```
┌────────────────────────────────┐                 ┌─────────────────────────────────┐
│     VERCEL (Next.js 14)        │  HTTPS API Req  │    GOOGLE CLOUD RUN (FastAPI)   │
│  https://civicops.vercel.app   │ ──────────────▶ │  https://civicops-backend...    │
│                                │ ◀────────────── │                                 │
│  • App Router UI               │  JSON Responses │  • Document, Research, Workflow │
│  • NEXT_PUBLIC_API_URL         │                 │  • Action Agent & Approval Gate │
└────────────────────────────────┘                 └───────────────┬─────────────────┘
                                                                   │
                                     ┌─────────────────────────────┼─────────────────────────────┐
                                     │                             │                             │
                                     ▼                             ▼                             ▼
                          ┌──────────────────────┐    ┌─────────────────────────┐   ┌─────────────────────────┐
                          │ GOOGLE GEMINI 2.0    │    │ GOOGLE CLOUD STORAGE    │   │ CLOUD FIRESTORE         │
                          │ • Multimodal OCR     │    │ • Document PDF / PNG    │   │ • Cases & Workflows     │
                          │ • Grounded Research  │    │ • Verified Evidence     │   │ • Status Audit Log      │
                          │ • Agentic Reasoning  │    │   (gs://... bucket)     │   │ • Metadata Store        │
                          └──────────────────────┘    └─────────────────────────┘   └────────────┬────────────┘
                                                                                                 ▲
                                                                                                 │
                                                                                    ┌────────────┴────────────┐
                                                                                    │ CLOUD TASKS QUEUE       │
                                                                                    │ POST /monitor/{case_id} │
                                                                                    │ (Monitoring Agent)      │
                                                                                    └─────────────────────────┘
```

---

## 2. Google Cloud Platform Setup (Backend)

### A. Prerequisites & CLI Authentication
```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
```

### B. Enable GCP Services
```bash
gcloud services enable \
  run.googleapis.com \
  firestore.googleapis.com \
  storage.googleapis.com \
  cloudtasks.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  secretmanager.googleapis.com
```

### C. Create Cloud Firestore Database
```bash
gcloud firestore databases create \
  --location=nam5 \
  --type=firestore-native
```

### D. Create Cloud Storage Bucket
```bash
export GCS_BUCKET="civicops-documents-${GOOGLE_CLOUD_PROJECT}"
gsutil mb -l us-central1 gs://${GCS_BUCKET}/
gsutil uniformbucketlevelaccess set on gs://${GCS_BUCKET}/
```

### E. Create Cloud Tasks Queue
```bash
gcloud tasks queues create civicops-monitoring-queue \
  --location=us-central1 \
  --max-dispatches-per-second=50 \
  --max-concurrent-dispatches=100
```

---

## 3. Deploying Backend to Google Cloud Run

### Option 1: Direct Source Deploy (Recommended)
From the project root:
```bash
gcloud run deploy civicops-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID" \
  --set-env-vars="FIRESTORE_DATABASE=(default)" \
  --set-env-vars="GCS_BUCKET=civicops-documents-YOUR_PROJECT_ID" \
  --set-env-vars="CLOUD_TASKS_QUEUE=civicops-monitoring-queue" \
  --set-env-vars="CLOUD_TASKS_LOCATION=us-central1" \
  --set-env-vars="ALLOWED_ORIGINS=https://your-civicops-app.vercel.app,http://localhost:3000" \
  --set-env-vars="GEMINI_MODEL=gemini-2.0-flash" \
  --set-secrets="GEMINI_API_KEY=civicops-gemini-api-key:latest"
```

*Note: Once deployed, copy your Cloud Run service URL (e.g. `https://civicops-backend-xyz.a.run.app`). Update the backend's `BACKEND_SERVICE_URL` variable so Cloud Tasks callbacks target this URL:*
```bash
gcloud run services update civicops-backend \
  --region us-central1 \
  --update-env-vars="BACKEND_SERVICE_URL=https://civicops-backend-xyz.a.run.app"
```

### Option 2: Deploy Scoped from `./backend`
```bash
gcloud run deploy civicops-backend \
  --source ./backend \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=YOUR_PROJECT_ID,FIRESTORE_DATABASE=(default),GCS_BUCKET=civicops-documents-YOUR_PROJECT_ID,CLOUD_TASKS_QUEUE=civicops-monitoring-queue,CLOUD_TASKS_LOCATION=us-central1,ALLOWED_ORIGINS=*,GEMINI_MODEL=gemini-2.0-flash" \
  --set-secrets="GEMINI_API_KEY=civicops-gemini-api-key:latest"
```

### Backend Health Check Smoke Test
```bash
curl -X GET https://civicops-backend-xyz.a.run.app/health
# Response: {"status":"ok","service":"CivicOps Backend","gemini_configured":true,"adk_status":{...}}
```

---

## 4. Deploying Frontend to Vercel

1. **Import Git Repository** into [Vercel](https://vercel.com).
2. **Project Configuration**:
   - **Framework Preset**: Next.js
   - **Root Directory**: `frontend` (or leave as root if using repo-root `vercel.json`)
   - **Build Command**: `next build`
   - **Output Directory**: `.next`
3. **Configure Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: `https://civicops-backend-xyz.a.run.app` (your Cloud Run service URL)
4. Click **Deploy**.

---

## 5. Environment Variables Reference

### Backend (Cloud Run)
| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key | `AIzaSy...` (Secret Manager) |
| `GEMINI_MODEL` | Foundation model for agent reasoning | `gemini-2.0-flash` |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | `your-gcp-project-id` |
| `FIRESTORE_DATABASE` | Firestore database identifier | `(default)` |
| `GCS_BUCKET` | Google Cloud Storage bucket name for notices | `civicops-documents-bucket` |
| `CLOUD_TASKS_QUEUE` | Cloud Tasks queue for async monitoring | `civicops-monitoring-queue` |
| `CLOUD_TASKS_LOCATION`| GCP region for Cloud Tasks queue | `us-central1` |
| `BACKEND_SERVICE_URL` | Deployed Cloud Run URL for task callbacks | `https://civicops-backend-xyz.a.run.app` |
| `ALLOWED_ORIGINS` | Permitted CORS frontend origins | `https://civicops.vercel.app,http://localhost:3000` |
| `PORT` | Listening port assigned by Cloud Run | `8080` (dynamic) |

### Frontend (Vercel)
| Variable | Description | Value |
| :--- | :--- | :--- |
| `NEXT_PUBLIC_API_URL` | Backend URL for API calls | `https://civicops-backend-xyz.a.run.app` |

---

## 6. End-to-End Cross-Origin Verification Checklist

- [x] Backend `/health` returns status `ok` and confirms Firestore connection.
- [x] Vercel frontend loads without CORS errors when communicating with Cloud Run.
- [x] Notice upload streams PDF to Cloud Storage bucket and stores metadata in Firestore.
- [x] Action Agent produces dispute petition draft.
- [x] Human Approval Gate enforces server-side authorization.
- [x] Submission schedules Cloud Task hitting `POST /monitor/{case_id}` on Cloud Run.
- [x] Monitoring Agent detects status transitions and creates workflow tasks in Firestore.
