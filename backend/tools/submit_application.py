"""
Tool: Submit Application Tool for CivicOps (Sandbox Demo Gateway).
Enforces server-side human approval gate prior to issuing simulated submission records.
"""

import datetime
import random
import logging
from typing import Dict, Any, Optional

logger = logging.getLogger("civicops.submit_tool")

class SubmitApplicationTool:
    """
    Submits application package strictly through the CivicOps Demo Gateway.
    Strictly gates execution on verified human approval.
    """

    def submit_application(
        self,
        case_id: str,
        application_data: Dict[str, Any],
        approval_record: Optional[Dict[str, Any]] = None,
        submission_method: str = "CivicOps Demo Gateway"
    ) -> Dict[str, Any]:
        """
        Executes simulated sandbox submission.
        Raises PermissionError if explicit human approval is absent or false.
        """
        # Server-side verification of human-in-the-loop approval
        if not approval_record or not approval_record.get("approved"):
            logger.error(f"SubmitApplicationTool: Submission blocked for {case_id} — Human approval missing or denied.")
            raise PermissionError(
                f"Cannot execute submission for case '{case_id}'. "
                "Explicit human approval must be recorded on the server before consequential actions can proceed."
            )

        logger.info(f"SubmitApplicationTool: Verified human approval for {case_id} granted by {approval_record.get('approved_by')}")

        now = datetime.datetime.now()
        timestamp_str = now.isoformat()
        conf_number = f"DEMO-SUB-{random.randint(100000, 999999)}"

        submission_record = {
            "application_id": case_id,
            "status": "submitted",
            "submitted_at": timestamp_str,
            "submission_method": submission_method,
            "confirmation_number": conf_number,
            "is_sandbox": True,
            "gateway_message": "Application received and registered in CivicOps Sandbox Demo Gateway. No real government database was contacted."
        }

        logger.info(f"SubmitApplicationTool: Generated sandbox submission receipt {conf_number} for {case_id}")
        return submission_record
