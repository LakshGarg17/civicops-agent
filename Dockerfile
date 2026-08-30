# ==============================================================================
# CivicOps Backend - Google Cloud Run Dockerfile
# ==============================================================================

FROM python:3.11-slim as base

# Prevent Python from writing .pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PORT=8000 \
    HOST=0.0.0.0

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy dependencies
COPY requirements.txt .

# Install Python packages
RUN pip install --no-cache-dir -r requirements.txt

# Copy application source code
COPY backend/ ./backend/
COPY data/ ./data/

# Create non-root user for security
RUN useradd -m -u 1000 appuser && \
    mkdir -p /app/backend/uploads /app/data && \
    chown -R appuser:appuser /app

USER appuser

# Expose container port (Cloud Run sets PORT environment variable dynamically)
EXPOSE 8000

# Launch Uvicorn server bound to $PORT and $HOST
CMD exec uvicorn backend.main:app --host ${HOST} --port ${PORT} --workers 1
