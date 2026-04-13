"""
recist-qa: AI Measurement Validation and Oversight Layer for RECIST 1.1
Built to address Medpace FY2025 10-K risk: insufficient human oversight of AI
Source: https://www.sec.gov/Archives/edgar/data/0001668397/000166839726000006/medp-20251231.htm
Author: Jafar
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
import httpx
import os
from datetime import datetime

app = FastAPI(
    title="RECIST QA API",
    description="AI validation and oversight layer for RECIST 1.1 oncology imaging measurements",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")

# Models

class RECISTMeasurement(BaseModel):
    patient_id: str
    site: str
    timepoint: str
    ai_response: str
    sld_baseline_mm: float
    sld_current_mm: float
    ai_confidence: float
    lesion_count: int
    new_lesion_detected: bool
    new_lesion_confidence: Optional[float] = None
    prior_response: Optional[str] = None
    image_quality_flag: Optional[str] = None

class QAFlag(BaseModel):
    severity: str
    title: str
    description: str
    rule_id: str

class QAResult(BaseModel):
    patient_id: str
    overall_risk: str
    flags: list[QAFlag]
    ai_summary: Optional[str] = None
    reviewed: bool = False
    reviewed_at: Optional[str] = None
    reviewer_action: Optional[str] = None

class ReviewAction(BaseModel):
    patient_id: str
    action: str
    reviewer_note: Optional[str] = None

# QA Engine

CONFIDENCE_THRESHOLD = 0.75
NEW_LESION_CONFIDENCE_THRESHOLD = 0.70

def run_qa_checks(m: RECISTMeasurement) -> list[QAFlag]:
    flags = []
    sld_change_pct = ((m.sld_current_mm - m.sld_baseline_mm) / m.sld_baseline_mm * 100) if m.sld_baseline_mm > 0 else 0

    # Rule CONF-001: Low overall AI confidence
    if m.ai_confidence < CONFIDENCE_THRESHOLD:
        severity = "high" if m.ai_confidence < 0.55 else "medium"
        flags.append(QAFlag(
            severity=severity,
            title=f"AI confidence below threshold ({int(m.ai_confidence*100)}%)",
            description=f"Confidence {int(m.ai_confidence*100)}% is below the {int(CONFIDENCE_THRESHOLD*100)}% threshold required for unassisted classification. Radiologist sign-off is mandatory.",
            rule_id="CONF-001"
        ))

    # Rule NL-001: New lesion with low confidence driving PD
    if m.new_lesion_detected and m.ai_response == "PD":
        conf = m.new_lesion_confidence or 0.0
        if conf < NEW_LESION_CONFIDENCE_THRESHOLD:
            flags.append(QAFlag(
                severity="high",
                title=f"PD driven by low-confidence new lesion ({int(conf*100)}%)",
                description=f"Progressive Disease classification is driven by a newly detected lesion with only {int(conf*100)}% AI confidence. New lesion detection is the most common source of reader adjudication errors. Human confirmation is required before any sponsor reporting.",
                rule_id="NL-001"
            ))

    # Rule TRAJ-001: Unexpected trajectory shift from prior response
    if m.prior_response and m.prior_response != m.ai_response:
        bad_shifts = [("PR", "SD"), ("PR", "PD"), ("CR", "SD"), ("CR", "PD"), ("SD", "PD")]
        if (m.prior_response, m.ai_response) in bad_shifts:
            flags.append(QAFlag(
                severity="high" if "PD" in m.ai_response else "medium",
                title=f"Unexpected trajectory shift: {m.prior_response} to {m.ai_response}",
                description=f"Patient was classified {m.prior_response} at prior timepoint. Current {m.ai_response} classification is an unexpected trajectory change. Verify AI is not misclassifying a residual or new target lesion.",
                rule_id="TRAJ-001"
            ))

    # Rule THRESHOLD-001: SLD change near SD/PR boundary
    if m.ai_response in ["SD", "PR"]:
        if abs(sld_change_pct) < 10:
            flags.append(QAFlag(
                severity="medium",
                title="SLD change within classification noise range",
                description=f"SLD change of {sld_change_pct:.1f}% is near the SD/PR boundary. The minus 30% threshold means this classification may be unstable. Consider measurement reproducibility.",
                rule_id="THRESHOLD-001"
            ))

    # Rule IQ-001: Image quality issues
    if m.image_quality_flag:
        quality_messages = {
            "co-registration": "CT acquisition angle differs from the prior scan. Abdominal breathing artifact may affect measurement accuracy and lesion tracking.",
            "late-upload": "Scan was uploaded outside the expected protocol window. Verify patient visit date alignment with the protocol schedule.",
            "artifact": "Image artifact detected. QC review is required before measurement acceptance."
        }
        flags.append(QAFlag(
            severity="medium",
            title=f"Image quality flag: {m.image_quality_flag.replace('-', ' ').title()}",
            description=quality_messages.get(m.image_quality_flag, "Image quality issue detected."),
            rule_id="IQ-001"
        ))

    # Rule CR-001: CR with residual SLD
    if m.ai_response == "CR" and m.sld_current_mm > 0:
        flags.append(QAFlag(
            severity="medium",
            title="CR classification with residual SLD",
            description=f"Complete Response requires all target lesions to resolve to 0mm. Current SLD reads {m.sld_current_mm}mm. Verify lesion resolution criteria are met per RECIST 1.1.",
            rule_id="CR-001"
        ))

    return flags


def calculate_overall_risk(flags: list[QAFlag]) -> str:
    if any(f.severity == "high" for f in flags):
        return "escalate"
    if any(f.severity == "medium" for f in flags):
        return "review"
    return "cleared"


# In-memory audit log (use PostgreSQL in production)
audit_log: list[dict] = []


# Routes

@app.get("/")
def root():
    return {
        "service": "RECIST QA API",
        "version": "1.0.0",
        "description": "AI oversight layer for RECIST 1.1 oncology imaging measurements",
        "problem_source": "Medpace FY2025 10-K: insufficient human oversight of AI",
        "sec_filing": "https://www.sec.gov/Archives/edgar/data/0001668397/000166839726000006/medp-20251231.htm"
    }


@app.post("/qa/validate", response_model=QAResult)
def validate_measurement(measurement: RECISTMeasurement):
    flags = run_qa_checks(measurement)
    risk = calculate_overall_risk(flags)

    result = QAResult(
        patient_id=measurement.patient_id,
        overall_risk=risk,
        flags=flags
    )

    audit_log.append({
        "event": "qa_validated",
        "patient_id": measurement.patient_id,
        "risk": risk,
        "flag_count": len(flags),
        "timestamp": datetime.utcnow().isoformat()
    })

    return result


@app.post("/qa/summarize")
async def generate_summary(measurement: RECISTMeasurement):
    if not ANTHROPIC_API_KEY:
        raise HTTPException(status_code=500, detail="ANTHROPIC_API_KEY not configured")

    flags = run_qa_checks(measurement)
    risk = calculate_overall_risk(flags)
    sld_change = measurement.sld_current_mm - measurement.sld_baseline_mm

    flag_text = "\n".join([
        f"[{f.severity.upper()}] {f.title}: {f.description}"
        for f in flags
    ]) if flags else "No flags raised."

    prompt = f"""You are a clinical trial QA assistant reviewing AI-generated RECIST 1.1 measurements for an oncology trial.

