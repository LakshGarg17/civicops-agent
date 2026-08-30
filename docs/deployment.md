# CivicOps Deployment Guide: Google Cloud Run & Services

This guide provides end-to-end instructions for deploying CivicOps to Google Cloud Platform (Cloud Run, Cloud Firestore, Cloud Storage, and Cloud Tasks) for Day 5 production readiness.

---

## 1. Architecture Overview & Services

| Service | Role in CivicOps |
| :--- | :--- |
| **Google Cloud Run** | Fully managed container runtime hosting the FastAPI backend |
| **Google Cloud Firestore** | NoSQL document database persisting cases, documents, workflows, applications, and status history |
| **Google Cloud Storage (GCS)** | Object storage for citizen uploaded notices and supporting evidence PDFs |
| **Google Cloud Tasks** | Asynchronous task queue dispatching background monitoring checks (`POST /monitor/{case_id}`) |
| **Google Gemini API** | Multimodal Document Extraction, grounded Research, and Monitoring Agent reasoning |

---

## 2. Prerequisites & CLI Setup

1. **Google Cloud SDK (`gcloud`)**:
   ```bash
   gcloud auth login
   gcloud config set project YOUR_PROJECT_ID
   ```

2. **Enable Required Google Cloud APIs**:
   ```bash
   gcloud services enable \
     run.googleapis.com \
     firestore.googleapis.com \
     storage.googleapis.com \
     cloudtasks.googleapis.com \
     cloudbuild.googleapis.com \
     artifactregistry.googleapis.com
   ```

---

## 3. Provisioning Cloud Infrastructure

### A. Create Cloud Firestore Database
```bash
gcloud firestore databases create \
  --location=nam5 \
  --type=firestore-native
```

### B. Create Google Cloud Storage Bucket
```bash
export GCS_BUCKET="civicops-documents-${GOOGLE_CLOUD_PROJECT}"

gsutil mb -l us-central1 gs://${GCS_BUCKET}/
gsutil uniformbucketlevelaccess set on gs://${GCS_BUCKET}/
```

### C. Create Cloud Tasks Queue
```bash
gcloud tasks queues create civicops-monitoring-queue \
  --location=us-central1 \
  --max-dispatches-per-second=50 \
  --max-concurrent-dispatches=100
```

---

## 4. Deploying Backend to Google Cloud Run

### Option 1: Direct Source Deploy with `gcloud run deploy`
From the project root:
```bash
gcloud run deploy civicops-backend \
  --source . \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT}" \
  --set-env-vars="FIRESTORE_DATABASE=(default)" \
  --set-env-vars="GCS_BUCKET=${GCS_BUCKET}" \
  --set-env-vars="CLOUD_TASKS_QUEUE=civicops-monitoring-queue" \
  --set-env-vars="CLOUD_TASKS_LOCATION=us-central1" \
  --set-env-vars="GEMINI_MODEL=gemini-2.0-flash" \
  --set-secrets="GEMINI_API_KEY=civicops-gemini-api-key:latest"
```

### Option 2: Container Image Build & Deploy
```bash
# 1. Build and push image to Artifact Registry
gcloud artifacts repositories create civicops-repo \
  --repository-format=docker \
  --location=us-central1 \
  --description="CivicOps container images"

gcloud builds submit --tag us-central1-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/civicops-repo/backend:v0.5.0 .

# 2. Deploy container to Cloud Run
gcloud run deploy civicops-backend \
  --image us-central1-docker.pkg.dev/${GOOGLE_CLOUD_PROJECT}/civicops-repo/backend:v0.5.0 \
  --region us-central1 \
  --platform managed \
  --allow-unauthenticated \
  --set-env-vars="GOOGLE_CLOUD_PROJECT=${GOOGLE_CLOUD_PROJECT},FIRESTORE_DATABASE=(default),GCS_BUCKET=${GCS_BUCKET},CLOUD_TASKS_QUEUE=civicops-monitoring-queue,CLOUD_TASKS_LOCATION=us-central1,GEMINI_MODEL=gemini-2.0-flash" \
  --set-secrets="GEMINI_API_KEY=civicops-gemini-api-key:latest"
```

Once deployed, note the service URL (e.g., `https://civicops-backend-xyz.a.run.app`). Update the backend's `BACKEND_SERVICE_URL` variable so Cloud Tasks can target it:
```bash
gcloud run services update civicops-backend \
  --region us-central1 \
  --update-env-vars="BACKEND_SERVICE_URL=https://civicops-backend-xyz.a.run.app"
```

---

## 5. Deploying Frontend (Next.js)

### Deploying to Vercel:
1. Connect your repository to [Vercel](https://vercel.com).
2. Set the root directory to `frontend`.
3. Configure Environment Variable:
   - `NEXT_PUBLIC_API_URL`: `https://civicops-backend-xyz.a.run.app`
4. Click **Deploy**.

---

## 6. Environment Variables Reference

| Variable | Description | Default / Example |
| :--- | :--- | :--- |
| `GEMINI_API_KEY` | Google AI Studio Gemini API Key | `AIzaSy...` |
| `GEMINI_MODEL` | Foundation model for multimodal agent reasoning | `gemini-2.0-flash` |
| `GOOGLE_CLOUD_PROJECT` | GCP Project ID | `your-project-id` |
| `FIRESTORE_DATABASE` | Firestore database identifier | `(default)` |
| `GCS_BUCKET` | Google Cloud Storage bucket name for documents | `civicops-documents-bucket` |
| `CLOUD_TASKS_QUEUE` | Cloud Tasks queue for async monitoring | `civicops-monitoring-queue` |
| `CLOUD_TASKS_LOCATION`| GCP region for Cloud Tasks queue | `us-central1` |
| `BACKEND_SERVICE_URL` | Deployed backend URL for Cloud Tasks callbacks | `https://civicops-backend-xyz.a.run.app` |
| `PORT` | Listening port for Cloud Run container | `8000` |
