'use client'
import { TrendingUp, FileText, Users, DollarSign, CreditCard, Banknote } from 'lucide-react'

const CARD_HOVER = { transform: 'translateY(-3px)', boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }

const cards = [
  { label: 'Ventas hoy', gradient: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', color: '#16a34a', textColor: '#166534', icon: TrendingUp, key: 'ventasHoy', prefix: 'C$ ', format: 'money' },
  { label: 'Facturas hoy', gradient: 'linear-gradient(135deg, #dbeafe, #bfdbfe)', color: '#2563eb', textColor: '#1e3a8a', icon: FileText, key: 'facturasHoy', format: 'number' },
  { label: 'Clientes', gradient: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', color: '#7c3aed', textColor: '#4c1d95', icon: Users, key: 'clientes', format: 'number' },
  { label: 'Por cobrar (CxC)', gradient: 'linear-gradient(135deg, #fef3c7, #fde68a)', color: '#d97706', textColor: '#92400e', icon: DollarSign, key: 'totalCXC', prefix: 'C$ ', format: 'money' },
  { label: 'Por pagar (CxP)', gradient: 'linear-gradient(135deg, #fef2f2, #fee2e2)', color: '#dc2626', textColor: '#991b1b', icon: CreditCard, key: 'totalCXP', prefix: 'C$ ', format: 'money' },
  { label: 'Efectivo en caja', gradient: 'linear-gradient(135deg, #ccfbf1, #a7f3d0)', color: '#0d9488', textColor: '#115e59', icon: Banknote, key: 'efectivoCaja', prefix: 'C$ ', format: 'money' },
]

function formatVal(val, fmt) {
  if (val == null || isNaN(val)) return '0'
  if (fmt === 'money') return Number(val).toFixed(2)
  return Number(val).toLocaleString('es-NI')
}

export default function GridKPIs({ ventasHoy = 0, facturasHoy = 0, clientes = 0, totalCXC = 0, totalCXP = 0, efectivoCaja = 0, pctCambio = 0 }) {
  const valores = { ventasHoy, facturasHoy, clientes, totalCXC, totalCXP, efectivoCaja }
  const trend = pctCambio > 0 ? 'up' : pctCambio < 0 ? 'down' : null

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16, marginBottom: 32 }}>
      {cards.map(c => {
        const val = valores[c.key]
        const Icon = c.icon
        return (
          <div key={c.key} style={{
            borderRadius: 14, padding: 24, background: c.gradient,
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'default',
          }}
            onMouseEnter={e => Object.assign(e.currentTarget.style, CARD_HOVER)}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: c.textColor, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
                  {c.label}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: c.textColor, lineHeight: 1.2 }}>
                  {c.prefix || ''}{formatVal(val, c.format)}
                </div>
                {c.key === 'ventasHoy' && trend && (
                  <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4, marginTop: 6,
                    fontSize: 12, fontWeight: 700, color: pctCambio > 0 ? '#16a34a' : '#dc2626',
                    background: pctCambio > 0 ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.12)',
                    padding: '2px 8px', borderRadius: 4,
                  }}>
                    {pctCambio > 0 ? '▲' : '▼'} {Math.abs(pctCambio).toFixed(1)}%
                  </div>
                )}
              </div>
              <Icon size={32} opacity={0.25} color={c.color} />
            </div>
          </div>
        )
      })}
    </div>
  )
}
