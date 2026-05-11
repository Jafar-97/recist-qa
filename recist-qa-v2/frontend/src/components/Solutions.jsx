import { useEffect, useRef, useState } from 'react'

const solutions = [
  { icon: '⬡', title: '6 automated QA rules', desc: 'Catches low confidence, trajectory anomalies, lesion count mismatches, and response boundary cases before the radiologist sees anything.' },
  { icon: '◈', title: 'Claude API radiologist brief', desc: 'Generates a plain-language summary of every flagged case. Radiologist immediately knows exactly what to verify.' },
  { icon: '◉', title: 'Full audit trail', desc: 'Every AI flag, override, and sign-off is timestamped and immutably logged. Exportable PDF for FDA inspection.' },
  { icon: '◎', title: 'Human override UI', desc: 'Confirm, correct, or escalate with one click. Decision context captured inline, not scattered across systems.' },
  { icon: '△', title: 'Trajectory analysis', desc: 'Detects unexpected shifts in tumor burden across timepoints. Flags deviations beyond expected clinical ranges.' },
  { icon: '◇', title: 'Non-invasive overlay', desc: 'Sits on top of existing AI pipelines. Zero changes to ClinTrak or Medidata integrations required.' },
]

export default function Solutions() {
  const headRef = useRef(null)
  const [headVisible, setHeadVisible] = useState(false)
  const cardRefs = useRef([])
  const [cardVisible, setCardVisible] = useState([])

  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) setHeadVisible(true) }, { threshold: 0.3 })
    if (headRef.current) obs.observe(headRef.current)
    return () => obs.disconnect()
  }, [])

  useEffect(() => {
    const observers = cardRefs.current.map((el, i) => {
      if (!el) return null
      const obs = new IntersectionObserver(([e]) => {
        if (e.isIntersecting) setCardVisible(prev => { const n = [...prev]; n[i] = true; return n })
      }, { threshold: 0.1 })
      obs.observe(el)
      return obs
    })
    return () => observers.forEach(o => o?.disconnect())
  }, [])

  return (
    <section style={{ padding: '100px 0', borderBottom: '1px solid var(--border)', background: 'var(--bg-1)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 40px' }}>
        <div ref={headRef} style={{
          marginBottom: 56,
          opacity: headVisible ? 1 : 0,
          transform: headVisible ? 'translateY(0)' : 'translateY(20px)',
          transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <div style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--teal)', letterSpacing: '0.12em', marginBottom: 12 }}>THE SOLUTION</div>
          <h2 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 300, letterSpacing: '-0.02em', lineHeight: 1.1 }}>
            A validation layer that sits
            <br />
            <span style={{ color: 'var(--text-tertiary)' }}>between AI output and human review</span>
          </h2>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 1, border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          {solutions.map((s, i) => (
            <div key={i} ref={el => cardRefs.current[i] = el}
              style={{
                padding: '28px 28px',
                background: 'var(--bg)',
                borderRight: i % 3 !== 2 ? '1px solid var(--border)' : 'none',
                borderBottom: i < 3 ? '1px solid var(--border)' : 'none',
                opacity: cardVisible[i] ? 1 : 0,
                transform: cardVisible[i] ? 'translateY(0)' : 'translateY(20px)',
                transition: `all 0.55s cubic-bezier(0.16,1,0.3,1) ${i * 0.07}s`,
                position: 'relative',
                overflow: 'hidden',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--bg-2)' }}
              onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)' }}
            >
              <div style={{
                width: 38, height: 38,
                background: 'var(--teal-faint)',
                border: '1px solid var(--border-accent)',
                borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 16, color: 'var(--teal)',
                marginBottom: 16,
                transition: 'all 0.2s',
              }}>{s.icon}</div>
              <h3 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-primary)', marginBottom: 8, lineHeight: 1.3 }}>{s.title}</h3>
              <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.65 }}>{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
