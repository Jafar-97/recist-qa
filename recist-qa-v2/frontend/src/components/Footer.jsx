export default function Footer() {
  return (
    <footer style={{
      padding: '40px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      maxWidth: 1100,
      margin: '0 auto',
    }}>
      <div>
        <div style={{ fontSize: 13, fontFamily: 'var(--font-mono)', color: 'var(--text-tertiary)', letterSpacing: '0.06em' }}>
          BUILT BY JAFAR
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-tertiary)', marginTop: 4, opacity: 0.6 }}>
          Demo for Medpace Core Lab · 2026
        </div>
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        {['FastAPI', 'React', 'Claude API'].map(t => (
          <span key={t} style={{
            fontSize: 10, fontFamily: 'var(--font-mono)', letterSpacing: '0.06em',
            padding: '4px 10px', borderRadius: 4,
            background: 'var(--bg-2)', border: '1px solid var(--border)',
            color: 'var(--text-tertiary)',
          }}>{t}</span>
        ))}
      </div>
    </footer>
  )
}
