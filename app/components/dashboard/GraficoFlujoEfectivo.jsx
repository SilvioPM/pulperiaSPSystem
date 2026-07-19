'use client'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

function fmtMonth(m) {
  const meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']
  const [, mes] = (m || '').split('-')
  return meses[parseInt(mes) - 1] || m
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null
  return (
    <div style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: '#1e293b' }}>{fmtMonth(label)}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2 }}>
          {p.name}: C$ {Number(p.value).toLocaleString('es-NI', { minimumFractionDigits: 2 })}
        </div>
      ))}
    </div>
  )
}

export default function GraficoFlujoEfectivo({ data = [] }) {
  if (!data || data.length === 0) {
    return (
      <div className="card" style={{ padding: 20, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: '#94a3b8' }}>Sin datos de flujo de efectivo</div>
      </div>
    )
  }

  const chartData = data.map(d => ({
    mes: d.periodo || d.mes,
    Ventas: d.ventas || d.total || 0,
    Gastos: d.gastos || 0,
  }))

  return (
    <div className="card" style={{ padding: 20, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <TrendingUp size={20} color="#16a34a" />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
          Flujo de Efectivo (12 meses)
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={chartData} margin={{ top: 4, right: 8, left: 0, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
          <XAxis dataKey="mes" tickFormatter={fmtMonth} tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} tickFormatter={v => `C$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
          <Tooltip content={<CustomTooltip />} />
          <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
            formatter={value => <span style={{ color: '#64748b' }}>{value}</span>} />
          <Bar dataKey="Ventas" fill="#16a34a" radius={[4, 4, 0, 0]} maxBarSize={32} name="Ventas" />
          <Bar dataKey="Gastos" fill="#dc2626" radius={[4, 4, 0, 0]} maxBarSize={32} name="Gastos" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}
