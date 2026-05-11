import { useEffect, useRef, useState } from 'react'

export default function Hero() {
  const canvasRef = useRef(null)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    setTimeout(() => setVisible(true), 100)
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animId

    const resize = () => {
      canvas.width = canvas.offsetWidth
      canvas.height = canvas.offsetHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const particles = Array.from({ length: 60 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 0.3,
      vy: (Math.random() - 0.5) * 0.3,
      r: Math.random() * 1.5 + 0.5,
      a: Math.random() * 0.4 + 0.1,
    }))

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      particles.forEach(p => {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = canvas.width
        if (p.x > canvas.width) p.x = 0
        if (p.y < 0) p.y = canvas.height
        if (p.y > canvas.height) p.y = 0

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(0, 229, 195, ${p.a})`
        ctx.fill()
      })

      particles.forEach((p, i) => {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = p.x - particles[j].x
          const dy = p.y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 100) {
            ctx.beginPath()
            ctx.moveTo(p.x, p.y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `rgba(0, 229, 195, ${0.06 * (1 - dist / 100)})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      })
      animId = requestAnimationFrame(draw)
    }
    draw()
    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize) }
  }, [])

  return (
    <section style={{
      position: 'relative',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      overflow: 'hidden',
      borderBottom: '1px solid var(--border)',
    }}>
      <canvas ref={canvasRef} style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', opacity: 0.6
      }} />

      <div style={{
        position: 'absolute', inset: 0,
        background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,229,195,0.04) 0%, transparent 70%)',
        pointerEvents: 'none',
      }} />

      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)
        `,
        backgroundSize: '60px 60px',
        pointerEvents: 'none',
      }} />

      <div style={{ position: 'relative', zIndex: 2, maxWidth: 1100, margin: '0 auto', padding: '0 40px', width: '100%' }}>

        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,229,195,0.06)', border: '1px solid var(--border-accent)',
          borderRadius: 40, padding: '6px 14px',
          marginBottom: 32,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(16px)',
          transition: 'all 0.6s cubic-bezier(0.16,1,0.3,1)',
        }}>
          <span style={{
            width: 7, height: 7, borderRadius: '50%', background: 'var(--teal)',
            animation: 'pulse-dot 2s ease-in-out infinite',
            display: 'inline-block',
          }} />
          <span style={{ fontSize: 12, color: 'var(--teal)', fontFamily: 'var(--font-mono)', letterSpacing: '0.06em' }}>
            BUILT FOR MEDPACE CORE LAB
          </span>
        </div>

        <h1 style={{
          fontSize: 'clamp(42px, 7vw, 86px)',
          fontWeight: 300,
          lineHeight: 1.05,
          letterSpacing: '-0.03em',
          marginBottom: 12,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.1s',
        }}>
          RECIST QA
          <br />
          <span style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontWeight: 400,
            background: 'linear-gradient(135deg, var(--teal) 0%, #00b89c 50%, #7efff5 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}>Platform</span>
        </h1>

        <p style={{
          fontSize: 18,
          color: 'var(--text-secondary)',
          maxWidth: 520,
          lineHeight: 1.65,
          marginBottom: 48,
          fontWeight: 300,
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.2s',
        }}>
          AI measurement validation and oversight layer for RECIST 1.1 oncology endpoints.
          Catches errors before they reach the radiologist.
        </p>

        <div style={{
          display: 'flex', gap: 12, flexWrap: 'wrap',
          opacity: visible ? 1 : 0,
          transform: visible ? 'translateY(0)' : 'translateY(24px)',
          transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.3s',
        }}>
          {[
            { label: 'FastAPI + React', icon: '⬡' },
            { label: 'Claude API', icon: '◈' },
            { label: 'FDA Audit Trail', icon: '◉' },
            { label: 'Cincinnati, OH', icon: '◎' },
          ].map(tag => (
            <span key={tag.label} style={{
              display: 'inline-flex', alignItems: 'center', gap: 7,
              background: 'var(--bg-2)',
              border: '1px solid var(--border)',
              borderRadius: 6, padding: '7px 14px',
              fontSize: 13, color: 'var(--text-secondary)',
              fontFamily: 'var(--font-mono)',
            }}>
              <span style={{ color: 'var(--teal)', fontSize: 11 }}>{tag.icon}</span>
              {tag.label}
            </span>
          ))}
        </div>

        <div style={{
          display: 'flex', gap: 48, marginTop: 80,
          opacity: visible ? 1 : 0,
          transition: 'all 0.7s cubic-bezier(0.16,1,0.3,1) 0.45s',
        }}>
          {[
            { val: '40%', label: 'inter-reader variability without AI oversight' },
            { val: '6', label: 'automated QA rules per measurement' },
            { val: '100%', label: 'audit logged for FDA inspection' },
          ].map((s, i) => (
            <div key={i}>
              <div style={{
                fontSize: 'clamp(28px, 4vw, 44px)',
                fontWeight: 600,
                color: 'var(--teal)',
                fontFamily: 'var(--font-mono)',
                lineHeight: 1,
                marginBottom: 6,
              }}>{s.val}</div>
              <div style={{ fontSize: 12, color: 'var(--text-tertiary)', maxWidth: 120, lineHeight: 1.4 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      <div style={{
        position: 'absolute', bottom: 40, left: '50%', transform: 'translateX(-50%)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
        opacity: 0.4, animation: 'float 3s ease-in-out infinite',
      }}>
        <span style={{ fontSize: 11, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>SCROLL</span>
        <div style={{ width: 1, height: 40, background: 'linear-gradient(to bottom, var(--teal), transparent)' }} />
      </div>
    </section>
  )
}
