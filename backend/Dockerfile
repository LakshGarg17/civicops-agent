# ==============================================================================
# CivicOps Backend - Google Cloud Run Containerfile
# ==============================================================================

FROM python:3.11-slim as base

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8080 \
    HOST=0.0.0.0 \
    PYTHONPATH=/app

WORKDIR /app

# Install minimal runtime/build dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements from root or current directory
COPY requirements.txt .

# Install dependencies (cached layer)
RUN pip install --no-cache-dir -r requirements.txt

# Copy source tree
COPY . .

# Create non-root runtime user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/backend/uploads /app/data /app/uploads && \
    chown -R appuser:appuser /app

USER appuser

# Expose dynamic container port (Cloud Run defaults to 8080)
EXPOSE 8080

# Cloud Run dynamic PORT binding (handles root or backend-scoped source)
CMD ["sh", "-c", "if [ -f backend/main.py ]; then exec uvicorn backend.main:app --host 0.0.0.0 --port ${PORT:-8080}; else exec uvicorn main:app --host 0.0.0.0 --port ${PORT:-8080}; fi"]
