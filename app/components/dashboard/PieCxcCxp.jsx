'use client'
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from 'recharts'
import { DollarSign } from 'lucide-react'

const COLORS = { cxc: '#d97706', cxp: '#dc2626' }

function CustomTooltipPie({ active, payload }) {
  if (!active || !payload) return null
  const d = payload[0]
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--borde)', borderRadius: 8, padding: '8px 12px', fontSize: 13, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
      <div style={{ fontWeight: 700, color: 'var(--texto)' }}>{d.name}</div>
      <div style={{ color: d.payload.fill }}>C$ {Number(d.value).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</div>
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

export default function PieCxcCxp({ totalCXC = 0, totalCXP = 0 }) {
  const pieData = [
    { name: 'Por Cobrar (CxC)', value: totalCXC, fill: COLORS.cxc },
    { name: 'Por Pagar (CxP)', value: totalCXP, fill: COLORS.cxp },
  ].filter(d => d.value > 0)

  if (pieData.length === 0) {
    return (
      <div className="card" style={{ padding: 20, textAlign: 'center', height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <DollarSign size={24} color="var(--texto-secundario)" />
        <div style={{ fontSize: 13, color: 'var(--texto-secundario)', marginTop: 8 }}>Sin saldos pendientes</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--texto)', textTransform: 'uppercase', letterSpacing: 1, margin: 0, marginBottom: 12 }}>
        CxC vs CxP
      </h3>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={80}
              paddingAngle={3} stroke="none">
              {pieData.map((e, i) => (
                <Cell key={i} fill={e.fill} />
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
