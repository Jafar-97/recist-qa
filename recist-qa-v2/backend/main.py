from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import anthropic
import os

app = FastAPI(title="RECIST QA Platform", version="2.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY", ""))

class BriefRequest(BaseModel):
    patient_id: str
    prompt: str

class MeasurementRequest(BaseModel):
    patient_id: str
    timepoint: str
    ai_response: str
    confidence: float
    lesion_count: int
    prior_lesion_count: int | None = None
    sld_change_pct: float | None = None
    prior_response: str | None = None

def check_low_conf(m): return m.confidence < 85
def msg_low_conf(m): return f"AI confidence {m.confidence}% is below 85% threshold. May indicate image quality issue."

def check_lesion(m): return m.prior_lesion_count is not None and abs(m.lesion_count - m.prior_lesion_count) > 1 and m.ai_response != "CR"
def msg_lesion(m): return f"Lesion count changed from {m.prior_lesion_count} to {m.lesion_count} without CR classification."

def check_traj(m): return m.sld_change_pct is not None and m.sld_change_pct > 40
def msg_traj(m): return f"Tumor burden increased {m.sld_change_pct:.1f}% in a single cycle. Exceeds expected range."

def check_boundary(m): return m.sld_change_pct is not None and -32 <= m.sld_change_pct <= -27 and m.ai_response == "SD"
def msg_boundary(m): return f"SLD change {m.sld_change_pct:.1f}% is within 3% of PR threshold. Secondary read recommended."

def check_pd_conf(m): return m.ai_response == "PD" and m.confidence < 75
def msg_pd_conf(m): return f"PD classification with only {m.confidence}% confidence requires careful verification."

def check_unexp_cr(m): return m.ai_response == "CR" and m.prior_response not in [None, "PR", "SD"]
def msg_unexp_cr(m): return f"CR classification without prior PR/SD progression. Unexpected trajectory."

QA_RULES = [
    {"id": "low_confidence", "name": "Low AI confidence", "severity": "low", "check": check_low_conf, "message": msg_low_conf},
    {"id": "lesion_mismatch", "name": "Lesion count mismatch", "severity": "high", "check": check_lesion, "message": msg_lesion},
    {"id": "trajectory_anomaly", "name": "Trajectory anomaly", "severity": "high", "check": check_traj, "message": msg_traj},
    {"id": "boundary_case", "name": "Response boundary case", "severity": "medium", "check": check_boundary, "message": msg_boundary},
    {"id": "pd_low_confidence", "name": "PD with low confidence", "severity": "high", "check": check_pd_conf, "message": msg_pd_conf},
    {"id": "unexpected_cr", "name": "Unexpected CR", "severity": "high", "check": check_unexp_cr, "message": msg_unexp_cr},
]

@app.get("/api/health")
def health():
    return {"status": "ok", "version": "2.0.0"}

@app.post("/api/validate")
def validate_measurement(req: MeasurementRequest):
    flags = []
    for rule in QA_RULES:
        try:
            if rule["check"](req):
                flags.append({
                    "rule_id": rule["id"],
                    "name": rule["name"],
                    "severity": rule["severity"],
                    "message": rule["message"](req),
                })
        except Exception:
            pass

    if not flags:
        status = "passed"
    elif any(f["severity"] == "high" for f in flags):
        status = "flagged"
    else:
        status = "review"

    return {
        "patient_id": req.patient_id,
        "timepoint": req.timepoint,
        "status": status,
        "flags": flags,
        "flag_count": len(flags),
        "requires_override": status in ["flagged", "review"],
    }

@app.post("/api/brief")
def generate_brief(req: BriefRequest):
    api_key = os.environ.get("ANTHROPIC_API_KEY", "")
    if not api_key:
        return {"brief": f"API key not configured. For patient {req.patient_id}: review flagged measurements manually before sign-off.", "patient_id": req.patient_id}
    try:
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=300,
            messages=[{"role": "user", "content": req.prompt}],
        )
        brief = message.content[0].text
        return {"brief": brief, "patient_id": req.patient_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
