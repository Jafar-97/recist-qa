# RECIST QA Platform: Full Pitch Package

Built by Jafar | Demo for Medpace | 2026

---

## 1. COLD EMAIL

To: m.adineh@medpace.com
Backup: madineh@medpace.com
CC: s.holland@medpace.com
Subject: Built something for Medpace's AI oversight gap, demo inside

Hi Mehdi,

In Medpace's FY2025 10-K filed February 2026, you flagged "insufficient human oversight of AI" as an active business risk for the second consecutive year.

I took that seriously and built something.

It's called RECIST QA, a validation layer that sits between your AI measurements and radiologist sign-off. Before a read reaches a radiologist it automatically checks:

Is AI confidence above threshold? If not, flag it.
Is a PD classification being driven by a low-confidence new lesion? Escalate it.
Does the response trajectory make sense vs the prior timepoint? Flag unexpected shifts.
Are there image quality issues affecting measurement accuracy? Flag those too.

Radiologists stop reviewing every scan from scratch. They review flagged exceptions only. Every action is audit-logged for FDA inspections.

Loom demo (3 min): INSERT LOOM LINK HERE
GitHub: INSERT GITHUB LINK HERE

I am an AI/ML engineer based here in Cincinnati. I have an MS in AI from UC and around 2 years of production experience building LLM systems and agentic pipelines. I also just applied to the AI Specialist role on your careers portal.

Would you have 15 minutes to see the full demo?

Jafar
INSERT LINKEDIN LINK HERE
INSERT PHONE NUMBER HERE

---

## 2. LINKEDIN DM (send if no email reply after 5 days)

Hi Mehdi, I noticed Medpace's FY2025 10-K flagged insufficient human oversight of AI as an active risk. I am an AI/ML engineer based in Cincinnati and I built a working RECIST QA validation layer that addresses it directly. It sits between AI measurements and radiologist sign-off, flags low-confidence calls, and logs everything for FDA audits. Just applied to the AI Specialist role too. Would love to share a quick demo if you have 15 minutes.

Loom: INSERT LINK HERE
GitHub: INSERT LINK HERE

---

## 3. LOOM SCRIPT (3 minutes)

[0:00 to 0:20] HOOK
"Medpace's FY2025 annual report filed just two months ago lists insufficient human oversight of AI as an active business risk. I am Jafar, an AI engineer based in Cincinnati. I read that and built something to address it. This is a 3 minute demo."

[0:20 to 0:50] SHOW THE DASHBOARD
"This is RECIST QA, a validation layer for AI-generated RECIST 1.1 measurements in oncology trials. You are looking at a Phase III NSCLC trial at Cycle 4. Eight patients are loaded. The system already ran QA checks on every AI measurement automatically."

"Top row: 3 escalations, 2 need review, 3 cleared. Radiologists only touch the ones that need them."

[0:50 to 1:40] CLICK PT-003
"Let me show you why this matters. PT-003, Berlin site. AI classified this patient as PD, progressive disease. That is a serious call. It means the patient is not responding to treatment."

"Look at the flags. AI confidence is 43%, far below the 75% threshold. The PD call is being driven by a new lesion the AI is not sure about. And there is a CT co-registration artifact from the scan."

"Without a QA layer this goes straight to a radiologist as a PD call. They might accept it. The patient gets pulled from the trial. Potentially wrong."

"With this tool it is automatically escalated with full context."

[1:40 to 2:20] GENERATE AI SUMMARY
"Now I will hit Generate AI Summary. This calls Claude live and writes a plain-language brief for the radiologist."

Wait for it to generate and show it on screen.

"The radiologist is not reading raw numbers. They get a one paragraph brief telling them exactly what to look at and what action is needed."

[2:20 to 2:45] AUDIT TRAIL
"Every flag, every review decision, every radiologist override is logged with a timestamp. That is your FDA audit trail. This is the controls and procedures monitoring AI use that the 10-K says Medpace needs."

[2:45 to 3:00] CLOSE
"I am Jafar, MS in AI from UC, based in Cincinnati, 2 years production experience with LLMs and agentic systems. I just applied to the AI Specialist role. GitHub and live demo links are in the email. Would love 15 minutes with your team."

---

## 4. RESUME BULLET

RECIST QA Platform | FastAPI, React, Claude API, Python
Built AI validation layer addressing Medpace FY2025 10-K risk of insufficient human oversight of AI in clinical imaging. Implemented 6 automated QA rules covering confidence thresholding, new lesion safety checks, and trajectory anomaly detection on RECIST 1.1 oncology measurements. Integrated Claude API to generate plain-language radiologist briefs with full audit trail for FDA inspection readiness.

---

## 5. FOLLOW UP EMAIL (send after 7 days with no reply)

Subject: Re: Built something for Medpace's AI oversight gap

Hi Mehdi,

Just following up on my note from last week. Keeping it short. Here is the 3 minute Loom if you have not had a chance:

INSERT LOOM LINK HERE

The core idea: your 10-K flags insufficient AI oversight as a risk. This tool is the oversight layer.

Happy to show a live demo any time that works for you.

Jafar
