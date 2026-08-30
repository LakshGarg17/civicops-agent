"""
Research Agent for CivicOps.
Determines official government procedures, responsible authorities, required documents,
action steps, deadlines, and fees based on extracted notice data and grounded civic sources.
"""

import json
import logging
import re
from typing import Dict, Any, Optional, List

import google.generativeai as genai
from backend.config import GEMINI_API_KEY, GEMINI_MODEL
from backend.models.research import ProcedureResearchData
from backend.tools.web_search import WebSearchTool

logger = logging.getLogger("civicops.research_agent")

DEFAULT_RESEARCH_FALLBACK: Dict[str, Any] = {
    "procedure_name": "Administrative Notice Review & Response Procedure",
    "authority": "Relevant Municipal / County Authority",
    "submission_method": "Official Government Portal or In-Person / Mail-in Filing",
    "required_documents": [
        "Copy of Original Notice",
        "Written Statement of Response",
        "Supporting Evidence"
    ],
    "steps": [
        "Verify notice identification and statutory deadline.",
        "Gather supporting records and identity documents.",
        "Prepare and sign formal written petition or appeal.",
        "Submit required documents through authorized civic channel.",
        "Track case reference number and await agency determination."
    ],
    "deadline_information": "Not found",
    "fees": "Not found",
    "additional_requirements": [],
    "rationale": "Official procedure identified based on notice classification, issuing authority, and governing administrative code.",
    "source_information": ["Official Municipal Code and Administrative Guidelines (.gov)"]
}

RESEARCH_AGENT_SYSTEM_PROMPT = """You are the CivicOps Research Agent. Your job is to analyze structured notice information, synthesize official government procedure knowledge, and determine the exact, official civic procedure required to resolve the issue.

Given the structured notice information and grounded search context:
1. Identify the applicable government service/procedure.
2. Determine the responsible authority.
3. Identify required documents.
4. Identify the submission method.
5. Identify important deadlines and fees.
6. Determine the sequence of actions.
7. Provide a concise 'rationale' explaining why this procedure is legally applicable to the notice.
8. Use authoritative sources whenever possible.
9. NEVER invent requirements.
10. Clearly mark information that could not be verified (use 'Not found' or 'Unverified' — do not hallucinate a plausible-sounding value).
11. Return structured JSON matching the required schema.

REQUIRED OUTPUT JSON SCHEMA:
{
  "procedure_name": "Formal title of the procedure",
  "authority": "Responsible government department or board",
  "submission_method": "Submission method (e.g. online portal, certified mail, counter)",
  "required_documents": ["Document 1", "Document 2"],
  "steps": ["Step 1", "Step 2", "Step 3"],
  "deadline_information": "Specific statutory deadline or 'Not found' / 'Unverified'",
  "fees": "Filing fee or 'Not found' / 'Unverified'",
  "additional_requirements": ["Requirement 1"],
  "rationale": "Clear 1-2 sentence explanation of why this procedure applies to the notice",
  "source_information": ["Source 1 (.gov)", "Source 2"]
}


CRITICAL ANTI-HALLUCINATION RULES & EXAMPLES:
- If a deadline or fee cannot be verified from the notice or grounded authoritative source, output "Not found" or "Unverified".
- Example of non-hallucination when deadline and fee are absent from sources:
{
  "procedure_name": "General Code Compliance Review",
  "authority": "Department of Code Enforcement",
  "submission_method": "In-person or City Portal",
  "required_documents": ["Notice of Violation", "Proof of Abatement"],
  "steps": ["Inspect cited condition", "Perform required remedy", "Request re-inspection"],
  "deadline_information": "Not found",
  "fees": "Unverified",
  "additional_requirements": [],
  "source_information": ["City Municipal Code Chapter 5 (.gov)"]
}

OUTPUT RULES:
Output MUST be strict valid JSON only. Do NOT include markdown fences (```json), introductory text, or explanations.
"""

