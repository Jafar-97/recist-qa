import { useEffect, useRef, useState } from 'react'

const BACKEND = import.meta.env.VITE_BACKEND_URL || ''

const PATIENTS = [
  { id: 'PT-003', tp: 'C3D1', resp: 'PD', conf: 62, status: 'flagged', flags: ['Low confidence', 'Lesion count mismatch'], prior: { resp: 'SD', conf: 88 } },
  { id: 'PT-011', tp: 'C2D1', resp: 'SD', conf: 78, status: 'review', flags: ['Boundary case'], prior: { resp: 'PR', conf: 91 } },
  { id: 'PT-007', tp: 'C4D1', resp: 'PR', conf: 94, status: 'passed', flags: [], prior: { resp: 'SD', conf: 89 } },
  { id: 'PT-019', tp: 'C2D1', resp: 'PD', conf: 55, status: 'flagged', flags: ['Low confidence', 'Trajectory anomaly'], prior: { resp: 'SD', conf: 82 } },
  { id: 'PT-024', tp: 'C1D1', resp: 'SD', conf: 91, status: 'passed', flags: [], prior: { resp: null, conf: null } },
]

const QA_FLAGS = [
  { sev: 'high', color: 'var(--red)', faint: 'var(--red-faint)', pid: 'PT-003', rule: 'Lesion count mismatch', desc: 'AI detected 3 target lesions vs 5 at baseline. Unexpected disappearance without CR classification assigned. Requires radiologist verification of lesion tracking continuity.' },
  { sev: 'high', color: 'var(--red)', faint: 'var(--red-faint)', pid: 'PT-019', rule: 'Trajectory anomaly', desc: 'Tumor burden increased 47% from prior timepoint. Exceeds expected range for single cycle. AI confidence 55%. Possible image registration error or artifact.' },
  { sev: 'medium', color: 'var(--amber)', faint: 'var(--amber-faint)', pid: 'PT-011', rule: 'Response boundary case', desc: 'SD classification with SLD change of -28.9%. Within 1.1mm of PR threshold. Borderline measurement warrants secondary read to confirm classification.' },
  { sev: 'low', color: 'var(--blue)', faint: 'var(--blue-faint)', pid: 'PT-003', rule: 'Low AI confidence', desc: 'AI confidence 62%, below 85% threshold. May indicate image quality issue or anatomical ambiguity. Flagged for confirmation, not necessarily incorrect.' },
]

const AUDIT = [
  { time: '09:14:02', actor: 'System', type: 'system', action: 'PT-003 C3D1 submitted for QA validation. AI response: PD, confidence 62%' },
  { time: '09:14:04', actor: 'QA Engine', type: 'ai', action: 'Rule violations detected: low confidence, lesion count mismatch. Status set to FLAGGED' },
  { time: '09:14:05', actor: 'Claude API', type: 'ai', action: 'Radiologist brief generated for PT-003. 3 anomalies summarized.' },
  { time: '09:31:17', actor: 'Dr. Williams', type: 'human', action: 'Reviewed PT-003. Confirmed lesion tracking error. Corrected lesion count to 5. Override applied.' },
  { time: '09:31:22', actor: 'Dr. Williams', type: 'human', action: 'PT-003 response reclassified SD. Signed and approved. Case closed.' },
  { time: '09:42:11', actor: 'System', type: 'system', action: 'PT-011 C2D1 submitted. AI response: SD, confidence 78%' },
  { time: '09:42:12', actor: 'QA Engine', type: 'ai', action: 'Boundary case detected. SLD change -28.9%, within 1.1mm of PR threshold. Status set to REVIEW' },
  { time: '10:05:44', actor: 'Dr. Patel', type: 'human', action: 'PT-011 secondary read initiated. Pending confirmation.' },
]

