'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useAuth } from '@/app/context/AuthContext'

const CARD_HOVER = { transform: 'translateY(-3px)', boxShadow: '0 12px 32px rgba(0,0,0,0.12)' }

export default function Inicio() {
  const { user } = useAuth()
  const [datos, setDatos] = useState({ config: null, stats: null, cargando: true })

  useEffect(() => {
    if (user && !user.esAdmin) window.location.replace('/pos')
  }, [user])

  useEffect(() => {
    async function cargar() {
      try {
        const hoy = new Date()
        const desde = hoy.toISOString().slice(0, 10)
        const [resConfig, resFacturas, resProductos, resClientes] = await Promise.all([
          fetch('/api/config'),
          fetch(`/api/facturas?desde=${desde}&hasta=${desde}&limit=9999`),
          fetch('/api/productos?limit=9999'),
          fetch('/api/clientes?limit=1'),
        ])
        const cfg = await resConfig.json()
        const f = await resFacturas.json()
        const p = await resProductos.json()
        const c = await resClientes.json()
        const facturas = f.data || []
        setDatos({
          config: cfg,
          stats: {
            ventasHoy: facturas.reduce((s, fac) => s + (fac.total || 0), 0),
            facturasHoy: facturas.length,
            productosBajos: (p.data || []).filter(prod => prod.stock <= (prod.stockMinimo || 0)).length,
            clientes: c.total || 0,
          },
          cargando: false,
        })
      } catch { setDatos(p => ({ ...p, cargando: false })) }
    }
    cargar()
  }, [])

  const { config, stats, cargando } = datos
  const negocio = config?.nombre || 'SP System'
  const slogan = config?.slogan || ''
  const logo = config?.logo || ''

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>

      {/* ── Hero / Presentación ── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 60%, #0f172a 100%)',
        borderRadius: 20, padding: '36px 24px', marginBottom: 32,
        display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
        gap: 16, position: 'relative', overflow: 'hidden',
        boxShadow: '0 8px 40px rgba(0,0,0,0.15)',
      }}>
        <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'radial-gradient(circle, rgba(22,163,74,0.08), transparent)', top: -100, right: -80 }} />
        <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'radial-gradient(circle, rgba(37,99,235,0.06), transparent)', bottom: -60, left: 40 }} />

        {logo ? (
          <div style={{
            width: 80, height: 80, borderRadius: 16, overflow: 'hidden',
            background: 'rgba(255,255,255,0.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 1,
          }}>
            <img src={logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        ) : (
          <div style={{
            width: 80, height: 80, borderRadius: 16,
            background: 'linear-gradient(135deg, #16a34a, #15803d)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            position: 'relative', zIndex: 1,
            boxShadow: '0 8px 24px rgba(22,163,74,0.3)',
          }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
              <line x1="12" y1="10" x2="12" y2="6" />
            </svg>
          </div>
        )}

        <div style={{ position: 'relative', zIndex: 1 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>{negocio}</h1>
          {slogan && <p style={{ color: '#94a3b8', margin: '4px 0 0', fontSize: 14 }}>{slogan}</p>}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, marginTop: 12 }}>
            <span style={{ color: '#cbd5e1', fontSize: 14 }}>
              👋 {user?.nombre || 'Usuario'}
            </span>
            <span style={{ width: 4, height: 4, borderRadius: '50%', background: '#475569' }} />
            <span style={{ color: '#94a3b8', fontSize: 13 }}>
              {new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </span>
          </div>
        </div>
      </div>

      {/* ── Stats ── */}
      {cargando ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {[1, 2, 3, 4].map(i => (
            <div key={i} style={{ height: 100, borderRadius: 14, background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'skeleton 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 16, marginBottom: 32 }}>
          {/* Ventas hoy */}
          <div style={{
            borderRadius: 14, padding: 20,
            background: 'linear-gradient(135deg, #dcfce7, #bbf7d0)',
            position: 'relative', overflow: 'hidden',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
            onMouseEnter={e => Object.assign(e.currentTarget.style, CARD_HOVER)}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#15803d', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Ventas hoy</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#166534' }}>C$ {stats.ventasHoy.toFixed(2)}</div>
              </div>
              <span style={{ fontSize: 28, opacity: 0.3 }}>📈</span>
            </div>
          </div>
          {/* Facturas hoy */}
          <div style={{
            borderRadius: 14, padding: 20,
            background: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
            onMouseEnter={e => Object.assign(e.currentTarget.style, CARD_HOVER)}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Facturas hoy</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#1e3a8a' }}>{stats.facturasHoy}</div>
              </div>
              <span style={{ fontSize: 28, opacity: 0.3 }}>🧾</span>
            </div>
          </div>
          {/* Stock bajo */}
          <div style={{
            borderRadius: 14, padding: 20,
            background: 'linear-gradient(135deg, #fef3c7, #fde68a)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
            onMouseEnter={e => Object.assign(e.currentTarget.style, CARD_HOVER)}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#92400e', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Stock bajo</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#78350f' }}>{stats.productosBajos}</div>
              </div>
              <span style={{ fontSize: 28, opacity: 0.3 }}>📦</span>
            </div>
          </div>
          {/* Clientes */}
          <div style={{
            borderRadius: 14, padding: 20,
            background: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            cursor: 'default',
          }}
            onMouseEnter={e => Object.assign(e.currentTarget.style, CARD_HOVER)}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#6b21a8', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 4 }}>Clientes</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: '#4c1d95' }}>{stats.clientes}</div>
              </div>
              <span style={{ fontSize: 28, opacity: 0.3 }}>👥</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Accesos rápidos ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>
        <Link href="/pos" style={{
          borderRadius: 14, padding: 28, textDecoration: 'none',
          background: 'linear-gradient(135deg, #16a34a, #15803d)',
          color: 'white', display: 'flex', alignItems: 'center', gap: 18,
          transition: 'transform 0.25s, box-shadow 0.25s',
          boxShadow: '0 4px 16px rgba(22,163,74,0.3)',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(22,163,74,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(22,163,74,0.3)' }}>
          <span style={{ fontSize: 40 }}>🛒</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Ir al POS</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Cobrar productos y facturar</div>
          </div>
        </Link>
        <Link href="/facturas" style={{
          borderRadius: 14, padding: 28, textDecoration: 'none',
          background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
          color: 'white', display: 'flex', alignItems: 'center', gap: 18,
          transition: 'transform 0.25s, box-shadow 0.25s',
          boxShadow: '0 4px 16px rgba(37,99,235,0.3)',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(37,99,235,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(37,99,235,0.3)' }}>
          <span style={{ fontSize: 40 }}>🧾</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Facturas</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Ver historial de ventas</div>
          </div>
        </Link>
        <Link href="/caja" style={{
          borderRadius: 14, padding: 28, textDecoration: 'none',
          background: 'linear-gradient(135deg, #d97706, #b45309)',
          color: 'white', display: 'flex', alignItems: 'center', gap: 18,
          transition: 'transform 0.25s, box-shadow 0.25s',
          boxShadow: '0 4px 16px rgba(217,119,6,0.3)',
        }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 36px rgba(217,119,6,0.4)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 4px 16px rgba(217,119,6,0.3)' }}>
          <span style={{ fontSize: 40 }}>💰</span>
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>Caja / Arqueo</div>
            <div style={{ fontSize: 13, opacity: 0.85, marginTop: 2 }}>Abrir, cerrar y revisar caja</div>
          </div>
        </Link>
      </div>

      {/* Skeleton keyframe */}
      <style>{`@keyframes skeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  )
}