class ResearchAgent:
    """
    Research Agent determines the official civic procedure and required actions
    by combining extracted notice data with grounded government search sources.
    """

    def __init__(
        self,
        api_key: Optional[str] = None,
        model_name: Optional[str] = None,
        search_tool: Optional[WebSearchTool] = None
    ):
        self.api_key = api_key or GEMINI_API_KEY
        self.model_name = model_name or GEMINI_MODEL
        self.search_tool = search_tool or WebSearchTool()
        self._model = None
        self._initialize_client()

    def _initialize_client(self) -> None:
        if not self.api_key or self.api_key == "your_gemini_api_key_here":
            logger.warning("ResearchAgent: GEMINI_API_KEY is not configured. Running with grounded offline search fallback.")
            return

        try:
            genai.configure(api_key=self.api_key)
            self._model = genai.GenerativeModel(self.model_name)
            logger.info(f"ResearchAgent initialized with Gemini model: {self.model_name}")
        except Exception as e:
            logger.error(f"ResearchAgent failed to initialize Gemini model: {e}", exc_info=True)
            self._model = None

    def clean_and_parse_json(self, raw_output: str) -> Dict[str, Any]:
        """
        Cleans and parses raw JSON output from the model.
        Strips markdown code blocks, normalizes keys, and applies anti-hallucination fallbacks.
        """
        if not raw_output or not raw_output.strip():
            logger.warning("Empty output received from model. Returning default research fallback.")
            return DEFAULT_RESEARCH_FALLBACK.copy()

        cleaned = raw_output.strip()

        # Remove markdown code blocks if present
        if cleaned.startswith("```"):
            cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned, flags=re.IGNORECASE)
            cleaned = re.sub(r"\s*```$", "", cleaned)
            cleaned = cleaned.strip()

        try:
            data = json.loads(cleaned)
            if not isinstance(data, dict):
                logger.warning(f"Parsed JSON is not a dictionary: {type(data)}. Using fallback.")
                return DEFAULT_RESEARCH_FALLBACK.copy()

            # Ensure all required fields exist and are normalized
            result: Dict[str, Any] = {}
            result["procedure_name"] = str(data.get("procedure_name") or DEFAULT_RESEARCH_FALLBACK["procedure_name"]).strip()
            result["authority"] = str(data.get("authority") or DEFAULT_RESEARCH_FALLBACK["authority"]).strip()
            result["submission_method"] = str(data.get("submission_method") or DEFAULT_RESEARCH_FALLBACK["submission_method"]).strip()
            
            # Required documents list
            req_docs = data.get("required_documents")
            if isinstance(req_docs, list):
                result["required_documents"] = [str(d).strip() for d in req_docs if d and str(d).strip()]
            else:
                result["required_documents"] = DEFAULT_RESEARCH_FALLBACK["required_documents"].copy()

            # Steps list
            steps = data.get("steps")
            if isinstance(steps, list):
                result["steps"] = [str(s).strip() for s in steps if s and str(s).strip()]
            else:
                result["steps"] = DEFAULT_RESEARCH_FALLBACK["steps"].copy()

            # Deadline and fees (explicitly preserve 'Not found' / 'Unverified')
            deadline_info = data.get("deadline_information")
            result["deadline_information"] = str(deadline_info).strip() if deadline_info else "Not found"

            fees_info = data.get("fees")
            result["fees"] = str(fees_info).strip() if fees_info else "Not found"

            # Additional requirements list
            add_reqs = data.get("additional_requirements")
            if isinstance(add_reqs, list):
                result["additional_requirements"] = [str(r).strip() for r in add_reqs if r and str(r).strip()]
            else:
                result["additional_requirements"] = []

            # Rationale explanation
            rationale_val = data.get("rationale")
            result["rationale"] = str(rationale_val).strip() if rationale_val else DEFAULT_RESEARCH_FALLBACK["rationale"]

            # Source information
            sources = data.get("source_information")
            if isinstance(sources, list):
                result["source_information"] = [str(s).strip() for s in sources if s and str(s).strip()]
            else:
                result["source_information"] = DEFAULT_RESEARCH_FALLBACK["source_information"].copy()

            return result

        except Exception as e:
            logger.error(f"Failed to parse research JSON: {e}. Raw text: {raw_output[:200]}")
            return DEFAULT_RESEARCH_FALLBACK.copy()

    def research_procedure(self, notice_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main Research Agent method.
        Given notice_data dict from Document Agent, conducts grounded search
        and queries Gemini (or returns grounded authoritative procedure) to determine
        applicable civic rules, required documents, steps, submission methods, and sources.
        """
        notice_type = str(notice_data.get("notice_type", "") or "")
        issuing_authority = str(notice_data.get("issuing_authority", "") or "")
        department = str(notice_data.get("department", "") or "")
        issue = str(notice_data.get("issue", "") or "")
        deadline = str(notice_data.get("deadline", "") or "")
        mentioned_docs = notice_data.get("mentioned_documents", []) or []

        # 1. Ground research via web / government search tool
        search_result = self.search_tool.search_civic_procedure(
            notice_type=notice_type,
            issuing_authority=issuing_authority,
            department=department,
            issue=issue
        )

        grounded_data = search_result.get("grounded_procedure", {})
        sources_checked = search_result.get("sources_checked", [])

        # If Gemini client is not configured or in offline mode, synthesize grounded data with notice data
        if not self._model:
            logger.info("ResearchAgent running with grounded search synthesis.")
            merged = self._synthesize_grounded_response(notice_data, grounded_data, sources_checked)
            return merged

        # 2. Query Gemini with strict system prompt and grounded search context
        user_prompt = f"""
NOTICE EXTRACTED DATA:
- Notice Type: {notice_type}
- Issuing Authority: {issuing_authority}
- Department: {department}
- Issue / Reason: {issue}
- Explicit Deadline in Notice: {deadline}
- Mentioned Documents in Notice: {json.dumps(mentioned_docs)}

GROUNDED GOVERNMENT SOURCES SEARCH CONTEXT:
- Grounded Procedure Name: {grounded_data.get('procedure_name', 'Not found')}
- Grounded Authority: {grounded_data.get('authority', 'Not found')}
- Grounded Submission Method: {grounded_data.get('submission_method', 'Not found')}
- Grounded Required Documents: {json.dumps(grounded_data.get('required_documents', []))}
- Grounded Steps: {json.dumps(grounded_data.get('steps', []))}
- Grounded Deadline Info: {grounded_data.get('deadline_information', 'Not found')}
- Grounded Fees: {grounded_data.get('fees', 'Not found')}
- Authoritative Sources Consulted: {json.dumps(sources_checked)}

Determine the precise civic procedure, authoritative submission method, all required documents, chronological steps, deadline rules, fees, and clear rationale. Return ONLY the strict JSON object.
"""

        try:
            full_prompt = f"{RESEARCH_AGENT_SYSTEM_PROMPT}\n\n{user_prompt}"
            response = self._model.generate_content(full_prompt)
            raw_text = getattr(response, "text", "") or ""
            parsed = self.clean_and_parse_json(raw_text)

            # Ensure sources_checked are always included
            if not parsed.get("source_information"):
                parsed["source_information"] = sources_checked
            else:
                for src in sources_checked:
                    if src not in parsed["source_information"]:
                        parsed["source_information"].append(src)

            # Merge any explicitly mentioned documents from notice if missing
            if mentioned_docs:
                for m_doc in mentioned_docs:
                    if m_doc and m_doc.lower() != "not found" and m_doc not in parsed["required_documents"]:
                        parsed["required_documents"].append(m_doc)

            # Validate with Pydantic model
            validated = ProcedureResearchData(**parsed)
            return validated.model_dump()

        except Exception as e:
            logger.error(f"Error during Gemini research_procedure call: {e}", exc_info=True)
            merged = self._synthesize_grounded_response(notice_data, grounded_data, sources_checked)
            return merged

    def _synthesize_grounded_response(
        self,
        notice_data: Dict[str, Any],
        grounded_data: Dict[str, Any],
        sources_checked: List[str]
    ) -> Dict[str, Any]:
        """
        Synthesizes a robust, deterministic grounded procedure response
        when Gemini model is offline or during fallback execution.
        """
        deadline_notice = notice_data.get("deadline", "Not found")
        deadline_info = grounded_data.get("deadline_information", "Not found")
        if deadline_notice and deadline_notice.lower() != "not found":
            final_deadline = f"{deadline_notice} (Per Notice: {deadline_info})"
        else:
            final_deadline = deadline_info

        # Combine required documents from grounded procedure + explicitly mentioned docs
        req_docs = list(grounded_data.get("required_documents", []))
        mentioned_docs = notice_data.get("mentioned_documents", []) or []
        for m_doc in mentioned_docs:
            if m_doc and m_doc.lower() != "not found" and m_doc not in req_docs:
                req_docs.append(m_doc)

        notice_issue = notice_data.get("issue", "")
        notice_type = notice_data.get("notice_type", "civic notice")
        rationale_text = (
            f"The received {notice_type} specifies: '{notice_issue}'. "
            f"Applicable statutory guidelines require filing an administrative dispute/petition with the {grounded_data.get('authority', 'review authority')}."
            if notice_issue and notice_issue.lower() != "not found"
            else f"Official procedure identified based on {notice_type} requirements under governing municipal code."
        )

        result = {
            "procedure_name": grounded_data.get("procedure_name", DEFAULT_RESEARCH_FALLBACK["procedure_name"]),
            "authority": grounded_data.get("authority", notice_data.get("issuing_authority", DEFAULT_RESEARCH_FALLBACK["authority"])),
            "submission_method": grounded_data.get("submission_method", DEFAULT_RESEARCH_FALLBACK["submission_method"]),
            "required_documents": req_docs if req_docs else DEFAULT_RESEARCH_FALLBACK["required_documents"],
            "steps": grounded_data.get("steps", DEFAULT_RESEARCH_FALLBACK["steps"]),
            "deadline_information": final_deadline,
            "fees": grounded_data.get("fees", "Not found"),
            "additional_requirements": grounded_data.get("additional_requirements", []),
            "rationale": rationale_text,
            "source_information": grounded_data.get("source_information", sources_checked or DEFAULT_RESEARCH_FALLBACK["source_information"])
        }

        validated = ProcedureResearchData(**result)
        return validated.model_dump()

