'use client'
import { useRouter } from 'next/navigation'
import { AlertTriangle, Clock, CreditCard, DollarSign, Users, ShoppingBag } from 'lucide-react'

const alertStyles = {
  wrapper: (bg) => ({
    display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
    borderRadius: 10, background: bg, cursor: 'pointer',
    transition: 'transform 0.15s, box-shadow 0.15s',
  }),
  icon: (bg) => ({
    width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
    background: bg, flexShrink: 0,
  }),
}

export default function PanelAlertas({ stockBajo = [], cxc = [], prodsPorVencer = [], cajaAbierta = true, clientesSobreLimite = 0 }) {
  const router = useRouter()

  const alerts = []

  if (stockBajo.length > 0) {
    alerts.push({
      id: 'stock',
      icon: AlertTriangle,
      label: `${stockBajo.length} producto(s) con stock bajo`,
      sub: 'Necesitan reposición',
      route: '/productos',
      severity: 'warning',
    })
  }

  const vencidas = cxc.filter(f => f.diasDeuda > 30)
  if (vencidas.length > 0) {
    alerts.push({
      id: 'cxc',
      icon: DollarSign,
      label: `${vencidas.length} factura(s) de crédito vencidas`,
      sub: `C$ ${vencidas.reduce((s, f) => s + f.saldoPendiente, 0).toFixed(2)} por cobrar`,
      route: '/cuentas-cobrar',
      severity: 'critical',
    })
  }

  if (prodsPorVencer.length > 0) {
    alerts.push({
      id: 'vencer',
      icon: Clock,
      label: `${prodsPorVencer.length} producto(s) próximos a vencer`,
      sub: 'Revisar inventario para promociones o mermas',
      route: '/inventario',
      severity: 'warning',
    })
  }

  if (!cajaAbierta) {
    alerts.push({
      id: 'caja',
      icon: CreditCard,
      label: 'Caja cerrada',
      sub: 'Abrir caja para comenzar operaciones del día',
      route: '/caja',
      severity: 'info',
    })
  }

  if (clientesSobreLimite > 0) {
    alerts.push({
      id: 'clientes',
      icon: Users,
      label: `${clientesSobreLimite} cliente(s) sobre su límite de crédito`,
      sub: 'Revisar cartera de clientes',
      route: '/clientes',
      severity: 'critical',
    })
  }

  if (alerts.length === 0) {
    return (
      <div className="card" style={{ padding: 20, marginBottom: 32 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <ShoppingBag size={20} color="#16a34a" />
          <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
            Tareas pendientes
          </h3>
        </div>
        <div style={{ fontSize: 13, color: '#94a3b8', textAlign: 'center', padding: '16px 0' }}>
          Todo al día, sin alertas pendientes
        </div>
      </div>
    )
  }

  const severityColors = {
    critical: { bg: '#fef2f2', icon: '#dc2626', iconBg: '#fee2e2' },
    warning: { bg: '#fffbeb', icon: '#d97706', iconBg: '#fef3c7' },
    info: { bg: '#eff6ff', icon: '#2563eb', iconBg: '#dbeafe' },
  }

  return (
    <div className="card" style={{ padding: 20, marginBottom: 32 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <ShoppingBag size={20} color="#d97706" />
        <h3 style={{ fontSize: 14, fontWeight: 700, color: '#1e293b', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
          Tareas pendientes
        </h3>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {alerts.map(a => {
          const s = severityColors[a.severity]
          const Icon = a.icon
          return (
            <div key={a.id} style={alertStyles.wrapper(s.bg)}
              onClick={() => router.push(a.route)}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateX(4px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = '' }}>
              <div style={alertStyles.icon(s.iconBg)}>
                <Icon size={18} color={s.icon} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>{a.label}</div>
                <div style={{ fontSize: 11, color: '#64748b', marginTop: 1 }}>{a.sub}</div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
