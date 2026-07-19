'use client'

export default function ListaProductos({ titulo, icon: Icon, color, gradient, data = [], dataKey = 'cantidad', format = 'number', max = 5 }) {
  const items = data.slice(0, max)
  if (items.length === 0) {
    return (
      <div className="card" style={{ padding: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          {Icon && <Icon size={18} color={color} />}
          <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--texto)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{titulo}</h4>
        </div>
        <div style={{ fontSize: 12, color: 'var(--texto-secundario)', textAlign: 'center', padding: '8px 0' }}>Sin datos</div>
      </div>
    )
  }

  const maxVal = Math.max(...items.map(p => Math.abs(p[dataKey] || 0)), 1)

  const fmt = (v) => {
    if (format === 'money') return 'C$ ' + Number(v).toFixed(2)
    return Number(v).toLocaleString('es-NI') + ' uds'
  }

  return (
    <div className="card" style={{ padding: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
        {Icon && <Icon size={18} color={color} />}
        <h4 style={{ fontSize: 13, fontWeight: 700, color: 'var(--texto)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>{titulo}</h4>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {items.map((p, i) => {
          const val = p[dataKey] || 0
          return (
            <div key={i}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 3 }}>
                <span style={{ fontWeight: 600, color: 'var(--texto)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{p.nombre}</span>
                <span style={{ fontWeight: 700, color, flexShrink: 0, marginLeft: 8 }}>{fmt(val)}</span>
              </div>
              <div style={{ height: 6, background: 'var(--hover)', borderRadius: 4, overflow: 'hidden' }}>
                <div style={{
                  height: '100%', width: `${(Math.abs(val) / maxVal) * 100}%`,
                  background: gradient || color, borderRadius: 4, transition: 'width 0.5s',
                }} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
