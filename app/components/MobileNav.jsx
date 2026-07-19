'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import * as Icons from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()
  const { modulosPermitidos } = useAuth()

  const items = modulosPermitidos().filter(m => ['inicio','facturas','productos','reportes','clientes'].includes(m.id)).map(m => ({ href: m.path, icono: m.icono, label: m.label }))

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
        const IconComp = Icons[item.icono]
        return (
          <Link key={item.href} href={item.href} style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: '8px 4px', textDecoration: 'none',
            color: activo ? '#16a34a' : '#94a3b8',
            borderTop: activo ? '2px solid #16a34a' : '2px solid transparent',
            fontSize: '10px', fontWeight: activo ? 700 : 400, gap: '2px'
          }}>
            {IconComp && <IconComp size={20} />}
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
