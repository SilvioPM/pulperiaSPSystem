'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { CreditCard } from 'lucide-react'

const COLORS = {
  efectivo: '#16a34a',
  tarjeta: '#2563eb',
  transferencia: '#7c3aed',
  credito: '#d97706',
  dolares: '#0d9488',
}

const LABELS = {
  efectivo: 'Efectivo C$',
  tarjeta: 'Tarjeta',
  transferencia: 'Transferencia',
  credito: 'Crédito',
  dolares: 'Efectivo $',
}

function CustomTooltipPie({ active, payload }) {
  if (!active || !payload) return null
  const d = payload[0]
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--borde)', borderRadius: 8, padding: '8px 12px', fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: 'var(--texto)' }}>{d.name}</div>
      <div style={{ color: d.payload.color }}>C$ {Number(d.value).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</div>
    </div>
  )
}

function renderLegend({ payload }) {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 14px', justifyContent: 'center', fontSize: 12, marginTop: 8 }}>
      {payload.map((e, i) => (
        <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 10, height: 10, borderRadius: 2, background: e.color }} />
          <span style={{ color: 'var(--texto-secundario)' }}>{e.value}</span>
        </div>
      ))}
    </div>
  )
}

export default function PieMetodosPago({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ padding: 20, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <CreditCard size={24} color="var(--texto-secundario)" />
        <div style={{ fontSize: 13, color: 'var(--texto-secundario)', marginTop: 8 }}>Sin datos de métodos de pago</div>
      </div>
    )
  }

  const pieData = data.filter(d => d.total > 0)

  return (
    <div className="card" style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--texto)', textTransform: 'uppercase', letterSpacing: 1, margin: 0, marginBottom: 12 }}>
        Métodos de Pago
      </h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="total" nameKey="metodo" cx="50%" cy="50%" innerRadius={45} outerRadius={80}
              paddingAngle={3} stroke="none">
              {pieData.map((e, i) => (
                <Cell key={i} fill={COLORS[e.metodo] || '#64748b'} />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltipPie />} />
            <Legend content={renderLegend} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
