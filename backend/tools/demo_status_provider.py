"""
Demo Status Provider for CivicOps.
Simulates a transparent government agency portal status gateway for testing and live demonstrations.
Allows programmatic and API-driven flipping of case determination states.
"""

import logging
import datetime
from typing import Dict, Any, Optional

logger = logging.getLogger("civicops.demo_status_provider")

DEFAULT_STATUS_MAP: Dict[str, Dict[str, Any]] = {
    "submitted": {
        "status": "submitted",
        "message": "Application received and queued for initial administrative intake.",
        "requires_user": False,
        "severity": "info"
    },
    "under_review": {
        "status": "under_review",
        "message": "Application is currently under review by the municipal review panel.",
        "requires_user": False,
        "severity": "info"
    },
    "additional_information_required": {
        "status": "additional_information_required",
        "message": "Official notice: Additional ownership documentation (Recorded Deed or Title Certificate) is required within 14 days.",
        "requires_user": True,
        "severity": "high",
        "requested_item": "Recorded Deed or Title Certificate",
        "next_action": "Upload ownership proof"
    },
    "approved": {
        "status": "approved",
        "message": "Administrative dispute granted. Property tax assessment valuation adjusted in citizen's favor.",
        "requires_user": False,
        "severity": "low",
        "next_action": "Review final determination letter"
    },
    "rejected": {
        "status": "rejected",
        "message": "Dispute claim denied due to insufficient evidence. Formal appeal window open for 30 days.",
        "requires_user": True,
        "severity": "high",
        "next_action": "File formal administrative appeal"
    }
}

class DemoStatusProvider:
    """
    Transparent demo status gateway providing dynamic status polling for active cases.
    """

    def __init__(self):
        # In-memory dictionary tracking case status overrides: { case_id: status_payload }
        self._case_statuses: Dict[str, Dict[str, Any]] = {}

    def get_status(self, case_id: str, default_status: str = "under_review") -> Dict[str, Any]:
        """
        Polls the simulated government agency gateway for the current status of case_id.
        """
        now_str = datetime.datetime.now().isoformat()

        if case_id in self._case_statuses:
            res = dict(self._case_statuses[case_id])
            res["last_checked"] = now_str
            return res

        # Default state
        base_info = DEFAULT_STATUS_MAP.get(default_status, DEFAULT_STATUS_MAP["under_review"])
        status_payload = {
            "application_id": case_id,
            "case_id": case_id,
            "status": base_info["status"],
            "message": base_info["message"],
            "requires_user": base_info["requires_user"],
            "severity": base_info["severity"],
            "source": "CivicOps Demo Agency Portal (Sandbox)",
            "last_checked": now_str
        }
        if "next_action" in base_info:
            status_payload["next_action"] = base_info["next_action"]
        if "requested_item" in base_info:
            status_payload["requested_item"] = base_info["requested_item"]

        self._case_statuses[case_id] = status_payload
        return status_payload

    def set_status(
        self,
        case_id: str,
        status: str,
        message: Optional[str] = None,
        source: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Programmatically flips or updates the status for a given case in the demo gateway.
        """
        base_info = DEFAULT_STATUS_MAP.get(status, {
            "status": status,
            "message": message or f"Status updated to {status}",
            "requires_user": status in ("additional_information_required", "rejected"),
            "severity": "high" if status in ("additional_information_required", "rejected") else "info"
        })

        payload = {
            "application_id": case_id,
            "case_id": case_id,
            "status": status,
            "message": message or base_info.get("message", f"Status updated to {status}"),
            "requires_user": base_info.get("requires_user", False),
            "severity": base_info.get("severity", "info"),
            "source": source or "CivicOps Demo Agency Portal (Sandbox)",
            "last_checked": datetime.datetime.now().isoformat()
        }

        if "next_action" in base_info:
            payload["next_action"] = base_info["next_action"]
        if "requested_item" in base_info:
            payload["requested_item"] = base_info["requested_item"]

        self._case_statuses[case_id] = payload
        logger.info(f"DemoStatusProvider: Updated status for {case_id} -> {status}")
        return payload

    def reset_status(self, case_id: str) -> None:
        """Resets the demo status back to default."""
        if case_id in self._case_statuses:
            del self._case_statuses[case_id]

# Global singleton
demo_status_provider = DemoStatusProvider()