Patient: {measurement.patient_id} | Site: {measurement.site} | Timepoint: {measurement.timepoint}
AI classification: {measurement.ai_response}
SLD baseline: {measurement.sld_baseline_mm}mm, current: {measurement.sld_current_mm}mm, change: {sld_change:+.1f}mm
AI confidence: {int(measurement.ai_confidence * 100)}%
New lesion detected: {measurement.new_lesion_detected}
QA risk level: {risk.upper()}

QA flags:
{flag_text}

Write a 2 to 3 sentence plain-language QA summary for the reviewing radiologist. Be specific about what needs attention and what action is required. Do not use bullet points or dashes. Do not introduce yourself."""

    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://api.anthropic.com/v1/messages",
            headers={
                "x-api-key": ANTHROPIC_API_KEY,
                "anthropic-version": "2023-06-01",
                "content-type": "application/json"
            },
            json={
                "model": "claude-sonnet-4-20250514",
                "max_tokens": 300,
                "messages": [{"role": "user", "content": prompt}]
            },
            timeout=30.0
        )

    if response.status_code != 200:
        raise HTTPException(status_code=500, detail="LLM API error")

    data = response.json()
    summary = data["content"][0]["text"]

    audit_log.append({
        "event": "summary_generated",
        "patient_id": measurement.patient_id,
        "timestamp": datetime.utcnow().isoformat()
    })

    return {
        "patient_id": measurement.patient_id,
        "summary": summary,
        "risk": risk,
        "flags": [f.dict() for f in flags]
    }


@app.post("/qa/review")
def submit_review(action: ReviewAction):
    audit_log.append({
        "event": "radiologist_review",
        "patient_id": action.patient_id,
        "action": action.action,
        "note": action.reviewer_note,
        "timestamp": datetime.utcnow().isoformat()
    })
    return {
        "status": "logged",
        "patient_id": action.patient_id,
        "action": action.action
    }


@app.get("/qa/audit")
def get_audit_log():
    return {
        "total_events": len(audit_log),
        "log": audit_log
    }


@app.get("/qa/batch-summary")
def get_batch_summary():
    return {
        "escalations": sum(1 for e in audit_log if e.get("risk") == "escalate"),
        "reviews_needed": sum(1 for e in audit_log if e.get("risk") == "review"),
        "cleared": sum(1 for e in audit_log if e.get("risk") == "cleared"),
        "radiologist_reviews": sum(1 for e in audit_log if e.get("event") == "radiologist_review")
    }
