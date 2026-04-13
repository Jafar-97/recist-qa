import { useState, useEffect } from "react";

const API = "http://localhost:8000";

const PATIENTS = [
  { id:"PT-001", site:"Cincinnati-01", timepoint:"Cycle 4 / Wk 12", aiResponse:"PR", sldBaseline:89, sldCurrent:57, aiConfidence:0.91, lesionCount:3, newLesionDetected:false, priorResponse:"PR", imageQualityFlag:null },
  { id:"PT-002", site:"London-03",     timepoint:"Cycle 4 / Wk 12", aiResponse:"SD", sldBaseline:72, sldCurrent:76, aiConfidence:0.61, lesionCount:2, newLesionDetected:false, priorResponse:"PR", imageQualityFlag:null },
  { id:"PT-003", site:"Berlin-02",     timepoint:"Cycle 4 / Wk 12", aiResponse:"PD", sldBaseline:66, sldCurrent:94, aiConfidence:0.43, lesionCount:4, newLesionDetected:true,  newLesionConfidence:0.43, priorResponse:"SD", imageQualityFlag:"co-registration" },
  { id:"PT-004", site:"Tokyo-01",      timepoint:"Cycle 4 / Wk 12", aiResponse:"CR", sldBaseline:55, sldCurrent:0,  aiConfidence:0.88, lesionCount:0, newLesionDetected:false, priorResponse:"PR", imageQualityFlag:null },
  { id:"PT-005", site:"Cincinnati-01", timepoint:"Cycle 4 / Wk 12", aiResponse:"PR", sldBaseline:91, sldCurrent:53, aiConfidence:0.94, lesionCount:3, newLesionDetected:false, priorResponse:"PR", imageQualityFlag:null },
  { id:"PT-006", site:"Paris-04",      timepoint:"Cycle 4 / Wk 12", aiResponse:"SD", sldBaseline:83, sldCurrent:85, aiConfidence:0.55, lesionCount:3, newLesionDetected:false, priorResponse:"PR", imageQualityFlag:null },
  { id:"PT-007", site:"Sydney-02",     timepoint:"Cycle 4 / Wk 12", aiResponse:"PR", sldBaseline:78, sldCurrent:60, aiConfidence:0.87, lesionCount:2, newLesionDetected:false, priorResponse:"PR", imageQualityFlag:null },
  { id:"PT-008", site:"Mumbai-01",     timepoint:"Cycle 4 / Wk 12", aiResponse:"PD", sldBaseline:62, sldCurrent:93, aiConfidence:0.49, lesionCount:3, newLesionDetected:true,  newLesionConfidence:0.49, priorResponse:"SD", imageQualityFlag:"late-upload" },
];

const RC = { CR:{bg:"#EAF3DE",text:"#1a6b3c"}, PR:{bg:"#e8f4fe",text:"#1565c0"}, SD:{bg:"#f1f3f5",text:"#495057"}, PD:{bg:"#fdf2f1",text:"#c0392b"} };
const RK = { escalate:{bg:"#fdf2f1",text:"#c0392b",label:"Escalate"}, review:{bg:"#fef3e2",text:"#b45309",label:"Review"}, cleared:{bg:"#edf7f1",text:"#1a6b3c",label:"Cleared"} };

function Badge({ text, bg, color }) {
  return <span style={{ background:bg, color, borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:600 }}>{text}</span>;
}

function ConfBar({ value }) {
  const color = value >= .8 ? "#1a6b3c" : value >= .6 ? "#b45309" : "#c0392b";
  return (
    <div style={{ display:"flex", alignItems:"center", gap:5 }}>
      <div style={{ width:55, height:4, background:"#dce3ed", borderRadius:2, overflow:"hidden" }}>
        <div style={{ width:`${Math.round(value*100)}%`, height:"100%", background:color }} />
      </div>
      <span style={{ fontSize:11, color:"#64748b" }}>{Math.round(value*100)}%</span>
    </div>
  );
}

