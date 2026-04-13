# RECIST QA Platform

AI Measurement Validation and Oversight Layer for Oncology Clinical Trials

Built by Jafar | Demo for Medpace | 2026

## The Problem

While reviewing Medpace's publicly available annual report, the following risk was identified in the FY2025 10-K filed with the SEC on February 10, 2026:

> "risks arising from insufficient human oversight of AI or a lack of controls and procedures monitoring the use of AI in day-to-day operations"

Source: https://www.sec.gov/Archives/edgar/data/0001668397/000166839726000006/medp-20251231.htm

Medpace uses AI to automate RECIST 1.1 tumor measurements in oncology trials but has no structured validation layer between AI output and the reviewing radiologist. Low confidence classifications, new lesion detection errors, and image quality issues can pass through unchecked before reaching clinical decision makers.

## The Solution

RECIST QA sits between the AI imaging system and the radiologist. Before any measurement reaches a human reviewer it runs six automated quality checks on every AI-generated RECIST 1.1 output. Only flagged cases escalate. Everything else is cleared with a full audit trail ready for FDA inspection.

## Quickstart

Step 1: Add your API key

```
cd backend
cp .env.example .env
# Open .env and paste your Anthropic API key
```

Step 2: Run the backend

```
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
```

Step 3: Run the frontend in a second terminal

```
cd frontend
npm install
npm run dev
```

Step 4: Open http://localhost:3000

## The Six QA Rules

CONF-001: AI confidence below 75% threshold
NL-001: PD driven by low-confidence new lesion
TRAJ-001: Unexpected response trajectory shift
THRESHOLD-001: SLD change near SD/PR boundary
IQ-001: Image quality issues
CR-001: CR classification with residual SLD

## Stack

Backend: FastAPI + Python
Frontend: React + Vite
AI summaries: Anthropic API
Audit trail: In-memory log

## Built by

Jafar, AI/ML Engineer, Cincinnati OH
