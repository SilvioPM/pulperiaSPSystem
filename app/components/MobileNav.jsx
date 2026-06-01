'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

export default function MobileNav() {
  const pathname = usePathname()
  const { modulosPermitidos } = useAuth()

  const items = modulosPermitidos().filter(m => ['inicio','facturas','productos','reportes','clientes'].includes(m.id)).map(m => ({
    href: m.path, icono: m.label.split(' ')[0], label: m.label.replace(/^[^\s]+\s/, '')
  }))

  return (
    <nav style={{
      display: 'none',
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
      background: '#1e293b', borderTop: '1px solid #334155',
      paddingBottom: 'env(safe-area-inset-bottom)'
    }}
    className="mobile-nav">
      {items.map(item => {
        const activo = pathname === item.href
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '8px 4px', textDecoration: 'none',
            color: activo ? '#16a34a' : '#94a3b8',
            borderTop: activo ? '2px solid #16a34a' : '2px solid transparent',
            fontSize: '10px', fontWeight: activo ? 700 : 400, gap: '2px'
          }}>
            <span style={{ fontSize: '20px' }}>{item.icono}</span>
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
