'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { AlertTriangle, Ban } from 'lucide-react'

export default function StockAlerta({ card }) {
  const [bajos, setBajos] = useState([])
  const [cargando, setCargando] = useState(true)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    fetch('/api/productos?limit=9999')
      .then(r => r.json())
      .then(data => {
        const prods = data.data || data || []
        setBajos(prods.filter(p => p.stock <= p.stockMinimo).sort((a, b) => a.stock - b.stock))
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }, [])

  if (cargando) return null

  if (card) {
    return (
      <>
        <button onClick={() => setOpen(true)}
          style={{
            width: '100%', height: '100%', minHeight: 100,
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8,
            borderRadius: 14, border: '1.5px solid #fecaca',
            background: 'linear-gradient(135deg, #fef2f2, #fee2e2)',
            color: '#dc2626',
            cursor: 'pointer', fontWeight: 600, fontSize: 13,
            transition: 'transform 0.2s, box-shadow 0.2s',
          }}
          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.02)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(220,38,38,0.3)' }}
          onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '' }}>
          <span style={{ position: 'relative' }}>
            <AlertTriangle size={36} />
            {bajos.length > 0 && (
              <span style={{
                position: 'absolute', top: '-10px', right: '-14px',
                background: '#dc2626', color: 'white',
                borderRadius: '50%', width: 22, height: 22,
                fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
              }}>
                {bajos.length}
              </span>
            )}
          </span>
          {bajos.length === 0 ? 'Stock al día' : 'Stock bajo'}
        </button>
        {open && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
          }} onClick={() => setOpen(false)}>
            <div className="card" style={{
              width: '90%', maxWidth: '520px', maxHeight: '70vh',
              padding: '24px', overflowY: 'auto',
            }} onClick={e => e.stopPropagation()}>
              <div style={{
                display: 'flex', justifyContent: 'space-between',
                alignItems: 'center', marginBottom: '16px',
              }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <AlertTriangle size={20} /> Productos con stock bajo
                </h2>
                <span style={{ fontSize: '14px', color: '#64748b' }}>
                  {bajos.length} producto(s)
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {bajos.map(p => {
                  const pct = p.stockMinimo > 0 ? Math.round((p.stock / p.stockMinimo) * 100) : 0
                  return (
                    <div key={p.id} style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '10px 14px',
                      background: p.stock === 0 ? '#fef2f2' : '#fffbeb',
                      borderRadius: '10px',
                      border: p.stock === 0 ? '1px solid #fecaca' : '1px solid #fde68a',
                    }}>
                      <div style={{
                        width: '40px', height: '40px', borderRadius: '10px',
                        background: p.stock === 0 ? '#fee2e2' : '#fef3c7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '18px',
                      }}>
                        {p.stock === 0 ? <Ban size={20} /> : <AlertTriangle size={20} />}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.nombre}</div>
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          Stock: <strong style={{ color: p.stock === 0 ? '#dc2626' : '#d97706' }}>{p.stock}</strong> / {p.stockMinimo} mínimo
                        </div>
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: 700,
                        color: p.stock === 0 ? '#dc2626' : '#d97706',
                        whiteSpace: 'nowrap',
                      }}>
                        {p.stock === 0 ? 'SIN STOCK' : `${pct}%`}
                      </div>
                    </div>
                  )
                })}
              </div>
              <div style={{ marginTop: '16px', textAlign: 'center' }}>
                <Link href="/inventario"
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'inline-block', padding: '10px 24px',
                    borderRadius: '8px', background: '#1e293b', color: 'white',
                    textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                  }}>
                  Ir a Inventario →
                </Link>
              </div>
            </div>
          </div>
        )}
      </>
    )
  }

  if (bajos.length === 0) return null

  return (
    <>
      <button onClick={() => setOpen(true)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '8px',
          padding: '10px 16px', borderRadius: '10px', border: '1px solid #fecaca',
          background: '#fef2f2', color: '#dc2626',
          cursor: 'pointer', fontWeight: 600, fontSize: '14px',
          whiteSpace: 'nowrap',
        }}>
        <span style={{ position: 'relative' }}>
          <AlertTriangle size={20} />
          <span style={{
            position: 'absolute', top: '-8px', right: '-10px',
            background: '#dc2626', color: 'white',
            borderRadius: '50%', width: '18px', height: '18px',
            fontSize: '10px', fontWeight: 700,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            {bajos.length}
          </span>
        </span>
        Stock bajo
      </button>

      {open && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }} onClick={() => setOpen(false)}>
          <div className="card" style={{
            width: '90%', maxWidth: '520px', maxHeight: '70vh',
            padding: '24px', overflowY: 'auto',
          }} onClick={e => e.stopPropagation()}>
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              alignItems: 'center', marginBottom: '16px',
            }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
                <AlertTriangle size={20} /> Productos con stock bajo
              </h2>
              <span style={{ fontSize: '14px', color: '#64748b' }}>
                {bajos.length} producto(s)
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {bajos.map(p => {
                const pct = p.stockMinimo > 0 ? Math.round((p.stock / p.stockMinimo) * 100) : 0
                return (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '10px 14px',
                    background: p.stock === 0 ? '#fef2f2' : '#fffbeb',
                    borderRadius: '10px',
                    border: p.stock === 0 ? '1px solid #fecaca' : '1px solid #fde68a',
                  }}>
                    <div style={{
                      width: '40px', height: '40px', borderRadius: '10px',
                      background: p.stock === 0 ? '#fee2e2' : '#fef3c7',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px',
                    }}>
                      {p.stock === 0 ? <Ban size={20} /> : <AlertTriangle size={20} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.nombre}</div>
                      <div style={{ fontSize: '12px', color: '#64748b' }}>
                        Stock: <strong style={{ color: p.stock === 0 ? '#dc2626' : '#d97706' }}>{p.stock}</strong> / {p.stockMinimo} mínimo
                      </div>
                    </div>
                    <div style={{
                      fontSize: '11px', fontWeight: 700,
                      color: p.stock === 0 ? '#dc2626' : '#d97706',
                      whiteSpace: 'nowrap',
                    }}>
                      {p.stock === 0 ? 'SIN STOCK' : `${pct}%`}
                    </div>
                  </div>
                )
              })}
            </div>

            <div style={{ marginTop: '16px', textAlign: 'center' }}>
              <Link href="/inventario"
                onClick={() => setOpen(false)}
                style={{
                  display: 'inline-block', padding: '10px 24px',
                  borderRadius: '8px', background: '#1e293b', color: 'white',
                  textDecoration: 'none', fontWeight: 600, fontSize: '14px',
                }}>
                Ir a Inventario →
              </Link>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
