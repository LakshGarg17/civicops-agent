"""
Monitoring Agent for CivicOps.
Autonomous monitoring agent responsible for tracking active case status, detecting agency determinations,
reasoning about change severity, dynamically mutating workflow action plans with follow-up tasks,
and issuing citizen alerts.
"""

import json
import logging
import datetime
from typing import Dict, Any, Optional

from backend.config import GEMINI_API_KEY, GEMINI_MODEL
from backend.tools.demo_status_provider import demo_status_provider, DemoStatusProvider

logger = logging.getLogger("civicops.monitoring_agent")

try:
    import google.generativeai as genai  # type: ignore
    if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
        genai.configure(api_key=GEMINI_API_KEY)
except Exception as e:
    logger.warning(f"MonitoringAgent: Gemini SDK initialization warning: {e}")

class MonitoringAgent:
    """
    Autonomous Monitoring Agent with generative reasoning and adaptive task generation.
    """

    def __init__(
        self,
        status_provider: Optional[DemoStatusProvider] = None,
        model_name: str = GEMINI_MODEL
    ):
        self.status_provider = status_provider or demo_status_provider
        self.model_name = model_name

    def monitor_case(
        self,
        case_id: str,
        case_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Executes an autonomous monitoring cycle for a case:
        1. Polls status provider
        2. Compares against previous case status
        3. If changed -> performs agentic reasoning (severity, next action, new workflow task)
        4. Returns structured determination payload
        """
        previous_status = case_data.get("status", "submitted")
        
        # 1. Fetch current external status from provider
        provider_resp = self.status_provider.get_status(case_id, default_status=previous_status)
        current_status = provider_resp.get("status", previous_status)
        message = provider_resp.get("message", "")

        # 2. Compare statuses
        if current_status == previous_status:
            logger.info(f"MonitoringAgent: Case {case_id} status unchanged ({current_status}).")
            return {
                "change_detected": False,
                "case_id": case_id,
                "previous_status": previous_status,
                "current_status": current_status,
                "message": message or "Application status is unchanged. Active monitoring continues.",
                "timestamp": datetime.datetime.now().isoformat()
            }

        logger.info(f"MonitoringAgent: Status change detected for {case_id}: {previous_status} -> {current_status}")

        # 3. Agentic Reasoning over the status transition
        analysis = self._reason_about_status_change(
            case_id=case_id,
            previous_status=previous_status,
            current_status=current_status,
            provider_message=message,
            notice_data=case_data.get("notice", {}),
            research_data=case_data.get("research", {})
        )

        return analysis

    def _reason_about_status_change(
        self,
        case_id: str,
        previous_status: str,
        current_status: str,
        provider_message: str,
        notice_data: Dict[str, Any],
        research_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Applies Gemini reasoning to evaluate change impact, determine required citizen actions,
        and structure a follow-up task.
        """
        prompt = f"""
You are the CivicOps Autonomous Monitoring Agent.
A civic paperwork case status change was detected from an external government agency gateway.

Case ID: {case_id}
Notice Type: {notice_data.get('notice_type', 'Administrative Notice')}
Authority: {research_data.get('authority', 'Government Authority')}
Previous Case Status: {previous_status}
Current Detected Status: {current_status}
Agency Status Message: {provider_message}

Analyze this change and produce a JSON response with the following exact keys:
{{
  "change_detected": true,
  "case_id": "{case_id}",
  "previous_status": "{previous_status}",
  "current_status": "{current_status}",
  "severity": "<'high' | 'medium' | 'low' | 'info'>",
  "summary": "<Clear 1-2 sentence plain-language explanation for the citizen>",
  "next_action": "<Specific immediate next action title, e.g. 'Upload ownership proof'>",
  "requires_user": <true or false>,
  "notification_title": "CivicOps Update: Action Required",
  "new_task": {{
    "title": "<Concise action title>",
    "description": "<Step-by-step instructions for the citizen>",
    "action_type": "<'upload_document' | 'review' | 'attend_hearing' | 'payment'>",
    "status": "pending",
    "required_documents": ["<Specific required document name, e.g. Recorded Deed or Title Certificate>"],
    "deadline": "<Appropriate deadline or date>"
  }}
}}

Ensure valid JSON output without extra commentary.
"""
        # Try Generative AI call
        if GEMINI_API_KEY and GEMINI_API_KEY != "your_gemini_api_key_here":
            try:
                model = genai.GenerativeModel(self.model_name)
                response = model.generate_content(
                    prompt,
                    generation_config={"response_mime_type": "application/json"}
                )
                if response.text:
                    parsed = json.loads(response.text)
                    if isinstance(parsed, dict) and "change_detected" in parsed:
                        return parsed
            except Exception as e:
                logger.warning(f"MonitoringAgent: Gemini reasoning failed ({e}). Using deterministic rule-engine fallback.")

        # Deterministic Rule-Engine Fallback
        return self._rule_based_reasoning(
            case_id=case_id,
            previous_status=previous_status,
            current_status=current_status,
            provider_message=provider_message
        )

    def _rule_based_reasoning(
        self,
        case_id: str,
        previous_status: str,
        current_status: str,
        provider_message: str
    ) -> Dict[str, Any]:
        """Deterministic reasoning fallback for offline/test environments."""
        if current_status == "additional_information_required":
            return {
                "change_detected": True,
                "case_id": case_id,
                "previous_status": previous_status,
                "current_status": current_status,
                "severity": "high",
                "summary": "Additional ownership documentation is required by the reviewing authority before a determination can be made.",
                "next_action": "Upload ownership proof",
                "requires_user": True,
                "notification_title": "CivicOps Update: Additional Information Required",
                "new_task": {
                    "task_id": f"task_followup_{int(datetime.datetime.now().timestamp())}",
                    "title": "Upload ownership proof",
                    "description": "Provide a copy of your recorded deed, settlement statement, or property title certificate as requested by the board.",
                    "action_type": "upload_document",
                    "status": "pending",
                    "required_documents": ["Recorded Deed or Title Certificate"],
                    "deadline": "Within 14 days"
                }
            }
        elif current_status == "approved":
            return {
                "change_detected": True,
                "case_id": case_id,
                "previous_status": previous_status,
                "current_status": current_status,
                "severity": "low",
                "summary": "Your dispute application has been approved by the municipal board. Assessment adjusted.",
                "next_action": "Review final determination notice",
                "requires_user": False,
                "notification_title": "CivicOps Update: Application Approved",
                "new_task": {
                    "task_id": f"task_approved_{int(datetime.datetime.now().timestamp())}",
                    "title": "Review final determination letter",
                    "description": "Download and archive the formal adjusted property valuation certificate.",
                    "action_type": "review",
                    "status": "pending",
                    "required_documents": [],
                    "deadline": "Archival"
                }
            }
        elif current_status == "rejected":
            return {
                "change_detected": True,
                "case_id": case_id,
                "previous_status": previous_status,
                "current_status": current_status,
                "severity": "high",
                "summary": "Dispute claim denied by reviewing board. Formal appeal window is open for 30 days.",
                "next_action": "File formal administrative appeal",
                "requires_user": True,
                "notification_title": "CivicOps Alert: Application Determination Denied",
                "new_task": {
                    "task_id": f"task_appeal_{int(datetime.datetime.now().timestamp())}",
                    "title": "File formal administrative appeal",
                    "description": "Prepare notice of appeal to the State Property Tax Board within 30 days.",
                    "action_type": "appeal",
                    "status": "pending",
                    "required_documents": ["Notice of Appeal Form"],
                    "deadline": "Within 30 days"
                }
            }
        else:
            return {
                "change_detected": True,
                "case_id": case_id,
                "previous_status": previous_status,
                "current_status": current_status,
                "severity": "info",
                "summary": provider_message or f"Case status changed to {current_status}.",
                "next_action": f"Track {current_status}",
                "requires_user": False,
                "notification_title": f"CivicOps Update: Status {current_status}",
                "new_task": None
            }

# Global singleton
monitoring_agent = MonitoringAgent()
