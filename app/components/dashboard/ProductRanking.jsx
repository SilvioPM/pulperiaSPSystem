'use client'
import { useState, useMemo } from 'react'
import { TrendingUp, TrendingDown, Package, Award } from 'lucide-react'

const tabs = [
  { key: 'top', label: 'Más vendidos', icon: TrendingUp, color: '#16a34a', gradient: 'linear-gradient(90deg, #dcfce7, #bbf7d0)' },
  { key: 'bajo', label: 'Menos consumo', icon: TrendingDown, color: '#be185d', gradient: 'linear-gradient(90deg, #fce7f3, #fbcfe8)' },
  { key: 'rentable', label: 'Más rentables', icon: Award, color: '#d97706', gradient: 'linear-gradient(90deg, #fef3c7, #fde68a)' },
  { key: 'noRentable', label: 'Menos ganancia', icon: Package, color: '#991b1b', gradient: 'linear-gradient(90deg, #fef2f2, #fee2e2)' },
]

export default function ProductRanking({ topProductos = [] }) {
  const [tab, setTab] = useState('top')

  const rankings = useMemo(() => {
    const items = topProductos || []
    return {
      top: [...items].sort((a, b) => b.ventas - a.ventas).slice(0, 5),
      bajo: [...items].sort((a, b) => a.cantidad - b.cantidad).slice(0, 5),
      rentable: [...items].sort((a, b) => b.ganancia - a.ganancia).slice(0, 5),
      noRentable: [...items].sort((a, b) => a.ganancia - b.ganancia).slice(0, 5),
    }
  }, [topProductos])

  const active = tabs.find(t => t.key === tab)
  const data = rankings[tab] || []

  return (
    <div className="card" style={{ padding: 20, marginBottom: 32 }}>
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
        {tabs.map(t => {
          const isActive = tab === t.key
          const Icon = t.icon
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px',
                borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                whiteSpace: 'nowrap', flexShrink: 0,
                background: isActive ? t.gradient : '#f1f5f9',
                color: isActive ? t.color : '#64748b',
                transition: 'all 0.15s',
              }}>
              <Icon size={16} />
              {t.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {data.length === 0 ? (
        <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '12px 0' }}>
          Sin datos en este período
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {(() => {
            if (tab === 'top' || tab === 'bajo') {
              const maxVal = Math.max(...data.map(p => p.cantidad), 1)
              return data.map((p, i) => (
                <div key={i}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.nombre}</span>
                    <span style={{ fontWeight: 700, color: active.color }}>{p.cantidad} uds</span>
                  </div>
                  <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                    <div style={{
                      height: '100%', width: `${(p.cantidad / maxVal) * 100}%`,
                      background: active.gradient, borderRadius: 4, transition: 'width 0.5s',
                    }} />
                  </div>
                </div>
              ))
            }
            // rentable / no rentable — show C$ values
            const maxVal = Math.max(...data.map(p => Math.abs(p.ganancia)), 1)
            return data.map((p, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, color: '#1e293b' }}>{p.nombre}</span>
                  <span style={{ fontWeight: 700, color: active.color }}>
                    C$ {p.ganancia.toFixed(2)}
                  </span>
                </div>
                <div style={{ height: 8, background: '#f1f5f9', borderRadius: 4, overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', width: `${(Math.abs(p.ganancia) / maxVal) * 100}%`,
                    background: active.gradient, borderRadius: 4, transition: 'width 0.5s',
                  }} />
                </div>
              </div>
            ))
          })()}
        </div>
      )}
    </div>
  )
}
