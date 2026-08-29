"""
Application Generator Service for CivicOps.
Formulates structured, factually grounded administrative petitions and dispute applications.
Strictly prevents fabrication of unprovided supporting documents.
"""

import json
import logging
import datetime
from typing import Dict, Any, List, Optional

import google.generativeai as genai
from backend.config import GEMINI_API_KEY, GEMINI_MODEL
from backend.models.application import ApplicationDocument

logger = logging.getLogger("civicops.application_generator")

APPLICATION_PROMPT = """You are the CivicOps Application Generator.
Your job is to draft a formal administrative petition / dispute application for a citizen to submit to a government authority.

Given:
1. Structured Notice Data (citation, property ID, amounts, department, issue, required action)
2. Grounded Research Data (procedure name, authority, statutory codes, submission method)
3. Citizen Document Inventory (documents on-hand vs missing)
4. Citizen/Applicant Information

CRITICAL ANTI-FABRICATION RULES:
- Only list supporting documents in "supporting_documents" that are VERIFIED as provided in the citizen document inventory.
- If a required document is missing/unprovided, place it in "missing_documents" and DO NOT claim it is attached.
- Generate a clear, respectful, authoritative, and factually grounded application.
- Output MUST be valid JSON only matching the schema below:

{
  "to": "Full Authority and Department Name",
  "subject": "Formal Subject Line",
  "property_id": "Property / Parcel / Vehicle / Permit ID or 'Not found'",
  "reference_number": "Notice Case Number or 'Not found'",
  "reason": "Clear factual explanation of the dispute or petition",
  "requested_action": "Specific administrative relief requested (e.g. adjust assessment, dismiss citation, grant permit re-review)",
  "supporting_documents": ["Document 1", "Document 2"],
  "missing_documents": ["Missing Doc 1"],
  "applicant_name": "Citizen Name",
  "date": "YYYY-MM-DD",
  "additional_notes": "Statutory citations and instructions"
}
"""

class ApplicationGenerator:
    """
    Generates structured civic applications with strict document integrity guarantees.
    """

    def __init__(self, api_key: Optional[str] = None, model_name: Optional[str] = None):
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model_name or GEMINI_MODEL
        self._model = None
        self._initialize_client()

    def _initialize_client(self) -> None:
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            logger.warning("ApplicationGenerator: GEMINI_API_KEY not configured. Running in deterministic template mode.")
            return

        try:
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model_name)
            logger.info(f"ApplicationGenerator initialized with Gemini model: {self.model_name}")
        except Exception as e:
            logger.error(f"ApplicationGenerator failed to initialize GenerativeModel: {e}", exc_info=True)
            self._model = None

    def generate_application(
        self,
        notice_data: Dict[str, Any],
        research_data: Dict[str, Any],
        user_data: Optional[Dict[str, Any]] = None,
        workflow: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Synthesizes notice, research, and citizen document state into an ApplicationDocument.
        Guarantees that supporting_documents only contains verified available documents.
        """
        user_info = user_data or {}
        workflow_info = workflow or {}
        
        # 1. Identify verified attached documents vs missing documents
        matched_docs = workflow_info.get("matched_documents", []) or []
        missing_docs = workflow_info.get("missing_documents", []) or []

        # If workflow matched/missing wasn't precomputed, calculate from research vs user_docs
        if not matched_docs and not missing_docs:
            user_docs = user_info.get("user_documents", []) or []
            req_docs = research_data.get("required_documents", []) or []
            for req in req_docs:
                if any(u.lower() in req.lower() or req.lower() in u.lower() for u in user_docs):
                    matched_docs.append(req)
                else:
                    missing_docs.append(req)

        # 2. Extract key fields
        citizen_name = (
            user_info.get("applicant_name")
            or notice_data.get("citizen_name")
            or "Citizen / Property Owner"
        )
        if citizen_name.lower() == "not found":
            citizen_name = "Property Owner / Addressee"

        authority = research_data.get("authority") or notice_data.get("issuing_authority") or "Municipal Authority"
        department = notice_data.get("department", "")
        if department and department.lower() != "not found" and department not in authority:
            target_to = f"{authority} — {department}"
        else:
            target_to = authority

        notice_type = notice_data.get("notice_type", "Civic Notice")
        if notice_type.lower() == "not found":
            notice_type = "Administrative Notice"

        reference_num = notice_data.get("reference_number", "Not found")
        property_id = notice_data.get("property_id", "Not found")
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")

        # 3. Deterministic template synthesis
        reason = (
            f"Regarding {notice_type} (Ref: {reference_num}). "
            f"Dispute or correction requested regarding: {notice_data.get('issue', 'cited civic record discrepancy')}."
        )
        requested_action = (
            notice_data.get("required_action")
            if notice_data.get("required_action") and notice_data.get("required_action").lower() != "not found"
            else f"Review submitted records and update official file under {research_data.get('procedure_name', 'administrative procedure')}."
        )

        subject = f"Formal Petition & Dispute: {notice_type} — Ref #{reference_num}"

        additional_notes = (
            f"Filing submitted pursuant to {research_data.get('procedure_name', 'official civic administrative guidelines')}. "
            f"Submission channel: {research_data.get('submission_method', 'Official Department Portal')}."
        )

        app_dict: Dict[str, Any] = {
            "to": target_to,
            "subject": subject,
            "property_id": property_id,
            "reference_number": reference_num,
            "reason": reason,
            "requested_action": requested_action,
            "supporting_documents": [doc for doc in matched_docs if doc and doc.lower() != "not found"],
            "missing_documents": [doc for doc in missing_docs if doc and doc.lower() != "not found"],
            "applicant_name": citizen_name,
            "date": current_date,
            "additional_notes": additional_notes,
            "status": "draft"
        }

        # If Gemini model is active, refine language while preserving strict document lists
        if self._model:
            try:
                prompt_content = f"""
{APPLICATION_PROMPT}

INPUT NOTICE DATA:
{json.dumps(notice_data, indent=2)}

INPUT RESEARCH DATA:
{json.dumps(research_data, indent=2)}

CITIZEN AVAILABLE DOCUMENTS (ONLY THESE MAY BE LISTED AS SUPPORTING):
{json.dumps(matched_docs)}

CITIZEN MISSING DOCUMENTS:
{json.dumps(missing_docs)}

CITIZEN NAME: {citizen_name}
DATE: {current_date}
"""
                response = self._model.generate_content(prompt_content)
                raw_text = getattr(response, "text", "") or ""
                cleaned = raw_text.strip()
                if cleaned.startswith("```"):
                    import re
                    cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
                    cleaned = re.sub(r"\s*```$", "", cleaned).strip()
                
                parsed = json.loads(cleaned)
                # Enforce anti-fabrication on model output:
                parsed["supporting_documents"] = [doc for doc in matched_docs if doc and doc.lower() != "not found"]
                parsed["missing_documents"] = [doc for doc in missing_docs if doc and doc.lower() != "not found"]
                parsed["date"] = current_date
                parsed["status"] = "draft"

                validated = ApplicationDocument(**parsed)
                return validated.model_dump()
            except Exception as e:
                logger.warning(f"Gemini application generation failed, falling back to deterministic template: {e}")

        validated = ApplicationDocument(**app_dict)
        return validated.model_dump()
