# RECIST QA Platform

AI Measurement Validation and Oversight Layer for Oncology Clinical Trials

Built by Jafar | Demo for Medpace | 2026

---

## The Problem

While reviewing Medpace's publicly available annual report, the following risk was identified in the FY2025 10-K filed with the SEC on February 10, 2026:

> "Continued evolution and use of machine learning and generative AI, including risks arising from **insufficient human oversight of AI** or a lack of controls and procedures monitoring the use of AI in day-to-day operations... could have a negative impact on our financial results."

Source: [Medpace FY2025 10-K on SEC.gov](https://www.sec.gov/Archives/edgar/data/0001668397/000166839726000006/medp-20251231.htm)

Medpace's Core Lab already uses AI to automate RECIST 1.1 tumor measurements in oncology trials. However there is no structured validation layer between the AI output and the reviewing radiologist. This means low confidence classifications, new lesion detection errors, and image quality issues can pass through unchecked before reaching clinical decision makers.

A misclassified PD (progressive disease) can pull a patient from a trial they were actually responding to. A missed new lesion can falsely clear a patient who is progressing. In both cases the trial data integrity is compromised and FDA audit risk increases.

## The Solution

RECIST QA is a lightweight validation layer that sits between AI-generated RECIST 1.1 measurements and the reviewing radiologist.

Before any measurement reaches a human reviewer it automatically runs six quality checks on every AI output. Only flagged cases escalate. Everything else is cleared with a full audit trail ready for FDA inspection.

The radiologist stops reviewing every scan from scratch. They review exceptions. Their time goes where it actually matters.

## How It Works

```
AI Imaging System
      |
      v
RECIST QA Engine  (FastAPI backend)
      |
      | runs 6 automated checks
      |
      v
React Dashboard
      |
      | flagged cases only
      v
Radiologist sign-off + audit log
```

## The Six QA Rules

| Rule ID | What it checks | Severity |
|---------|---------------|----------|
| CONF-001 | AI confidence below 75% threshold | High or Medium |
| NL-001 | PD driven by low-confidence new lesion | High |
| TRAJ-001 | Unexpected response trajectory shift from prior timepoint | High or Medium |
| THRESHOLD-001 | SLD change near the SD/PR classification boundary | Medium |
| IQ-001 | Image quality issues such as co-registration, artifact, late upload | Medium |
| CR-001 | CR classification with residual SLD above zero | Medium |

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | FastAPI + Python |
| AI summaries | Claude API (claude-sonnet) |
| Frontend | React + Vite |
| Containers | Docker Compose |
| Audit trail | In-memory log, production would use PostgreSQL |

## Quickstart

```bash
# 1. Clone the repo
git clone https://github.com/YOUR_USERNAME/recist-qa
cd recist-qa

# 2. Add your API key
cp .env.example .env
# open .env and add your ANTHROPIC_API_KEY

# 3. Run the backend
cd backend
pip install -r requirements.txt
uvicorn main:app --reload

# 4. Run the frontend in a second terminal
cd frontend
npm install
npm run dev
```

Backend runs at http://localhost:8000

Frontend runs at http://localhost:3000

API docs at http://localhost:8000/docs

## API Endpoints

| Method | Endpoint | What it does |
|--------|----------|-------------|
| POST | /qa/validate | Run all QA checks on an AI measurement |
| POST | /qa/summarize | Generate plain-language radiologist brief via Claude |
| POST | /qa/review | Submit radiologist review action to audit log |
| GET | /qa/audit | Return full audit trail for FDA inspection |
| GET | /qa/batch-summary | Trial-level stats for dashboard |

## Example Request

```bash
curl -X POST http://localhost:8000/qa/validate \
  -H "Content-Type: application/json" \
  -d '{
    "patient_id": "PT-003",
    "site": "Berlin-02",
    "timepoint": "Cycle 4 / Wk 12",
    "ai_response": "PD",
    "sld_baseline_mm": 66,
    "sld_current_mm": 94,
    "ai_confidence": 0.43,
    "lesion_count": 4,
    "new_lesion_detected": true,
    "new_lesion_confidence": 0.43,
    "prior_response": "SD",
    "image_quality_flag": "co-registration"
  }'
```

## Example Response

```json
{
  "patient_id": "PT-003",
  "overall_risk": "escalate",
  "flags": [
    {
      "severity": "high",
      "title": "AI confidence below threshold (43%)",
      "description": "Confidence 43% is far below the 75% threshold required for unassisted PD classification. Radiologist sign-off mandatory.",
      "rule_id": "CONF-001"
    },
    {
      "severity": "high",
      "title": "PD driven by low-confidence new lesion (43%)",
      "description": "Progressive Disease classification is driven by a newly detected lesion with only 43% AI confidence. Human confirmation required before sponsor reporting.",
      "rule_id": "NL-001"
    }
  ],
  "reviewed": false
}
```

## Project Structure

```
recist-qa/
  backend/
    main.py          FastAPI app with all QA logic and endpoints
    requirements.txt Python dependencies
    Dockerfile
  frontend/
    src/
      App.jsx        React dashboard
      main.jsx       Entry point
    index.html
    package.json
    vite.config.js
    Dockerfile
  docs/
    pitch-package.md Cold email, Loom script, resume bullet, LinkedIn DM
  docker-compose.yml One command to run everything
  .env.example       Copy this to .env and add your API key
  .gitignore
  README.md
```

## Built by

Jafar

AI/ML Engineer based in Cincinnati, Ohio

MS in Artificial Intelligence, University of Cincinnati

Built as a targeted demo for Medpace addressing the AI oversight risk flagged in their FY2025 10-K.
