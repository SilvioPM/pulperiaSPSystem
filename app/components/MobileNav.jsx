'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import * as Icons from 'lucide-react'

export default function MobileNav() {
  const pathname = usePathname()
  const { modulosPermitidos, user, logout } = useAuth()
  const [abierto, setAbierto] = useState(false)
  const [dark, setDark] = useState(false)

  useEffect(() => {
    if (localStorage.getItem('tema') === 'oscuro') setDark(true)
  }, [])

  useEffect(() => { setAbierto(false) }, [pathname])

  if (pathname.startsWith('/pos')) return null

  const items = modulosPermitidos()
    .filter(m => ['inicio', 'facturas', 'productos', 'reportes', 'clientes'].includes(m.id))
    .map(m => ({ href: m.path, icono: m.icono, label: m.label }))

  const todos = modulosPermitidos().map(m => ({ href: m.path, icono: m.icono, label: m.label }))

  function toggleTema() {
    const nuevo = !dark
    setDark(nuevo)
    localStorage.setItem('tema', nuevo ? 'oscuro' : 'claro')
    document.documentElement.setAttribute('data-theme', nuevo ? 'dark' : 'light')
  }

  return (
    <>
      <nav className="mobile-nav" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 100,
        background: '#1e293b', borderTop: '1px solid #334155',
        paddingBottom: 'env(safe-area-inset-bottom)'
      }}>
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
        <button onClick={() => setAbierto(true)} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          padding: '8px 4px', textDecoration: 'none', background: 'none', border: 'none',
          color: abierto ? '#16a34a' : '#94a3b8',
          borderTop: '2px solid transparent',
          fontSize: '10px', fontWeight: 400, gap: '2px', cursor: 'pointer'
        }}>
          <Icons.Menu size={20} />
          Menú
        </button>
      </nav>

      {abierto && (
        <div onClick={() => setAbierto(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 200,
          display: 'flex', justifyContent: 'flex-end'
        }}>
          <div onClick={e => e.stopPropagation()} style={{
            width: '280px', maxWidth: '85vw', height: '100%', background: '#1e293b',
            color: 'white', overflowY: 'auto', padding: '16px',
            display: 'flex', flexDirection: 'column'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #334155' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: 800 }}>
                  SP<span style={{ color: '#16a34a' }}>System</span>
                </div>
                {user && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: 2 }}>{user.nombre} {user.esAdmin ? '(Admin)' : ''}</div>}
              </div>
              <button onClick={() => setAbierto(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', fontSize: '20px', cursor: 'pointer', padding: '4px' }}>✕</button>
            </div>

            <nav style={{ flex: 1 }}>
              {todos.map(item => {
                const activo = pathname === item.href
                const IconComp = Icons[item.icono]
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 10px', borderRadius: '8px', marginBottom: '4px',
                    textDecoration: 'none',
                    color: activo ? 'white' : '#94a3b8',
                    background: activo ? '#16a34a' : 'transparent',
                    fontWeight: activo ? 600 : 400, fontSize: '14px'
                  }}>
                    {IconComp && <IconComp size={18} />}
                    {item.label}
                  </Link>
                )
              })}
              <div style={{ color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 10px 8px', fontWeight: 600 }}>Ayuda</div>
              {[
                { href: '/manual', icono: 'BookOpen', label: 'Manual' },
                { href: '/movil', icono: 'Smartphone', label: 'Vista Móvil' },
              ].map(item => {
                const activo = pathname === item.href
                const IconComp = Icons[item.icono]
                return (
                  <Link key={item.href} href={item.href} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '12px 10px', borderRadius: '8px', marginBottom: '4px',
                    textDecoration: 'none',
                    color: activo ? 'white' : '#94a3b8',
                    background: activo ? '#16a34a' : 'transparent',
                    fontWeight: activo ? 600 : 400, fontSize: '14px'
                  }}>
                    {IconComp && <IconComp size={18} />}
                    {item.label}
                  </Link>
                )
              })}
              {user?.rol === 'admin' && (
                <>
                  <div style={{ color: '#475569', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '1px', padding: '16px 10px 8px', fontWeight: 600 }}>Sistema</div>
                  {[
                    { href: '/auditoria', icono: 'ClipboardList', label: 'Auditoría' },
                    { href: '/licencia', icono: 'Key', label: 'Licencia' },
                    { href: '/respaldos', icono: 'Save', label: 'Respaldos' },
                  ].map(item => {
                    const activo = pathname === item.href
                    const IconComp = Icons[item.icono]
                    return (
                      <Link key={item.href} href={item.href} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 10px', borderRadius: '8px', marginBottom: '4px',
                        textDecoration: 'none',
                        color: activo ? 'white' : '#94a3b8',
                        background: activo ? '#16a34a' : 'transparent',
                        fontWeight: activo ? 600 : 400, fontSize: '14px'
                      }}>
                        {IconComp && <IconComp size={18} />}
                        {item.label}
                      </Link>
                    )
                  })}
                </>
              )}
            </nav>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '12px', borderTop: '1px solid #334155' }}>
              <span style={{ fontSize: '12px', color: '#475569' }}>Sistema v1.0 NI</span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={logout} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '14px', color: '#ef4444', padding: '4px' }}>
                  <Icons.LogOut size={18} />
                </button>
                <button onClick={toggleTema} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '18px', color: '#94a3b8', padding: '4px' }}>
                  {dark ? <Icons.Sun size={18} /> : <Icons.Moon size={18} />}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}