export default function App() {
  const [results, setResults]   = useState({});
  const [sums, setSums]         = useState({});
  const [loading, setLoading]   = useState({});
  const [selected, setSelected] = useState(null);
  const [reviewed, setReviewed] = useState({});

  async function validateAll() {
    const out = {};
    for (const p of PATIENTS) {
      try {
        const res = await fetch(`${API}/qa/validate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patient_id: p.id, site: p.site, timepoint: p.timepoint,
            ai_response: p.aiResponse, sld_baseline_mm: p.sldBaseline,
            sld_current_mm: p.sldCurrent, ai_confidence: p.aiConfidence,
            lesion_count: p.lesionCount, new_lesion_detected: p.newLesionDetected,
            new_lesion_confidence: p.newLesionConfidence || null,
            prior_response: p.priorResponse || null,
            image_quality_flag: p.imageQualityFlag || null,
          })
        });
        out[p.id] = await res.json();
      } catch {
        out[p.id] = { overall_risk:"review", flags:[{ severity:"medium", title:"Backend not connected", description:"Start the backend with uvicorn main:app --reload", rule_id:"DEMO" }] };
      }
    }
    setResults(out);
  }

  async function generateSummary(patient) {
    setSums(s => ({ ...s, [patient.id]: null }));
    setLoading(l => ({ ...l, [patient.id]: true }));
    try {
      const res = await fetch(`${API}/qa/summarize`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_id: patient.id, site: patient.site, timepoint: patient.timepoint,
          ai_response: patient.aiResponse, sld_baseline_mm: patient.sldBaseline,
          sld_current_mm: patient.sldCurrent, ai_confidence: patient.aiConfidence,
          lesion_count: patient.lesionCount, new_lesion_detected: patient.newLesionDetected,
          new_lesion_confidence: patient.newLesionConfidence || null,
          prior_response: patient.priorResponse || null,
          image_quality_flag: patient.imageQualityFlag || null,
        })
      });
      const data = await res.json();
      setSums(s => ({ ...s, [patient.id]: data.summary || "No summary returned." }));
    } catch (e) {
      setSums(s => ({ ...s, [patient.id]: "Error connecting to backend: " + e.message }));
    }
    setLoading(l => ({ ...l, [patient.id]: false }));
  }

  async function markReviewed(patientId, action) {
    try {
      await fetch(`${API}/qa/review`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ patient_id: patientId, action })
      });
    } catch {}
    setReviewed(r => ({ ...r, [patientId]: action }));
  }

  useEffect(() => { validateAll(); }, []);

  const esc  = Object.values(results).filter(r => r.overall_risk === "escalate").length;
  const rev  = Object.values(results).filter(r => r.overall_risk === "review").length;
  const clr  = Object.values(results).filter(r => r.overall_risk === "cleared").length;
  const sel  = selected !== null ? PATIENTS[selected] : null;
  const selR = sel ? results[sel.id] : null;

  const N = { background:"#002855" };
  const T = { background:"#00857c" };

  return (
    <div style={{ background:"#f4f6f9", minHeight:"100vh", fontFamily:"system-ui, sans-serif" }}>

      {/* Nav */}
      <div style={{ ...N, padding:"10px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ ...T, width:26, height:26, borderRadius:4, display:"flex", alignItems:"center", justifyContent:"center" }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="white"><path d="M8 2a6 6 0 100 12A6 6 0 008 2zm0 1.5a4.5 4.5 0 110 9 4.5 4.5 0 010-9zm-.75 2.25v2.5H5.75a.75.75 0 000 1.5h1.5v2.5a.75.75 0 001.5 0v-2.5h1.5a.75.75 0 000-1.5H8.75v-2.5a.75.75 0 00-1.5 0z"/></svg>
          </div>
          <span style={{ color:"white", fontSize:14, fontWeight:600 }}>Medpace</span>
          <div style={{ width:1, height:16, background:"rgba(255,255,255,.2)", margin:"0 6px" }} />
          <span style={{ color:"rgba(255,255,255,.55)", fontSize:12 }}>RECIST QA Platform</span>
        </div>
        <div style={{ display:"flex", gap:8 }}>
          <span style={{ background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.7)", borderRadius:4, padding:"3px 9px", fontSize:11 }}>Core Lab</span>
          <span style={{ background:"rgba(255,255,255,.1)", color:"rgba(255,255,255,.7)", borderRadius:4, padding:"3px 9px", fontSize:11 }}>Oncology</span>
        </div>
      </div>

      <div style={{ padding:18 }}>

        {/* Problem and Solution */}
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:14 }}>
          <div style={{ background:"#fff8f7", border:"1px solid #f5c6c2", borderRadius:8, padding:"16px 18px" }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#c0392b", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#c0392b" }} />
              The Problem
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:"#002855", marginBottom:8, lineHeight:1.4 }}>Medpace publicly flagged insufficient AI oversight as a business risk</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.7 }}>
              While reviewing Medpace's publicly available annual report, the following was found in the FY2025 10-K filed with the SEC on February 10, 2026:
              <div style={{ background:"rgba(0,0,0,.04)", borderLeft:"3px solid #c0392b", padding:"8px 10px", margin:"10px 0", fontSize:12, color:"#7a2020", fontStyle:"italic", lineHeight:1.6 }}>
                "risks arising from insufficient human oversight of AI or a lack of controls and procedures monitoring the use of AI in day-to-day operations"
              </div>
              Medpace uses AI to automate RECIST 1.1 tumor measurements but has no structured QA layer between AI output and the reviewing radiologist.
              <br /><br />
              <a href="https://www.sec.gov/Archives/edgar/data/0001668397/000166839726000006/medp-20251231.htm" target="_blank" rel="noreferrer" style={{ color:"#00857c", fontWeight:500 }}>View source on SEC.gov (FY2025 10-K, February 2026)</a>
            </div>
          </div>

          <div style={{ background:"#e6f4f3", border:"1px solid #a8d5d1", borderRadius:8, padding:"16px 18px" }}>
            <div style={{ fontSize:10, fontWeight:700, textTransform:"uppercase", letterSpacing:".07em", color:"#005f5a", marginBottom:8, display:"flex", alignItems:"center", gap:6 }}>
              <div style={{ width:7, height:7, borderRadius:"50%", background:"#00857c" }} />
              The Solution
            </div>
            <div style={{ fontSize:14, fontWeight:600, color:"#002855", marginBottom:8, lineHeight:1.4 }}>RECIST QA: an AI oversight layer built specifically for this gap</div>
            <div style={{ fontSize:12, color:"#64748b", lineHeight:1.7 }}>
              This tool sits between the AI imaging system and the radiologist. Before any measurement reaches a human reviewer it runs six automated quality checks on every AI-generated RECIST 1.1 output.
              <div style={{ background:"rgba(0,133,124,.08)", borderLeft:"3px solid #00857c", padding:"8px 10px", margin:"10px 0", fontSize:12, color:"#005f5a", lineHeight:1.6 }}>
                Every patient gets checked. Only flagged cases escalate to the radiologist. Everything else is cleared with a full audit trail ready for FDA inspection.
              </div>
              The six checks cover confidence thresholding, new lesion safety, trajectory anomaly detection, SLD boundary analysis, image quality flags, and CR sanity checks.
            </div>
            <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
              {["FastAPI","React","6 QA rules","Audit trail"].map(t => (
                <span key={t} style={{ background:"rgba(0,133,124,.1)", color:"#005f5a", borderRadius:4, padding:"2px 8px", fontSize:11, fontWeight:500 }}>{t}</span>
              ))}
            </div>
          </div>
        </div>

        {/* Trial info */}
        <div style={{ background:"white", border:"1px solid #dce3ed", borderRadius:8, padding:"14px 18px", marginBottom:14 }}>
          <div style={{ fontSize:15, fontWeight:600, color:"#002855", marginBottom:3 }}>Trial MPX-ONC-2024-011 — NSCLC Phase III</div>
          <div style={{ fontSize:12, color:"#64748b" }}>Imaging endpoint review, Cycle 4 / Week 12, RECIST 1.1</div>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap", marginTop:10 }}>
            {[["Phase","III"],["Indication","NSCLC"],["Sites","14 global"],["Mode","AI + Radiologist"]].map(([k,v]) => (
              <div key={k} style={{ background:"#f4f6f9", border:"1px solid #dce3ed", borderRadius:20, padding:"3px 10px", fontSize:11, color:"#64748b" }}>{k} <b style={{ color:"#002855" }}>{v}</b></div>
            ))}
          </div>
        </div>

        {/* Stats */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
          {[["Total patients", PATIENTS.length, "#002855"],["Escalations", esc, "#c0392b"],["Needs review", rev, "#b45309"],["Cleared", clr, "#1a6b3c"]].map(([l,v,c]) => (
            <div key={l} style={{ background:"white", border:"1px solid #dce3ed", borderRadius:8, padding:"13px 15px" }}>
              <div style={{ fontSize:11, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", marginBottom:5 }}>{l}</div>
              <div style={{ fontSize:22, fontWeight:600, color:c }}>{v}</div>
            </div>
          ))}
        </div>

        {/* Table */}
        <div style={{ background:"white", border:"1px solid #dce3ed", borderRadius:8, overflow:"hidden", marginBottom:14 }}>
          <div style={{ ...N, padding:"9px 15px", fontSize:11, fontWeight:600, color:"rgba(255,255,255,.6)", textTransform:"uppercase", letterSpacing:".05em" }}>
            Patient queue — click a row to inspect
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", fontSize:13 }}>
            <thead>
              <tr>
                {["Patient ID","Site","AI response","SLD change","AI confidence","QA risk","Status"].map(h => (
                  <th key={h} style={{ textAlign:"left", padding:"8px 13px", fontSize:11, fontWeight:500, color:"#64748b", borderBottom:"1px solid #dce3ed", background:"#f4f6f9" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PATIENTS.map((p, i) => {
                const r = results[p.id];
                const risk = r ? RK[r.overall_risk] : null;
                const delta = p.sldCurrent === 0 ? "minus 100% (CR)" : (p.sldCurrent - p.sldBaseline > 0 ? "+" : "") + (p.sldCurrent - p.sldBaseline) + "mm";
                return (
                  <tr key={p.id} onClick={() => setSelected(selected === i ? null : i)}
                    style={{ cursor:"pointer", background: selected === i ? "#e8f0fa" : "transparent" }}>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid #f0f3f7", fontWeight:600, color:"#002855" }}>{p.id}</td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid #f0f3f7", color:"#64748b" }}>{p.site}</td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid #f0f3f7" }}><Badge text={p.aiResponse} bg={RC[p.aiResponse].bg} color={RC[p.aiResponse].text} /></td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid #f0f3f7" }}>{delta}</td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid #f0f3f7" }}><ConfBar value={p.aiConfidence} /></td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid #f0f3f7" }}>{risk ? <Badge text={risk.label} bg={risk.bg} color={risk.text} /> : <span style={{ color:"#ccc" }}>...</span>}</td>
                    <td style={{ padding:"9px 13px", borderBottom:"1px solid #f0f3f7", fontSize:12, color:"#64748b" }}>
                      {reviewed[p.id] ? "confirmed: " + reviewed[p.id] : (r ? RK[r.overall_risk].label : "...")}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Detail panel */}
        {sel && selR && (
          <div style={{ background:"white", border:"1px solid #dce3ed", borderRadius:8, overflow:"hidden", marginBottom:14 }}>
            <div style={{ ...N, padding:"11px 17px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
              <h3 style={{ fontSize:14, fontWeight:600, color:"white", margin:0 }}>{sel.id} QA Detail</h3>
              <span style={{ fontSize:11, color:"rgba(255,255,255,.5)" }}>{sel.site}</span>
            </div>
            <div style={{ padding:16 }}>

              {/* Metrics */}
              <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:10, marginBottom:14 }}>
                <div style={{ background:"#f4f6f9", borderRadius:6, padding:11, border:"1px solid #dce3ed" }}>
                  <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", marginBottom:5, fontWeight:500 }}>AI classification</div>
                  <div><Badge text={sel.aiResponse} bg={RC[sel.aiResponse].bg} color={RC[sel.aiResponse].text} /></div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:4 }}>RECIST 1.1</div>
                </div>
                <div style={{ background:"#f4f6f9", borderRadius:6, padding:11, border:"1px solid #dce3ed" }}>
                  <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", marginBottom:5, fontWeight:500 }}>SLD change</div>
                  <div style={{ fontSize:17, fontWeight:600, color:"#002855" }}>{sel.sldCurrent === 0 ? "minus 100%" : (sel.sldCurrent - sel.sldBaseline > 0 ? "+" : "") + (sel.sldCurrent - sel.sldBaseline) + "mm"}</div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{sel.sldBaseline}mm to {sel.sldCurrent}mm</div>
                </div>
                <div style={{ background:"#f4f6f9", borderRadius:6, padding:11, border:"1px solid #dce3ed" }}>
                  <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", marginBottom:5, fontWeight:500 }}>AI confidence</div>
                  <div style={{ fontSize:17, fontWeight:600, color: sel.aiConfidence >= .8 ? "#1a6b3c" : sel.aiConfidence >= .6 ? "#b45309" : "#c0392b" }}>{Math.round(sel.aiConfidence*100)}%</div>
                  <div style={{ fontSize:11, color:"#64748b", marginTop:2 }}>{sel.aiConfidence >= .75 ? "Above threshold" : "Below 75%, review required"}</div>
                </div>
                <div style={{ background:"#f4f6f9", borderRadius:6, padding:11, border:"1px solid #dce3ed" }}>
                  <div style={{ fontSize:10, color:"#64748b", textTransform:"uppercase", letterSpacing:".05em", marginBottom:5, fontWeight:500 }}>Flags raised</div>
                  <div style={{ fontSize:17, fontWeight:600, color: selR.flags.length ? "#c0392b" : "#1a6b3c" }}>{selR.flags.length}</div>
                  <div style={{ fontSize:11, marginTop:2 }}><Badge text={RK[selR.overall_risk].label} bg={RK[selR.overall_risk].bg} color={RK[selR.overall_risk].text} /></div>
                </div>
              </div>

              {/* Flags */}
              <div style={{ fontSize:11, fontWeight:600, color:"#002855", textTransform:"uppercase", letterSpacing:".05em", marginBottom:7 }}>QA flags</div>
              <div style={{ marginBottom:14 }}>
                {selR.flags.length === 0
                  ? <p style={{ color:"#64748b", fontSize:13, padding:"8px 0" }}>No flags raised. Cleared for routine radiologist sign-off.</p>
                  : selR.flags.map((f, i) => (
                    <div key={i} style={{ display:"flex", gap:9, padding:"9px 0", borderBottom: i < selR.flags.length - 1 ? "1px solid #f0f3f7" : "none", alignItems:"flex-start" }}>
                      <div style={{ width:25, height:25, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:11, fontWeight:700, flexShrink:0, background: f.severity === "high" ? "#fdf2f1" : "#fef3e2", color: f.severity === "high" ? "#c0392b" : "#b45309" }}>
                        {f.severity === "high" ? "!" : "~"}
                      </div>
                      <div>
                        <div style={{ fontSize:13, fontWeight:500, color:"#1a2636" }}>{f.title}</div>
                        <div style={{ fontSize:12, color:"#64748b", marginTop:2, lineHeight:1.5 }}>{f.description}</div>
                        <div style={{ fontSize:10, color:"#adb5bd", marginTop:2 }}>Rule: {f.rule_id}</div>
                      </div>
                    </div>
                  ))
                }
              </div>

              {/* Summary box */}
              <div style={{ background:"#e6f4f3", border:"1px solid #b2d8d6", borderRadius:6, padding:11, marginBottom:12 }}>
                <div style={{ fontSize:10, color:"#005f5a", textTransform:"uppercase", letterSpacing:".05em", fontWeight:600, marginBottom:5 }}>AI QA summary</div>
                <div style={{ fontSize:13, color:"#1a3a38", lineHeight:1.7 }}>
                  {sums[sel.id]
                    ? sums[sel.id]
                    : loading[sel.id]
                      ? "Generating..."
                      : "Click Generate AI summary for a plain-language radiologist brief."}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display:"flex", gap:8, flexWrap:"wrap" }}>
                <button
                  onClick={() => generateSummary(sel)}
                  disabled={loading[sel.id]}
                  style={{ fontSize:12, padding:"6px 13px", cursor:"pointer", borderRadius:5, border:"1px solid #dce3ed", background:"white", color:"#002855" }}>
                  {loading[sel.id] ? "Generating..." : "Generate AI summary"}
                </button>
                <button
                  onClick={() => markReviewed(sel.id, "confirmed")}
                  style={{ fontSize:12, padding:"6px 13px", cursor:"pointer", borderRadius:5, border:"none", background:"#002855", color:"white", fontWeight:500 }}>
                  Mark confirmed
                </button>
                <button
                  onClick={() => markReviewed(sel.id, "escalated")}
                  style={{ fontSize:12, padding:"6px 13px", cursor:"pointer", borderRadius:5, border:"1px solid #f5b8b3", background:"white", color:"#c0392b" }}>
                  Escalate
                </button>
                {reviewed[sel.id] && (
                  <span style={{ fontSize:12, color:"#1a6b3c", padding:"6px 0" }}>Logged to audit trail: {reviewed[sel.id]}</span>
                )}
              </div>

            </div>
          </div>
        )}

      </div>

      {/* Footer */}
      <div style={{ ...N, padding:"11px 20px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:9 }}>
          <div style={{ ...T, width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontSize:12, fontWeight:700, color:"white" }}>J</div>
          <span style={{ fontSize:13, color:"white", fontWeight:500 }}>Built by Jafar</span>
        </div>
        <div style={{ fontSize:11, color:"rgba(255,255,255,.4)" }}>Demo for Medpace, 2026</div>
      </div>

    </div>
  );
}
