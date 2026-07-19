'use client'
import { useRouter } from 'next/navigation'
import { Package, Users, Wallet, CheckCircle, ArrowRight } from 'lucide-react'

const steps = [
  {
    key: 'productos', icon: Package,
    label: 'Agregá tu primer producto',
    desc: 'Creá el catálogo de productos que vendés',
    route: '/productos',
    check: (p) => p.sinProductos,
  },
  {
    key: 'clientes', icon: Users,
    label: 'Agregá tu primer cliente',
    desc: 'Registrá los clientes de tu negocio',
    route: '/clientes',
    check: (p) => p.sinClientes,
  },
  {
    key: 'caja', icon: Wallet,
    label: 'Abrí tu primera caja',
    desc: 'Iniciá el turno para comenzar a operar',
    route: '/caja',
    check: (p) => p.sinCaja,
  },
]

export default function PanelOnboarding({ sinProductos, sinClientes, sinCaja }) {
  const router = useRouter()
  const props = { sinProductos, sinClientes, sinCaja }
  const pendientes = steps.filter(s => s.check(props))

  if (pendientes.length === 0) return null

  const completados = steps.length - pendientes.length
  const pct = Math.round((completados / steps.length) * 100)

  return (
    <div className="card" style={{ padding: 20, height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14 }}>
        <div style={{
          width: 36, height: 36, borderRadius: '50%',
          background: `conic-gradient(var(--verde) ${pct}%, var(--borde) ${pct}%)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 11, fontWeight: 800, color: 'var(--texto)',
        }}>{pct}%</div>
        <div>
          <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--texto)', textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
            Configuración inicial
          </h3>
          <div style={{ fontSize: 11, color: 'var(--texto-secundario)', marginTop: 1 }}>{completados} de {steps.length} completados</div>
        </div>
      </div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
        {steps.map(s => {
          const hecho = !s.check(props)
          const Icon = s.icon
          return (
            <div key={s.key} onClick={() => !hecho && router.push(s.route)}
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px',
                borderRadius: 10, cursor: hecho ? 'default' : 'pointer',
                background: hecho ? 'rgba(22,163,74,0.06)' : 'var(--hover)',
                opacity: hecho ? 0.6 : 1,
                transition: 'transform 0.15s',
              }}
              onMouseEnter={e => { if (!hecho) e.currentTarget.style.transform = 'translateX(4px)' }}
              onMouseLeave={e => { e.currentTarget.style.transform = '' }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: hecho ? 'var(--verde)' : 'var(--borde)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              }}>
                {hecho ? <CheckCircle size={16} color="white" /> : <Icon size={16} color="var(--texto-secundario)" />}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--texto)' }}>{s.label}</div>
                <div style={{ fontSize: 11, color: 'var(--texto-secundario)', marginTop: 1 }}>{s.desc}</div>
              </div>
              {!hecho && <ArrowRight size={16} color="var(--texto-secundario)" style={{ flexShrink: 0 }} />}
            </div>
          )
        })}
      </div>
    </div>
  )
}
