'use client'

export default function TarjetaKPI({ label, valor, icon: Icon, color, bg, formato = 'money' }) {
  const fmt = (v) => {
    if (v == null || isNaN(v)) return '0'
    if (formato === 'money') return 'C$ ' + Number(v).toLocaleString('es-NI', { minimumFractionDigits: 2 })
    if (formato === 'count') return Number(v).toLocaleString('es-NI')
    return String(v)
  }

  return (
    <div style={{
      borderRadius: 14, padding: 20, background: bg || 'white',
      border: `1px solid var(--borde)`, display: 'flex', alignItems: 'center', gap: 16,
      transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.08)' }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = 'none' }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: bg ? 'rgba(255,255,255,0.25)' : `${color}15`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
      }}>
        {Icon && <Icon size={24} color={color} />}
      </div>
      <div style={{ minWidth: 0 }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--texto-secundario)', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--texto)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{fmt(valor)}</div>
      </div>
    </div>
  )
}
