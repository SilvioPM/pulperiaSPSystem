'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

export default function Sidebar() {
  const pathname = usePathname()
  const [collapsed, setCollapsed] = useState(false)
  const [dark, setDark] = useState(false)
  const { modulosPermitidos, user, logout } = useAuth()

  useEffect(() => {
    const saved = localStorage.getItem('tema') === 'oscuro'
    setDark(saved)
    document.documentElement.setAttribute('data-theme', saved ? 'dark' : 'light')
  }, [])

  function toggleTema() {
    const nuevo = !dark
    setDark(nuevo)
    localStorage.setItem('tema', nuevo ? 'oscuro' : 'claro')
    document.documentElement.setAttribute('data-theme', nuevo ? 'dark' : 'light')
  }

  const menu = modulosPermitidos().map(m => ({ href: m.path, icono: m.label.split(' ')[0], label: m.label.replace(/^[^\s]+\s/, '') }))

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
      <div style={{
        padding: '20px 16px',
        borderBottom: '1px solid #334155',
        textAlign: 'center',
        position: 'relative',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', marginBottom: collapsed ? 0 : '6px' }}>
          {!collapsed && (
            <span style={{ fontSize: '20px', fontWeight: 800, color: '#fff', letterSpacing: '-1px' }}>
              SP<span style={{ color: '#16a34a' }}>System</span>
            </span>
          )}
        </div>
        {!collapsed && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
            <span style={{ width: '16px', height: '1.5px', borderRadius: '2px', background: 'linear-gradient(90deg, transparent, #16a34a)' }} />
            <span style={{ fontSize: '9px', color: '#64748b', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' }}>
              POS
            </span>
            <span style={{ width: '16px', height: '1.5px', borderRadius: '2px', background: 'linear-gradient(90deg, #16a34a, transparent)' }} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          style={{
            position: 'absolute',
            right: '8px',
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: '#94a3b8',
            fontSize: '18px',
            padding: '4px'
          }}>
          {collapsed ? '→' : '←'}
        </button>
      </div>

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
        {!collapsed && <div style={{ color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 10px 8px', fontWeight: 600 }}>Ayuda</div>}
        {[
          { href: '/manual', icono: '📖', label: 'Manual' },
        ].map(item => {
          const activo = pathname === item.href
          return (
            <Link key={item.href} href={item.href} style={{
              display: 'flex', alignItems: 'center', gap: '12px',
              padding: '12px 10px', borderRadius: '8px', marginBottom: '4px',
              textDecoration: 'none',
              color: activo ? 'white' : '#94a3b8',
              background: activo ? '#16a34a' : 'transparent',
              fontWeight: activo ? 600 : 400, fontSize: '14px', transition: 'all 0.2s',
            }}>
              <span style={{ fontSize: '18px' }}>{item.icono}</span>
              {!collapsed && item.label}
            </Link>
          )
        })}
        {user?.rol === 'admin' && (
          <>
            {!collapsed && <div style={{ color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 10px 8px', fontWeight: 600 }}>Sistema</div>}
            {[
              { href: '/auditoria', icono: '📋', label: 'Auditoría' },
              { href: '/licencia', icono: '🔑', label: 'Licencia' },
              { href: '/respaldos', icono: '💾', label: 'Respaldos' },
            ].map(item => {
              const activo = pathname === item.href
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: '12px',
                  padding: '12px 10px', borderRadius: '8px', marginBottom: '4px',
                  textDecoration: 'none',
                  color: activo ? 'white' : '#94a3b8',
                  background: activo ? '#16a34a' : 'transparent',
                  fontWeight: activo ? 600 : 400, fontSize: '14px', transition: 'all 0.2s',
                }}>
                  <span style={{ fontSize: '18px' }}>{item.icono}</span>
                  {!collapsed && item.label}
                </Link>
              )
            })}
          </>
        )}
      </nav>

      <div style={{
        padding: '12px 16px',
        borderTop: '1px solid #334155',
      }}>
        {!collapsed && user && (
          <div style={{ fontSize: '12px', color: '#94a3b8', marginBottom: 8, textAlign: 'center' }}>
            {user.nombre} {user.esAdmin ? '(Admin)' : ''}
          </div>
        )}
        {!collapsed ? (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '12px', color: '#475569' }}>Sistema v1.0 🇳🇮</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <button onClick={logout}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '14px', color: '#ef4444', padding: '4px'
                }}>
                ⏻
              </button>
              <button onClick={toggleTema}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '18px', color: '#94a3b8', padding: '4px'
                }}>
                {dark ? '☀️' : '🌙'}
              </button>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8 }}>
            <button onClick={logout}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '14px', color: '#ef4444', padding: '4px'
              }}>
              ⏻
            </button>
            <button onClick={toggleTema}
              style={{
                background: 'none', border: 'none', cursor: 'pointer',
                fontSize: '18px', color: '#94a3b8', padding: '4px'
              }}>
              {dark ? '☀️' : '🌙'}
            </button>
          </div>
        )}
      </div>
    </aside>
  )
}
