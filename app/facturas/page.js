'use client'
import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import FacturaRecibo from '../components/FacturaRecibo'

export default function Facturas() {
  const [facturas, setFacturas]     = useState([])
  const [facturaVer, setFacturaVer] = useState(null)
  const [buscando, setBuscando]     = useState('')
  const [config, setConfig]         = useState({})
  const reciboRef                   = useRef(null)

  useEffect(() => {
    cargarFacturas()
    cargarConfig()
  }, [])

  async function cargarFacturas() {
    const res  = await fetch('/api/facturas')
    const data = await res.json()
    setFacturas(data)
  }

  async function cargarConfig() {
    const res  = await fetch('/api/config')
    const data = await res.json()
    setConfig(data)
  }

  // ── Imprimir ticket ──────────────────────────────────────────
  const imprimirTicket = useReactToPrint({
    contentRef: reciboRef,
    documentTitle: facturaVer?.numero || 'Factura',
  })

  // ── Compartir por WhatsApp ───────────────────────────────────
  function compartirWhatsApp(factura) {
    const negocio  = config?.nombre || 'Mi Pulpería'
    const productos = factura.detalles?.map(d =>
      `  • ${d.producto?.nombre} x${d.cantidad} = C$ ${d.subtotal.toFixed(2)}`
    ).join('\n')

    const mensaje = `
🛒 *${negocio}*
📄 Factura: *${factura.numero}*
📅 ${new Date(factura.creadoEn).toLocaleString('es-NI')}
👤 Cliente: ${factura.cliente?.nombre || 'General'}

*Detalle:*
${productos}

─────────────────
Subtotal: C$ ${factura.subtotal.toFixed(2)}
IVA (15%): C$ ${factura.iva.toFixed(2)}
*TOTAL: C$ ${factura.total.toFixed(2)}*
─────────────────
Pagó con: C$ ${factura.pagoCon.toFixed(2)}
Cambio: C$ ${factura.cambio.toFixed(2)}
Método: ${factura.metodoPago}

${config?.mensajePie || '¡Gracias por su compra! 🙏'}
    `.trim()

    const url = `https://wa.me/?text=${encodeURIComponent(mensaje)}`
    window.open(url, '_blank')
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

  const hoy       = new Date().toDateString()
  const ventasHoy = facturas.filter(f => new Date(f.creadoEn).toDateString() === hoy)
  const totalHoy  = ventasHoy.reduce((sum, f) => sum + f.total, 0)

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
        <input type="text"
          placeholder="🔍 Buscar por número de factura o cliente..."
          value={buscando}
          onChange={e => setBuscando(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none'
          }}
        />
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['# Factura', 'Fecha', 'Cliente', 'Método', 'Total', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {facturasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No hay facturas aún
                </td>
              </tr>
            ) : (
              facturasFiltradas.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb' }}>{f.numero}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {formatearFecha(f.creadoEn)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                    {f.cliente?.nombre || <span style={{ color: '#94a3b8' }}>General</span>}
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
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#16a34a' }}>
                    C$ {f.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setFacturaVer(f)}
                        style={{
                          padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0',
                          background: 'white', cursor: 'pointer', fontSize: '13px'
                        }}>
                        👁️
                      </button>
                      <button onClick={() => { setFacturaVer(f); setTimeout(imprimirTicket, 300) }}
                        style={{
                          padding: '6px 10px', borderRadius: '6px', border: '1px solid #dbeafe',
                          background: '#dbeafe', cursor: 'pointer', fontSize: '13px', color: '#2563eb', fontWeight: 600
                        }}>
                        🖨️
                      </button>
                      <button onClick={() => compartirWhatsApp(f)}
                        style={{
                          padding: '6px 10px', borderRadius: '6px', border: '1px solid #dcfce7',
                          background: '#dcfce7', cursor: 'pointer', fontSize: '13px', color: '#16a34a', fontWeight: 600
                        }}>
                        📱
                      </button>
                    </div>
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
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>

            {/* Botones de acción */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Vista previa del ticket</h2>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={imprimirTicket}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: '#2563eb', color: 'white', cursor: 'pointer', fontWeight: 600
                  }}>
                  🖨️ Imprimir / PDF
                </button>
                <button onClick={() => compartirWhatsApp(facturaVer)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: 'none',
                    background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600
                  }}>
                  📱 WhatsApp
                </button>
                <button onClick={() => setFacturaVer(null)}
                  style={{
                    padding: '8px 16px', borderRadius: '8px', border: '1px solid #e2e8f0',
                    background: 'white', cursor: 'pointer', fontWeight: 600
                  }}>
                  ✕ Cerrar
                </button>
              </div>
            </div>

            {/* Ticket preview */}
            <div style={{
              border: '2px dashed #e2e8f0', borderRadius: '8px',
              padding: '16px', background: '#f8fafc', display: 'inline-block'
            }}>
              <FacturaRecibo ref={reciboRef} factura={facturaVer} config={config} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}