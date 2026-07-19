'use client'
import { useMemo } from 'react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'
import { TrendingUp } from 'lucide-react'

const MONTHS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

function fmtPeriodo(p) {
  const [, m] = (p || '').split('-')
  return MONTHS[parseInt(m) - 1] || p
}

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload) return null
  return (
    <div style={{ background: 'var(--card-bg)', border: '1px solid var(--borde)', borderRadius: 8, padding: '10px 14px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13 }}>
      <div style={{ fontWeight: 700, marginBottom: 6, color: 'var(--texto)' }}>{fmtPeriodo(label)}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.color, marginBottom: 2, display: 'flex', justifyContent: 'space-between', gap: 16 }}>
          <span>{p.name}:</span>
          <span style={{ fontWeight: 700 }}>C$ {Number(p.value).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</span>
        </div>
      ))}
    </div>
  )
}

export default function GraficoFlujoCaja({ data = [], gananciaMesActual = 0 }) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return []
    let acum = 0
    return data.map(d => {
      const ventas = d.ventas || 0
      const gastos = d.gastos || 0
      const costo = d.costo || 0
      const neto = ventas - costo - gastos
      acum += neto
      return {
        mes: d.periodo || d.mes,
        Ventas: ventas,
        Gastos: gastos,
        'Ganancia Neta': Math.round(acum * 100) / 100,
      }
    })
  }, [data])

  if (chartData.length === 0) {
    return (
      <div className="card" style={{ padding: 24, textAlign: 'center', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--texto-secundario)' }}>Sin datos de flujo de efectivo</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap', gap: 8 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <TrendingUp size={20} color="var(--verde)" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--texto)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
            Estado de Flujo de Efectivo
          </h3>
        </div>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: 11, color: 'var(--texto-secundario)', textTransform: 'uppercase', letterSpacing: 1 }}>Ganancia del mes actual</div>
          <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--verde)' }}>C$ {Number(gananciaMesActual).toLocaleString('es-NI', { minimumFractionDigits: 2 })}</div>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={chartData} margin={{ top: 4, right: 4, left: -8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--borde)" />
            <XAxis dataKey="mes" tickFormatter={fmtPeriodo} tick={{ fontSize: 11, fill: 'var(--texto-secundario)' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: 'var(--texto-secundario)' }} axisLine={false} tickLine={false}
              tickFormatter={v => v >= 1000 ? `C$${(v / 1000).toFixed(0)}k` : `C$${v}`} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
              formatter={value => <span style={{ color: 'var(--texto-secundario)' }}>{value}</span>} />
            <Bar dataKey="Ventas" fill="var(--verde)" radius={[4, 4, 0, 0]} maxBarSize={28} name="Ventas" />
            <Bar dataKey="Gastos" fill="var(--rojo)" radius={[4, 4, 0, 0]} maxBarSize={28} name="Gastos" />
            <Line type="monotone" dataKey="Ganancia Neta" stroke="#2563eb" strokeWidth={2} dot={{ r: 3, fill: '#2563eb' }} name="Ganancia Neta" />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}
