import { useState, useEffect } from 'react'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      padding: '0 40px',
      height: 60,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: scrolled ? 'rgba(8,12,18,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'all 0.3s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div style={{
          width: 28, height: 28,
          background: 'var(--teal-faint)',
          border: '1px solid var(--border-accent)',
          borderRadius: 7,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, color: 'var(--teal)',
        }}>⬡</div>
        <span style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
          RECIST QA
        </span>
        <span style={{
          fontSize: 9, fontFamily: 'var(--font-mono)', color: 'var(--teal)',
          background: 'var(--teal-faint)', border: '1px solid var(--border-accent)',
          padding: '2px 7px', borderRadius: 3, letterSpacing: '0.08em',
        }}>v2.0</span>
      </div>

      <div style={{ display: 'flex', gap: 28 }}>
        {['Problem', 'Solution', 'Demo'].map(l => (
          <a key={l} href={`#${l.toLowerCase()}`} style={{
            fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            color: 'var(--text-tertiary)', textDecoration: 'none',
            transition: 'color 0.2s',
          }}
            onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
            onMouseLeave={e => e.currentTarget.style.color = 'var(--text-tertiary)'}
          >{l.toUpperCase()}</a>
        ))}
      </div>

      <div style={{
        fontSize: 11, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
        color: 'var(--text-tertiary)',
        display: 'flex', alignItems: 'center', gap: 6,
      }}>
        <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--teal)', display: 'inline-block', animation: 'pulse-dot 2s infinite' }} />
        MEDPACE DEMO
      </div>
    </nav>
  )
}
