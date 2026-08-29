"""
Curated government domain filtering & authority lookup for CivicOps.
Biases research toward official government portals (.gov, municipal services, county assessor sites).
"""

from typing import List, Dict, Any, Optional

OFFICIAL_GOVERNMENT_DOMAINS = [
    ".gov",
    ".gov.uk",
    ".ca.gov",
    ".ny.gov",
    ".tx.gov",
    ".fl.gov",
    ".nyc.gov",
    ".kingscounty.gov",
    ".oakridge.gov",
    ".metropolis.gov",
    ".usps.com",
    ".courts.gov"
]

# Curated reference procedures for civic domains to ensure accurate grounding in demo & offline modes
KNOWN_CIVIC_PROCEDURES: Dict[str, Dict[str, Any]] = {
    "property tax delinquency": {
        "procedure_name": "Administrative Property Tax Delinquency & Assessment Dispute Procedure",
        "authority": "County Office of the Tax Collector / Assessor-Recorder",
        "submission_method": "County Tax Portal Online Submission or In-Person / Certified Mail to Tax Collector",
        "required_documents": [
            "Dispute Form TC-409 (Completed & Signed)",
            "Proof of Prior Payment (Canceled Check or Bank Statement)",
            "Recorded Grant Deed or Proof of Ownership"
        ],
        "steps": [
            "Verify the assessment parcel number (APN) and billing period discrepancies.",
            "Gather required proof of ownership and payment records.",
            "Complete and sign the formal Dispute Form TC-409.",
            "Submit dispute package via county tax portal or registered postal mail.",
            "Monitor county tax portal for review status and hearing notice if scheduled."
        ],
        "deadline_information": "Must be filed within 30 days of statutory notice date to prevent lien attachment",
        "fees": "$0 filing fee for initial dispute (Late penalty applied if dispute rejected)",
        "additional_requirements": [
            "Must include certified parcel APN",
            "Copy of original tax delinquency notice required"
        ],
        "source_information": [
            "Official County Tax Collector Portal (kingscounty.gov/taxes/disputes)",
            "State Revenue and Taxation Code § 3351 (Tax Default & Lien Attachment Guidelines)"
        ]
    },
    "building permit correction": {
        "procedure_name": "Plan Check Correction & Supplemental Engineering Resubmission",
        "authority": "Municipal Department of Building Inspection / Plan Review Division",
        "submission_method": "Department Electronic Plan Review (EPR) Portal or Plan Check Counter",
        "required_documents": [
            "Revised Structural Calculations (Stamped by Licensed Professional Engineer)",
            "Single Line Electrical Diagram",
            "AC Disconnect Specification Sheet",
            "Plan Check Correction Response Form"
        ],
        "steps": [
            "Review plan checker markups and items cited in correction notice.",
            "Have licensed engineer revise structural rafter and load calculations.",
            "Update electrical single-line schematic with AC disconnect location.",
            "Prepare written point-by-point response itemizing revisions.",
            "Resubmit corrected plan set via Electronic Plan Review (EPR) portal.",
            "Schedule secondary plan check clearance appointment."
        ],
        "deadline_information": "Resubmission required within 60 calendar days of correction notice",
        "fees": "$185.00 Re-Review and Supplemental Plan Check Fee",
        "additional_requirements": [
            "All engineering calculations must bear digital PE seal and signature",
            "Resubmission must include response letter addressing each comment line-by-line"
        ],
        "source_information": [
            "City Building Inspection Portal (oakridge.gov/building/plancheck)",
            "Municipal Building Code Chapter 11 (Permit Resubmission Standards)"
        ]
    },
    "parking citation": {
        "procedure_name": "Administrative Review & Parking Citation Dispute Procedure",
        "authority": "Municipal Department of Transportation / Parking Enforcement Bureau",
        "submission_method": "Online Citation Dispute Web Portal or Mail-in Contest Form",
        "required_documents": [
            "Copy of Parking Citation Notice",
            "Proof of Valid Residential Parking Permit / Payment Receipt",
            "Vehicle Registration Certificate",
            "Photographic Evidence of Signage or Vehicle Location (Optional)"
        ],
        "steps": [
            "Review citation violation code and recorded location/time.",
            "Gather valid parking permit, payment receipt, or signage photos.",
            "Submit Initial Administrative Review request online within statutory window.",
            "Receive written determination by parking bureau within 14 business days.",
            "If contested further, request secondary administrative hearing."
        ],
        "deadline_information": "Request for review must be submitted within 21 calendar days of issuance",
        "fees": "No fee for initial administrative review ($65.00 fine held in abeyance during review)",
        "additional_requirements": [
            "Vehicle license plate and citation number must match records exactly"
        ],
        "source_information": [
            "Department of Transportation Citation Adjudication (metropolis.gov/transportation/citations)",
            "Municipal Vehicle Code § 80.69 (Administrative Adjudication of Parking Violations)"
        ]
    }
}

def is_government_domain(url: str) -> bool:
    """Checks whether a given URL or source belongs to a recognized government or official civic domain."""
    url_lower = url.lower()
    return any(domain in url_lower for domain in OFFICIAL_GOVERNMENT_DOMAINS)

def build_government_search_query(issuing_authority: str, notice_type: str, department: str, issue: str) -> str:
    """Builds a targeted search query optimized for government portals and official procedures."""
    terms = []
    if issuing_authority and issuing_authority.lower() != "not found":
        terms.append(issuing_authority)
    if department and department.lower() != "not found":
        terms.append(department)
    if notice_type and notice_type.lower() != "not found":
        terms.append(notice_type)
    
    query = " ".join(terms) + " official procedure required documents appeal deadline site:.gov OR site:.org"
    return query.strip()

def get_known_civic_procedure(notice_type: str, issue: str = "") -> Optional[Dict[str, Any]]:
    """
    Finds a curated procedure if notice matches known civic domains.
    Provides verified baseline to avoid hallucinations.
    """
    text = f"{notice_type} {issue}".lower()
    for key, procedure in KNOWN_CIVIC_PROCEDURES.items():
        if key in text:
            return procedure
    return None
