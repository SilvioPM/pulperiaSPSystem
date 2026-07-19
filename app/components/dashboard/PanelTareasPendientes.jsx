'use client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { AlertTriangle, Clock, DollarSign, Users, ShoppingBag, X } from 'lucide-react'

const severityConfig = {
  critical: { bg: '#fef2f2', icon: '#dc2626', iconBg: '#fee2e2' },
  warning: { bg: '#fffbeb', icon: '#d97706', iconBg: '#fef3c7' },
  info: { bg: '#eff6ff', icon: '#2563eb', iconBg: '#dbeafe' },
}

export default function PanelTareasPendientes({ stockBajo = [], cxc = [], prodsPorVencer = [], cajaAbierta = true }) {
  const router = useRouter()
  const [detalle, setDetalle] = useState(null)

  const alerts = []

  if (stockBajo.length > 0) {
    alerts.push({
      id: 'stock', icon: AlertTriangle, severity: 'warning',
      label: `${stockBajo.length} producto(s) con stock bajo`,
      sub: 'Necesitan reposición',
      route: '/productos',
      detalle: stockBajo.slice(0, 5).map(p => ({
        label: p.nombre, value: `Stock: ${p.stock} / Mín: ${p.stockMinimo}`,
      })),
    })
  }

  const vencidas = cxc.filter(f => f.diasDeuda > 30)
  if (vencidas.length > 0) {
    alerts.push({
      id: 'cxc', icon: DollarSign, severity: 'critical',
      label: `${vencidas.length} factura(s) de crédito vencidas`,
      sub: `C$ ${vencidas.reduce((s, f) => s + f.saldoPendiente, 0).toFixed(2)}`,
      route: '/cuentas-cobrar',
      detalle: vencidas.slice(0, 5).map(f => ({
        label: f.cliente || 'Cliente',
        value: `C$ ${f.saldoPendiente.toFixed(2)} · ${f.diasDeuda}d atraso`,
      })),
    })
  }

  if (prodsPorVencer.length > 0) {
    alerts.push({
      id: 'vencer', icon: Clock, severity: 'warning',
      label: `${prodsPorVencer.length} producto(s) próximos a vencer`,
      sub: 'Revisar inventario',
      route: '/inventario',
      detalle: prodsPorVencer.slice(0, 5).map(p => ({
        label: p.nombre || 'Producto',
        value: p.fechaVencimiento ? `Vence: ${new Date(p.fechaVencimiento).toLocaleDateString('es-NI')} · Stock: ${p.stock}` : '',
      })),
    })
  }

  if (!cajaAbierta) {
    alerts.push({
      id: 'caja', icon: Clock, severity: 'info',
      label: 'Caja cerrada',
      sub: 'Abrir caja para comenzar operaciones',
      route: '/caja',
    })
  }

  if (alerts.length === 0) {
    return (
      <div className="card" style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <ShoppingBag size={28} color="var(--verde)" />
        <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--texto)', marginTop: 8 }}>Todo al día</div>
        <div style={{ fontSize: 12, color: 'var(--texto-secundario)', marginTop: 4, textAlign: 'center' }}>No hay tareas pendientes</div>
      </div>
    )
  }

  return (
    <div className="card" style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <ShoppingBag size={20} color="var(--rojo)" />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--texto)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
          Tareas pendientes
        </h3>
        <span style={{ marginLeft: 'auto', fontSize: 11, fontWeight: 700, color: 'white', background: 'var(--rojo)', padding: '2px 8px', borderRadius: 10 }}>{alerts.length}</span>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, overflowY: 'auto' }}>
        {alerts.map(a => {
          const s = severityConfig[a.severity]
          const Icon = a.icon
          return (
            <div key={a.id}>
              <div onClick={() => {
                if (a.detalle) setDetalle(detalle?.id === a.id ? null : a)
                else router.push(a.route)
              }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px',
                  borderRadius: 8, cursor: 'pointer', background: s.bg,
                  transition: 'transform 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(3px)' }}
                onMouseLeave={e => { e.currentTarget.style.transform = '' }}>
                <div style={{
                  width: 30, height: 30, borderRadius: '50%',
                  background: s.iconBg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                }}>
                  <Icon size={15} color={s.icon} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--texto)' }}>{a.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--texto-secundario)', marginTop: 1 }}>{a.sub}</div>
                </div>
              </div>

              {/* Detalle expandible */}
              {detalle?.id === a.id && a.detalle && (
                <div style={{ marginTop: 6, padding: '8px 10px 8px 44px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                  {a.detalle.map((d, i) => (
                    <div key={i} style={{
                      display: 'flex', justifyContent: 'space-between', gap: 8,
                      padding: '6px 10px', borderRadius: 6, background: 'var(--hover)',
                      fontSize: 12, cursor: 'pointer',
                    }}
                      onClick={() => router.push(a.route)}>
                      <span style={{ fontWeight: 600, color: 'var(--texto)' }}>{d.label}</span>
                      <span style={{ color: 'var(--texto-secundario)', flexShrink: 0 }}>{d.value}</span>
                    </div>
                  ))}
                  <div onClick={() => router.push(a.route)}
                    style={{ fontSize: 11, color: 'var(--texto-secundario)', cursor: 'pointer', padding: '2px 10px' }}>
                    Mostrar todo →
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