const confColor = c => c >= 85 ? 'var(--green)' : c >= 70 ? 'var(--amber)' : 'var(--red)'
const statusColor = s => ({ flagged: 'var(--red)', review: 'var(--amber)', passed: 'var(--green)' }[s])
const statusBg = s => ({ flagged: 'var(--red-faint)', review: 'var(--amber-faint)', passed: 'var(--green-faint)' }[s])
const actorColor = t => ({ ai: 'var(--teal)', human: 'var(--blue)', system: 'var(--text-tertiary)' }[t])

export default function Dashboard() {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  const [tab, setTab] = useState('queue')
  const [filter, setFilter] = useState('all')
  const [expanded, setExpanded] = useState(null)
  const [briefs, setBriefs] = useState({})
  const [loading, setLoading] = useState({})

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setVisible(true) }, { threshold: 0.1 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])

  const generateBrief = async (pid, e) => {
    e.stopPropagation()
    if (briefs[pid]) { setExpanded(pid); return }
    setLoading(l => ({ ...l, [pid]: true }))
    setExpanded(pid)

    const patient = PATIENTS.find(p => p.id === pid)
    const prompt = `You are a clinical AI system at Medpace Core Lab. Generate a concise radiologist brief for this flagged RECIST 1.1 case.

Patient: ${pid}, Timepoint: ${patient.tp}
AI Response Classification: ${patient.resp}
AI Confidence: ${patient.conf}%
Active QA Flags: ${patient.flags.join(', ')}
Prior timepoint response: ${patient.prior.resp || 'N/A'}, confidence: ${patient.prior.conf ? patient.prior.conf + '%' : 'N/A'}

Write 3-4 sentences. State what the AI flagged, why it matters, and what the radiologist should specifically verify. Be direct and clinical. No bullet points.`

    try {
      const res = await fetch(`${BACKEND}/api/brief`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ patient_id: pid, prompt }),
      })
      const data = await res.json()
      setBriefs(b => ({ ...b, [pid]: data.brief || 'Unable to generate brief. Please review manually.' }))
    } catch {
      setBriefs(b => ({ ...b, [pid]: `AI flagged ${patient.flags.join(' and ')} for ${pid}. Confidence at ${patient.conf}% is below threshold. Please verify measurement accuracy and lesion continuity against prior timepoint before confirming ${patient.resp} classification.` }))
    }
    setLoading(l => ({ ...l, [pid]: false }))
  }

  const filtered = filter === 'all' ? PATIENTS : PATIENTS.filter(p => p.status === filter)

  const TABS = ['queue', 'flags', 'audit']
  const FILTERS = ['all', 'flagged', 'review', 'passed']

  return (
    <section ref={ref} style={{ padding: '100px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>

        <div style={{
          marginBottom: 48,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', letterSpacing: '0.12em', marginBottom: 12 }}>LIVE DEMO</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            See it working
          </h2>
        </div>

        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 32,
          opacity: visible ? 1 : 0, transition: 'all 0.6s ease 0.1s',
        }}>
          {[
            { val: '24', label: 'Cases today', sub: '8 flagged' },
            { val: '87%', label: 'Avg confidence', sub: 'Target 85%+' },
            { val: '4.2%', label: 'Override rate', sub: 'Last 30 days' },
            { val: '5', label: 'Pending review', sub: '2 high priority' },
          ].map((s, i) => (
            <div key={i} style={{
              background: 'var(--bg-2)', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)', padding: '18px 20px',
            }}>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)', marginBottom: 8 }}>{s.label.toUpperCase()}</div>
              <div style={{ fontSize: 28, fontWeight: 600, color: 'var(--teal)', fontFamily: 'var(--font-mono)', lineHeight: 1 }}>{s.val}</div>
              <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4 }}>{s.sub}</div>
            </div>
          ))}
        </div>

        <div style={{
          background: 'var(--bg-1)', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', overflow: 'hidden',
          opacity: visible ? 1 : 0, transition: 'all 0.6s ease 0.15s',
        }}>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '16px 24px', borderBottom: '1px solid var(--border)',
            background: 'var(--bg-2)',
          }}>
            <div style={{ display: 'flex', gap: 2 }}>
              {TABS.map(t => (
                <button key={t} onClick={() => setTab(t)} style={{
                  padding: '7px 16px', fontSize: 12, fontFamily: 'var(--font-mono)',
                  letterSpacing: '0.06em', textTransform: 'uppercase',
                  border: 'none', cursor: 'pointer', borderRadius: 6,
                  background: tab === t ? 'var(--bg-4)' : 'transparent',
                  color: tab === t ? 'var(--text-primary)' : 'var(--text-tertiary)',
                  transition: 'all 0.2s',
                }}>
                  {t === 'queue' ? 'Patient Queue' : t === 'flags' ? 'QA Flags' : 'Audit Trail'}
                </button>
              ))}
            </div>
            {tab === 'queue' && (
              <div style={{ display: 'flex', gap: 6 }}>
                {FILTERS.map(f => (
                  <button key={f} onClick={() => setFilter(f)} style={{
                    padding: '5px 12px', fontSize: 11, fontFamily: 'var(--font-mono)',
                    textTransform: 'uppercase', letterSpacing: '0.06em',
                    border: `1px solid ${filter === f ? 'var(--teal)' : 'var(--border)'}`,
                    borderRadius: 20, cursor: 'pointer',
                    background: filter === f ? 'var(--teal-faint)' : 'transparent',
                    color: filter === f ? 'var(--teal)' : 'var(--text-tertiary)',
                    transition: 'all 0.2s',
                  }}>{f}</button>
                ))}
              </div>
            )}
          </div>

          {tab === 'queue' && (
            <div>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Patient ID', 'Timepoint', 'Response', 'Confidence', 'Status', 'Action'].map(h => (
                      <th key={h} style={{
                        padding: '10px 20px', textAlign: 'left',
                        fontSize: 10, fontFamily: 'var(--font-mono)',
                        letterSpacing: '0.1em', textTransform: 'uppercase',
                        color: 'var(--text-tertiary)', fontWeight: 400,
                      }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(p => (
                    <>
                      <tr key={p.id}
                        onClick={() => setExpanded(expanded === p.id ? null : p.id)}
                        style={{
                          borderBottom: expanded === p.id ? 'none' : '1px solid var(--border)',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      >
                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>{p.id}</td>
                        <td style={{ padding: '14px 20px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-secondary)' }}>{p.tp}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontSize: 11, fontFamily: 'var(--font-mono)', fontWeight: 700,
                            padding: '4px 10px', borderRadius: 4,
                            background: 'var(--blue-faint)', color: 'var(--blue)',
                            border: '1px solid rgba(59,130,246,0.3)',
                          }}>{p.resp}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div style={{ width: 60, height: 3, background: 'var(--bg-4)', borderRadius: 2, overflow: 'hidden' }}>
                              <div style={{ width: `${p.conf}%`, height: '100%', background: confColor(p.conf), borderRadius: 2, transition: 'width 1s ease' }} />
                            </div>
                            <span style={{ fontSize: 12, fontFamily: 'var(--font-mono)', color: confColor(p.conf) }}>{p.conf}%</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <span style={{
                            fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.08em',
                            textTransform: 'uppercase', fontWeight: 600,
                            padding: '4px 10px', borderRadius: 4,
                            background: statusBg(p.status), color: statusColor(p.status),
                            border: `1px solid ${statusColor(p.status)}`,
                            opacity: 0.9,
                          }}>{p.status}</span>
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          {p.status !== 'passed' ? (
                            <button onClick={(e) => generateBrief(p.id, e)} style={{
                              fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                              background: briefs[p.id] ? 'var(--teal-faint)' : 'var(--bg-3)',
                              border: `1px solid ${briefs[p.id] ? 'var(--border-accent)' : 'var(--border)'}`,
                              color: briefs[p.id] ? 'var(--teal)' : 'var(--text-secondary)',
                              transition: 'all 0.2s',
                            }}>
                              {loading[p.id] ? 'Generating...' : briefs[p.id] ? 'View brief' : 'AI brief ↗'}
                            </button>
                          ) : (
                            <button style={{
                              fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
                              padding: '6px 14px', borderRadius: 6, cursor: 'pointer',
                              background: 'transparent', border: '1px solid var(--border)',
                              color: 'var(--text-tertiary)',
                            }}>View report</button>
                          )}
                        </td>
                      </tr>
                      {expanded === p.id && briefs[p.id] && (
                        <tr key={`${p.id}-detail`}>
                          <td colSpan={6} style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{
                              background: 'var(--bg-3)', border: '1px solid var(--border-accent)',
                              borderLeft: '3px solid var(--teal)',
                              borderRadius: '0 8px 8px 8px', padding: '14px 18px',
                            }}>
                              <div style={{ fontSize: 10, fontFamily: 'var(--font-mono)', color: 'var(--teal)', letterSpacing: '0.1em', marginBottom: 8 }}>
                                ◈ AI RADIOLOGIST BRIEF
                              </div>
                              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>
                                {briefs[p.id]}
                              </p>
                            </div>
                          </td>
                        </tr>
                      )}
                      {expanded === p.id && loading[p.id] && (
                        <tr key={`${p.id}-loading`}>
                          <td colSpan={6} style={{ padding: '0 20px 16px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{
                              background: 'var(--bg-3)', border: '1px solid var(--border)',
                              borderLeft: '3px solid var(--teal)', borderRadius: '0 8px 8px 8px',
                              padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 10,
                            }}>
                              <div style={{
                                width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)',
                                animation: 'pulse-dot 1s ease-in-out infinite',
                              }} />
                              <span style={{ fontSize: 12, color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                                Generating radiologist brief...
                              </span>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'flags' && (
            <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              {QA_FLAGS.map((f, i) => (
                <div key={i} style={{
                  background: 'var(--bg)', border: `1px solid var(--border)`,
                  borderLeft: `3px solid ${f.color}`,
                  borderRadius: '0 var(--radius-md) var(--radius-md) 0',
                  padding: '16px 20px', display: 'flex', gap: 16, alignItems: 'flex-start',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: 8, flexShrink: 0,
                    background: f.faint, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, color: f.color,
                  }}>
                    {f.sev === 'high' ? '▲' : f.sev === 'medium' ? '◉' : '◎'}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                      <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-primary)' }}>{f.rule}</span>
                      <span style={{
                        fontSize: 9, fontFamily: 'var(--font-mono)', letterSpacing: '0.1em',
                        padding: '2px 8px', borderRadius: 3, fontWeight: 700,
                        background: f.faint, color: f.color, border: `1px solid ${f.color}`,
                      }}>{f.sev.toUpperCase()}</span>
                      <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)' }}>{f.pid}</span>
                    </div>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{f.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'audit' && (
            <div style={{ padding: '4px 0' }}>
              {AUDIT.map((a, i) => (
                <div key={i} style={{
                  display: 'flex', gap: 16, alignItems: 'flex-start',
                  padding: '12px 24px', borderBottom: i < AUDIT.length - 1 ? '1px solid var(--border)' : 'none',
                  transition: 'background 0.15s',
                }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-2)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: actorColor(a.type), marginTop: 6, flexShrink: 0 }} />
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', minWidth: 64, marginTop: 2 }}>{a.time}</span>
                  <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: actorColor(a.type), minWidth: 80, marginTop: 2, fontWeight: 700 }}>{a.actor}</span>
                  <span style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.5 }}>{a.action}</span>
                </div>
              ))}
              <div style={{ padding: '12px 24px', fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.05em' }}>
                ALL ENTRIES IMMUTABLE · EXPORTABLE AS PDF FOR FDA INSPECTION
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
