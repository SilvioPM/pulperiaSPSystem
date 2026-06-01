'use client'
import { useState, useEffect } from 'react'

export default function Deudas() {
  const [compras, setCompras]       = useState([])
  const [compraSeleccionada, setCompraSeleccionada] = useState(null)
  const [mostrarAbono, setMostrarAbono] = useState(false)
  const [formAbono, setFormAbono]     = useState({ monto: '', nota: '' })
  const [guardando, setGuardando]     = useState(false)
  const [filtro, setFiltro]           = useState('pendientes')

  useEffect(() => { cargarCompras() }, [])

  async function cargarCompras() {
    try {
      const res  = await fetch('/api/compras')
      const data = await res.json()
      const creditos = Array.isArray(data)
        ? data.filter(f => f.esCredito)
        : []
      setCompras(creditos)
    } catch {
      setCompras([])
    }
  }

  async function registrarAbono(e) {
    e.preventDefault()
    if (!compraSeleccionada) return
    setGuardando(true)
    try {
      const res  = await fetch('/api/abonos-compra', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          compraId: compraSeleccionada.id,
          monto:     parseFloat(formAbono.monto),
          nota:      formAbono.nota
        })
      })
      
      if (res.ok) {
        setMostrarAbono(false)
        setFormAbono({ monto: '', nota: '' })
        setCompraSeleccionada(null)
        cargarCompras()
      } else {
        alert('Error al registrar abono')
      }
    } catch {
      alert('Error de red al registrar abono')
    }
    setGuardando(false)
  }

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const pendientes = compras.filter(f => f.saldoPendiente > 0)
  const pagadas    = compras.filter(f => f.saldoPendiente <= 0)
  const mostradas  = filtro === 'pendientes' ? pendientes : pagadas

  const totalPendiente = pendientes.reduce((sum, f) => sum + f.saldoPendiente, 0)

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
          🏭 Cuentas por Pagar (CXP)
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Deudas con proveedores y historial de pagos
        </p>
      </div>

      {/* Tarjeta resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Deuda Total con Proveedores</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#dc2626' }}>
            C$ {totalPendiente.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{pendientes.length} facturas por pagar</div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { key: 'pendientes', label: `📋 Pendientes (${pendientes.length})` },
          { key: 'pagadas',    label: `✅ Pagadas (${pagadas.length})`      },
        ].map(t => (
          <button key={t.key} onClick={() => setFiltro(t.key)}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              background: filtro === t.key ? 'white' : 'transparent',
              color: filtro === t.key ? '#1e293b' : '#64748b',
              boxShadow: filtro === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Lista de deudas */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Factura #', 'Proveedor', 'Fecha', 'Total', 'Pendiente', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mostradas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No hay deudas {filtro === 'pendientes' ? 'pendientes' : 'pagadas'}
                </td>
              </tr>
            ) : (
              mostradas.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb', fontSize: '14px' }}>
                    {f.numero}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px' }}>
                    {f.proveedor?.nombre}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {formatearFecha(f.creadoEn)}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                    C$ {f.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 700, color: f.saldoPendiente > 0 ? '#dc2626' : '#16a34a' }}>
                      C$ {f.saldoPendiente.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {f.saldoPendiente > 0 && (
                      <button
                        onClick={() => { setCompraSeleccionada(f); setMostrarAbono(true) }}
                        style={{
                          padding: '6px 12px', borderRadius: '6px', border: 'none',
                          background: '#16a34a', color: 'white',
                          cursor: 'pointer', fontSize: '13px', fontWeight: 600
                        }}>
                        💸 Abonar
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal registrar abono */}
      {mostrarAbono && compraSeleccionada && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>💸 Abonar a Proveedor</h2>
              <button onClick={() => { setMostrarAbono(false); setFormAbono({ monto: '', nota: '' }) }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Proveedor: </span>
                <span style={{ fontWeight: 700 }}>{compraSeleccionada.proveedor?.nombre}</span>
              </div>
              <div>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Pendiente: </span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>C$ {compraSeleccionada.saldoPendiente.toFixed(2)}</span>
              </div>
            </div>

            <form onSubmit={registrarAbono}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Monto a pagar (C$)</label>
                <input required type="number" step="0.01" max={compraSeleccionada.saldoPendiente}
                  value={formAbono.monto} onChange={e => setFormAbono({...formAbono, monto: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nota</label>
                <input value={formAbono.nota} onChange={e => setFormAbono({...formAbono, nota: e.target.value})}
                  placeholder="Ej: Pago con transferencia"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setMostrarAbono(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  {guardando ? '⏳ Guardando...' : '💰 Registrar Pago'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
