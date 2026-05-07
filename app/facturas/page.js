'use client'
import { useState, useEffect } from 'react'

export default function Facturas() {
  const [facturas, setFacturas]       = useState([])
  const [facturaVer, setFacturaVer]   = useState(null)
  const [buscando, setBuscando]       = useState('')

  useEffect(() => { cargarFacturas() }, [])

  async function cargarFacturas() {
    const res  = await fetch('/api/facturas')
    const data = await res.json()
    setFacturas(data)
  }

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  const facturasFiltradas = facturas.filter(f =>
    f.numero.toLowerCase().includes(buscando.toLowerCase()) ||
    f.cliente?.nombre?.toLowerCase().includes(buscando.toLowerCase())
  )

  // Totales del día
  const hoy        = new Date().toDateString()
  const ventasHoy  = facturas.filter(f => new Date(f.creadoEn).toDateString() === hoy)
  const totalHoy   = ventasHoy.reduce((sum, f) => sum + f.total, 0)

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>🧾 Facturas</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Historial de todas las ventas</p>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Ventas de hoy</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>{ventasHoy.length}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>facturas emitidas</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Total vendido hoy</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>C$ {totalHoy.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>córdobas</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Total facturas</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#7c3aed' }}>{facturas.length}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>historial completo</div>
        </div>
      </div>

      {/* Buscador */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar por número de factura o cliente..."
          value={buscando}
          onChange={e => setBuscando(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none'
          }}
        />
      </div>

      {/* Tabla de facturas */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['# Factura', 'Fecha', 'Cliente', 'Método pago', 'Total', 'Estado', 'Ver'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facturasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No hay facturas aún. ¡Realizá tu primera venta desde el POS!
                </td>
              </tr>
            ) : (
              facturasFiltradas.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 700, color: '#2563eb', fontSize: '14px' }}>{f.numero}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {formatearFecha(f.creadoEn)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {f.cliente?.nombre || <span style={{ color: '#94a3b8' }}>Cliente general</span>}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: f.metodoPago === 'efectivo' ? '#dcfce7' : f.metodoPago === 'tarjeta' ? '#dbeafe' : '#f3e8ff',
                      color: f.metodoPago === 'efectivo' ? '#16a34a' : f.metodoPago === 'tarjeta' ? '#2563eb' : '#7c3aed'
                    }}>
                      {f.metodoPago === 'efectivo' ? '💵' : f.metodoPago === 'tarjeta' ? '💳' : '📱'} {f.metodoPago}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '15px', color: '#16a34a' }}>
                    C$ {f.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600,
                      background: '#dcfce7', color: '#16a34a'
                    }}>
                      ✓ Pagada
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => setFacturaVer(f)}
                      style={{
                        padding: '6px 14px', borderRadius: '6px', border: '1px solid #e2e8f0',
                        background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                      }}>
                      👁️ Ver
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal ver factura */}
      {facturaVer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>

            {/* Cabecera de la factura */}
            <div style={{ textAlign: 'center', marginBottom: '20px', paddingBottom: '20px', borderBottom: '2px dashed #e2e8f0' }}>
              <div style={{ fontSize: '32px', marginBottom: '8px' }}>🛒</div>
              <div style={{ fontSize: '20px', fontWeight: 700 }}>Pulpería</div>
              <div style={{ fontSize: '13px', color: '#64748b' }}>Managua, Nicaragua</div>
              <div style={{ fontSize: '13px', color: '#64748b', marginTop: '4px' }}>
                {formatearFecha(facturaVer.creadoEn)}
              </div>
              <div style={{
                marginTop: '12px', fontSize: '18px', fontWeight: 700,
                color: '#2563eb', background: '#dbeafe',
                padding: '8px 20px', borderRadius: '8px', display: 'inline-block'
              }}>
                {facturaVer.numero}
              </div>
            </div>

            {/* Cliente */}
            <div style={{ marginBottom: '16px', fontSize: '14px' }}>
              <strong>Cliente:</strong> {facturaVer.cliente?.nombre || 'Cliente general'}
            </div>

            {/* Detalle de productos */}
            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>Producto</th>
                  <th style={{ padding: '8px', textAlign: 'center', fontSize: '12px', color: '#64748b' }}>Cant.</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>Precio</th>
                  <th style={{ padding: '8px', textAlign: 'right', fontSize: '12px', color: '#64748b' }}>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {facturaVer.detalles?.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontSize: '13px' }}>{d.producto?.nombre}</td>
                    <td style={{ padding: '8px', textAlign: 'center', fontSize: '13px' }}>{d.cantidad}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px' }}>C$ {d.precio.toFixed(2)}</td>
                    <td style={{ padding: '8px', textAlign: 'right', fontSize: '13px', fontWeight: 600 }}>C$ {d.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totales */}
            <div style={{ borderTop: '2px dashed #e2e8f0', paddingTop: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>Subtotal</span>
                <span>C$ {facturaVer.subtotal.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
                <span style={{ color: '#64748b' }}>IVA (15%)</span>
                <span>C$ {facturaVer.iva.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>
                <span>TOTAL</span>
                <span>C$ {facturaVer.total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Pago con</span>
                <span>C$ {facturaVer.pagoCon.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', color: '#64748b' }}>
                <span>Cambio</span>
                <span>C$ {facturaVer.cambio.toFixed(2)}</span>
              </div>
            </div>

            {/* Pie de factura */}
            <div style={{ textAlign: 'center', marginTop: '20px', paddingTop: '16px', borderTop: '2px dashed #e2e8f0', fontSize: '13px', color: '#94a3b8' }}>
              ¡Gracias por su compra! 🙏
            </div>

            <button onClick={() => setFacturaVer(null)}
              style={{
                width: '100%', marginTop: '20px', padding: '12px', borderRadius: '8px',
                border: 'none', background: '#1e293b', color: 'white',
                cursor: 'pointer', fontWeight: 600, fontSize: '14px'
              }}>
              Cerrar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
