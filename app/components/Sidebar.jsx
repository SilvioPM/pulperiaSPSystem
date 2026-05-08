'use client'
import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const menu = [
  { href: '/',           icono: '🏪', label: 'POS - Vender'    },
  { href: '/productos',  icono: '📦', label: 'Productos'       },
  { href: '/inventario', icono: '🏬', label: 'Inventario'      },
  { href: '/facturas',   icono: '🧾', label: 'Facturas'        },
  { href: '/clientes',   icono: '👥', label: 'Clientes'        },
  { href: '/reportes',   icono: '📊', label: 'Reportes'        },
  { href: '/configuracion', icono: '⚙️', label: 'Configuración' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)

  return (
    <aside style={{
      width: collapsed ? '64px' : '220px',
      background: '#1e293b',
      color: 'white',
      display: 'flex',
      flexDirection: 'column',
      transition: 'width 0.3s',
      minHeight: '100vh',
      position: 'sticky',
      top: 0,
    }}>
      {/* Logo */}
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #334155',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span style={{ fontSize: '24px' }}>🛒</span>
        {!collapsed && (
          <span style={{ fontWeight: 700, fontSize: '16px' }}>
            Pulpería
          </span>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            marginLeft: 'auto',
            background: 'none',
            border: 'none',
            color: '#94a3b8',
            cursor: 'pointer',
            fontSize: '18px'
          }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

      {/* Menú */}
      <nav style={{ flex: 1, padding: '12px 8px' }}>
        {menu.map(item => {
          const activo = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '12px 10px',
              borderRadius: '8px',
              marginBottom: '4px',
              textDecoration: 'none',
              color: activo ? 'white' : '#94a3b8',
              background: activo ? '#16a34a' : 'transparent',
              fontWeight: activo ? 600 : 400,
              fontSize: '14px',
              transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: '18px' }}>{item.icono}</span>
              {!collapsed && item.label}
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      {!collapsed && (
        <div style={{
          padding: '16px',
          borderTop: '1px solid #334155',
          fontSize: '12px',
          color: '#475569'
        }}>
          Sistema v1.0 🇳🇮
        </div>
      )}
    </aside>
  )
}