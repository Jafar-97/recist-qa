# RECIST QA Platform

**AI measurement validation and oversight layer for oncology clinical trials**

> *"risks arising from insufficient human oversight of AI or a lack of controls and procedures monitoring the use of AI in day-to-day operations"*
> — Medpace Holdings 10-K, Feb 2025 · [SEC source](https://investor.medpace.com/static-files/cd41645f-da0e-40fb-9677-ba23376ffd6a)

---

## What this solves

Medpace Core Lab automates RECIST 1.1 tumor measurements using ML. But AI-generated results go directly to radiologist review with no structured QA layer in between.

This platform sits between AI output and physician sign-off. It runs 6 automated validation rules, flags anomalies by severity, generates plain-language radiologist briefs via the Claude API, and logs every decision to an immutable audit trail.

---

## Problems addressed

| # | Source | Problem |
|---|--------|---------|
| 1 | [Medpace 10-K, Feb 2025](https://investor.medpace.com/static-files/cd41645f-da0e-40fb-9677-ba23376ffd6a) | "Insufficient human oversight of AI" flagged as financial risk |
| 2 | [Medpace + Medidata Whitepaper](https://www.medpace.com/blog/artificial-intelligence-can-boost-reliability-and-speed-of-medical-imaging-analysis-in-clinical-trials/) | Up to 40% inter-reader variability without AI guardrails |
| 3 | [Medpace AI Imaging Article, Aug 2025](https://www.medpace.com/wp-content/uploads/2025/08/Article-How-AI-and-ML-are-Transforming-the-Future-of-Medical-Imaging-in-Clinical-Trials.pdf) | AI RECIST outputs go directly to physician review without a QA step |
| 4 | [Medpace Oncology Imaging](https://www.medpace.com/core-lab/imaging-core-lab/therapeutic-expertise/oncology-imaging/) | RECIST 1.1 is the only FDA-accepted oncology endpoint — errors have regulatory impact |

---

## Stack

- **Frontend**: React + Vite (deployed on Vercel)
- **Backend**: FastAPI + Python (deployed on Render)
- **AI**: Anthropic Claude API for radiologist brief generation

---

## Run locally

```bash
# Backend
cd backend
pip install -r requirements.txt
cp .env.example .env  # add your ANTHROPIC_API_KEY
uvicorn main:app --reload

# Frontend
cd frontend
npm install
npm run dev
```

---

## Deploy

**Frontend (Vercel)**
1. Push to GitHub
2. Connect repo on vercel.com
3. Set `VITE_API_URL` to your Render backend URL

**Backend (Render)**
1. New Web Service on render.com
2. Connect GitHub repo, set root to `/backend`
3. Build: `pip install -r requirements.txt`
4. Start: `uvicorn main:app --host 0.0.0.0 --port 8000`
5. Add `ANTHROPIC_API_KEY` in environment variables

---

Built by Jafar
