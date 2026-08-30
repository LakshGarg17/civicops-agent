"""
Cloud Tasks Service for CivicOps.
Handles scheduling asynchronous background execution tasks (hitting /monitor/{case_id})
using Google Cloud Tasks API with local asyncio timer fallback.
"""

import json
import asyncio
import logging
import datetime
from typing import Dict, Any, Optional
import httpx

from backend.config import (
    GOOGLE_CLOUD_PROJECT,
    CLOUD_TASKS_LOCATION,
    CLOUD_TASKS_QUEUE,
    BACKEND_SERVICE_URL
)

logger = logging.getLogger("civicops.cloud_tasks")

class CloudTasksService:
    """
    Asynchronous task dispatcher supporting Google Cloud Tasks and local async background timers.
    """

    def __init__(
        self,
        project_id: Optional[str] = None,
        location: Optional[str] = None,
        queue: Optional[str] = None,
        backend_url: Optional[str] = None,
        client: Optional[Any] = None
    ):
        self.project_id = project_id or GOOGLE_CLOUD_PROJECT
        self.location = location or CLOUD_TASKS_LOCATION
        self.queue = queue or CLOUD_TASKS_QUEUE
        self.backend_url = backend_url or BACKEND_SERVICE_URL
        self._client = client
        self._is_cloud_tasks_active = False
        self._init_client()

    def _init_client(self) -> None:
        """Initializes Cloud Tasks client if project is configured."""
        if self._client is not None:
            self._is_cloud_tasks_active = True
            return

        if not self.project_id or not self.location or not self.queue:
            logger.info("Cloud Tasks not configured with GCP project/queue. Running in local async worker mode.")
            return

        try:
            from google.cloud import tasks_v2  # type: ignore
            self._client = tasks_v2.CloudTasksClient()
            self._is_cloud_tasks_active = True
            logger.info(f"Cloud Tasks client connected: {self.project_id}/{self.location}/{self.queue}")
        except Exception as e:
            logger.warning(f"Could not connect to Google Cloud Tasks ({e}). Using local async worker.")
            self._client = None
            self._is_cloud_tasks_active = False

    def schedule_monitoring_task(
        self,
        case_id: str,
        delay_seconds: int = 5,
        callback_handler: Optional[Any] = None
    ) -> Dict[str, Any]:
        """
        Schedules a background task to trigger POST /monitor/{case_id} after delay_seconds.
        """
        target_url = f"{self.backend_url.rstrip('/')}/monitor/{case_id}"
        scheduled_time = datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(seconds=delay_seconds)

        # 1. Google Cloud Tasks Dispatch
        if self._is_cloud_tasks_active and self._client:
            try:
                from google.protobuf import timestamp_pb2  # type: ignore
                parent = self._client.queue_path(self.project_id, self.location, self.queue)
                
                timestamp = timestamp_pb2.Timestamp()
                timestamp.FromDatetime(scheduled_time)

                task = {
                    "http_request": {
                        "http_method": 1,  # POST
                        "url": target_url,
                        "headers": {"Content-Type": "application/json"},
                        "body": json.dumps({"case_id": case_id, "source": "cloud_task"}).encode()
                    },
                    "schedule_time": timestamp
                }

                response = self._client.create_task(request={"parent": parent, "task": task})
                logger.info(f"CloudTasks: Created task {response.name} targeting {target_url}")
                return {
                    "mode": "gcp_cloud_tasks",
                    "task_name": response.name,
                    "target_url": target_url,
                    "delay_seconds": delay_seconds,
                    "scheduled_at": scheduled_time.isoformat()
                }
            except Exception as e:
                logger.error(f"Failed to create Google Cloud Task ({e}). Falling back to local async worker.")

        # 2. Local Async Worker Fallback
        async def _local_worker():
            try:
                await asyncio.sleep(delay_seconds)
                logger.info(f"Local async background task executing monitoring check for {case_id}...")
                if callback_handler:
                    callback_handler(case_id)
                else:
                    async with httpx.AsyncClient(timeout=10.0) as http_client:
                        resp = await http_client.post(target_url, json={"case_id": case_id, "source": "local_worker"})
                        logger.info(f"Local worker POST /monitor/{case_id} status: {resp.status_code}")
            except Exception as err:
                logger.debug(f"Local worker background task notice for {case_id}: {err}")

        # Dispatch async task without blocking
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(_local_worker())
        except RuntimeError:
            pass  # No running event loop (e.g. synchronous unit test context)

        return {
            "mode": "local_async_worker",
            "task_name": f"local_task_{case_id}_{int(datetime.datetime.now().timestamp())}",
            "target_url": target_url,
            "delay_seconds": delay_seconds,
            "scheduled_at": scheduled_time.isoformat()
        }

# Global singleton
cloud_tasks_service = CloudTasksService()
