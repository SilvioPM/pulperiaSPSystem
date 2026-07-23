'use client'
import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import ProformaRecibo from '../components/ProformaRecibo'
import ProformaCarta from '../components/ProformaCarta'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'
import * as Icons from 'lucide-react'

export default function Proformas() {
  const [proformas, setProformas]       = useState([])
  const [productos, setProductos]       = useState([])
  const [clientes, setClientes]         = useState([])
  const [categorias, setCategorias]     = useState([])
  const [config, setConfig]             = useState({})
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [proformaVer, setProformaVer]   = useState(null)
  const [convirtiendo, setConvirtiendo] = useState(false)
  const [buscar, setBuscar]             = useState('')
  const [buscarProd, setBuscarProd]     = useState('')
  const cartaRef = useRef(null)
  const { toast, mostrar, cerrar } = useToast()

  // Carrito de la proforma
  const [carrito, setCarrito]           = useState([])
  const [clienteId, setClienteId]       = useState('')
  const [nota, setNota]                 = useState('')
  const [validoHasta, setValidoHasta]   = useState('')

  const [cargando, setCargando] = useState(true)
  const reciboRef = useRef(null)

  useEffect(() => {
    cargarTodo().finally(() => setCargando(false))
  }, [])

  async function cargarTodo() {
    try {
      const [pRes, clRes, catRes, configRes, proRes] = await Promise.all([
        fetch('/api/productos'),
        fetch('/api/clientes'),
        fetch('/api/categorias'),
        fetch('/api/config'),
        fetch('/api/proformas')
      ])
      const [p, cl, cat, cfg, pro] = await Promise.all([
        pRes.json(), clRes.json(), catRes.json(), configRes.json(), proRes.json()
      ])
      setProductos(Array.isArray(p) ? p : (p.data || []))
      setClientes(Array.isArray(cl) ? cl : (cl.data || []))
      setCategorias(Array.isArray(cat) ? cat : [])
      setConfig(cfg || {})
      setProformas(Array.isArray(pro) ? pro : (Array.isArray(pro?.data) ? pro.data : []))
    } catch {
      setProformas([])
    }
  }

  const imprimirProforma = useReactToPrint({
    contentRef: reciboRef,
    documentTitle: proformaVer?.numero || 'Proforma',
  })

  function agregarProducto(producto) {
    setCarrito(prev => {
      const existe = prev.find(i => i.productoId === producto.id)
      if (existe) {
        return prev.map(i => i.productoId === producto.id
          ? { ...i, cantidad: i.cantidad + 1, subtotal: (i.cantidad + 1) * i.precio }
          : i
        )
      }
      return [...prev, {
        productoId: producto.id,
        nombre:     producto.nombre,
        precio:     producto.precio,
        cantidad:   1,
        subtotal:   producto.precio
      }]
    })
  }
  

  const imprimirCarta = useReactToPrint({
  contentRef: cartaRef,
  documentTitle: proformaVer?.numero || 'Proforma',
 })

  function cambiarCantidad(productoId, cantidad) {
    const val = parseFloat(cantidad)
    if (!val || val <= 0) {
      setCarrito(prev => prev.filter(i => i.productoId !== productoId))
      return
    }
    setCarrito(prev => prev.map(i => i.productoId === productoId
      ? { ...i, cantidad: val, subtotal: val * i.precio }
      : i
    ))
  }

  function cambiarPrecio(productoId, precio) {
    const val = parseFloat(precio) || 0
    setCarrito(prev => prev.map(i => i.productoId === productoId
      ? { ...i, precio: val, subtotal: i.cantidad * val }
      : i
    ))
  }

  const subtotal = carrito.reduce((sum, i) => sum + i.subtotal, 0)
  const ivaActivo = config?.ivaActivo === 'true'
  const tasaIva  = parseFloat(config?.tasaIva || 0)
  const iva      = ivaActivo ? subtotal * tasaIva : 0
  const total    = subtotal + iva

  async function guardarProforma() {
  if (carrito.length === 0) return mostrar('Agregá productos a la proforma', 'alerta')

  try {
    const res  = await fetch('/api/proformas', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clienteId:   clienteId ? parseInt(clienteId) : null,
        subtotal, iva, total, nota,
        validoHasta: validoHasta || null,
        detalles: carrito.map(item => ({
          productoId: item.productoId,
          cantidad:   item.cantidad,
          precio:     item.precio,
          subtotal:   item.subtotal
        }))
      })
    })
    const data = await res.json()
    if (!res.ok) {
      mostrar(`Error: ${data.error}`, 'error')
      return
    }
    setMostrarForm(false)
    setCarrito([])
    setClienteId('')
    setNota('')
    setValidoHasta('')
    cargarTodo()
    mostrar(`Proforma ${data.numero} guardada exitosamente`, 'exito')
    setProformaVer(data)
    setTimeout(() => imprimirProforma(), 500)
  } catch (error) {
    mostrar(`Error al guardar proforma: ${error.message}`, 'error')
  }
}

  async function convertirAFactura(proforma) {
    mostrar(`Convirtiendo ${proforma.numero} a factura...`, 'info')
    setConvirtiendo(true)
    try {
      const res  = await fetch(`/api/proformas/${proforma.id}`, { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        mostrar(`Factura ${data.numero} creada desde proforma`, 'exito')
        setProformaVer(null)
        cargarTodo()
      } else {
        mostrar(data.error, 'error')
      }
    } catch {
      mostrar('Error al convertir proforma', 'error')
    }
    setConvirtiendo(false)
  }

  async function cambiarEstado(id, estado) {
    try {
      await fetch(`/api/proformas/${id}`, {
        method:  'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ estado })
      })
      cargarTodo()
    } catch {
      mostrar('Error al actualizar estado', 'error')
    }
  }

  async function eliminarProforma(id) {
    mostrar('Eliminando proforma...', 'info')
    try {
      await fetch(`/api/proformas/${id}`, { method: 'DELETE' })
      cargarTodo()
      mostrar('Proforma eliminada', 'exito')
    } catch {
      mostrar('Error al eliminar proforma', 'error')
    }
  }

  function compartirWhatsApp(proforma) {
    const productos = proforma.detalles?.map(d =>
      `  • ${d.producto?.nombre} x${d.cantidad} = C$ ${d.subtotal.toFixed(2)}`
    ).join('\n')

    const msg = `
🧾 *PROFORMA ${proforma.numero}*
📅 ${new Date(proforma.creadoEn).toLocaleDateString('es-NI')}
👤 Cliente: ${proforma.cliente?.nombre || 'General'}
${proforma.validoHasta ? `⏳ Válido hasta: ${new Date(proforma.validoHasta).toLocaleDateString('es-NI')}` : ''}

*Detalle:*
${productos}

─────────────────
*TOTAL: C$ ${proforma.total.toFixed(2)}*
─────────────────
${proforma.nota ? `📝 Nota: ${proforma.nota}` : ''}

_Esta es una cotización, no una factura oficial._
    `.trim()

    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  function colorEstado(estado) {
    const colores = {
      pendiente: { bg: '#fef9c3', color: '#ca8a04' },
      aprobada:  { bg: '#dcfce7', color: '#16a34a' },
      rechazada: { bg: '#fee2e2', color: '#dc2626' }
    }
    return colores[estado] || colores.pendiente
  }

  const proformasFiltradas = proformas.filter(p =>
    p.numero.toLowerCase().includes(buscar.toLowerCase()) ||
    p.cliente?.nombre?.toLowerCase().includes(buscar.toLowerCase())
  )

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>

  return (
    <div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}><Icons.FileEdit size={24} /> Proformas / Cotizaciones</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{proformas.length} proformas registradas</p>
        </div>
        <button className="btn-verde" onClick={() => setMostrarForm(true)}>
          + Nueva Proforma
        </button>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Pendientes', valor: proformas.filter(p => p.estado === 'pendiente').length, color: '#ca8a04' },
          { label: 'Aprobadas',  valor: proformas.filter(p => p.estado === 'aprobada').length,  color: '#16a34a' },
          { label: 'Rechazadas', valor: proformas.filter(p => p.estado === 'rechazada').length, color: '#dc2626' },
        ].map(item => (
          <div key={item.label} className="card" style={{ borderLeft: `4px solid ${item.color}` }}>
            <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>{item.label}</div>
            <div style={{ fontSize: '28px', fontWeight: 700, color: item.color }}>{item.valor}</div>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Search size={16} color="#94a3b8" />
          <input type="text"
            placeholder="Buscar por número o cliente..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
          />
        </div>
      </div>

      {/* Tabla */}
      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['# Proforma', 'Fecha', 'Cliente', 'Total', 'Válido hasta', 'Estado', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {proformasFiltradas.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <Icons.FileText size={40} style={{ margin: '0 auto 8px', opacity: 0.4, display: 'block' }} />
                  No hay proformas aún
                </td>
              </tr>
            ) : (
              proformasFiltradas.map((p, i) => {
                const { bg, color } = colorEstado(p.estado)
                return (
                  <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#7c3aed' }}>{p.numero}</td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                      {new Date(p.creadoEn).toLocaleDateString('es-NI')}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '14px' }}>
                      {p.cliente?.nombre || <span style={{ color: '#94a3b8' }}>General</span>}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: '#16a34a' }}>
                      C$ {p.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                      {p.validoHasta
                        ? new Date(p.validoHasta).toLocaleDateString('es-NI')
                        : <span style={{ color: '#cbd5e1' }}>—</span>
                      }
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700, background: bg, color }}>
                        {p.estado}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => setProformaVer(p)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '13px', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icons.Eye size={16} />
                        </button>
                        <button onClick={() => compartirWhatsApp(p)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #dcfce7', background: '#dcfce7', cursor: 'pointer', fontSize: '13px', color: '#16a34a', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icons.Smartphone size={16} />
                        </button>
                        {p.estado === 'pendiente' && (
                          <button onClick={() => convertirAFactura(p)} disabled={convirtiendo}
                            style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', background: '#7c3aed', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                            <Icons.FileText size={16} /> Facturar
                          </button>
                        )}
                        <button onClick={() => eliminarProforma(p.id)}
                          style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fee2e2', cursor: 'pointer', fontSize: '13px', color: '#dc2626', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                          <Icons.Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nueva proforma */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '900px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', gap: '20px' }}>

            {/* Panel izquierdo — productos */}
            <div style={{ flex: 1 }}>
              <h3 style={{ fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}><Icons.Package size={20} /> Seleccioná productos</h3>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: '12px' }}>
                <Icons.Search size={14} color="#94a3b8" />
              <input type="text" placeholder="Buscar..." value={buscarProd} onChange={e => setBuscarProd(e.target.value)}
                style={{ flex: 1, padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none' }}
              />
              </div>
              <div style={{ maxHeight: '400px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                {productos.filter(p => !buscarProd || p.nombre?.toLowerCase().includes(buscarProd.toLowerCase())).map(p => (
                  <div key={p.id} onClick={() => agregarProducto(p)}
                    style={{ padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', background: 'white' }}>
                    <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.nombre}</div>
                    <div style={{ fontSize: '12px', color: '#16a34a', fontWeight: 700 }}>C$ {p.precio?.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Panel derecho — detalle */}
            <div style={{ width: '340px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icons.FileText size={18} /> Detalle</h3>
                <button onClick={() => { setMostrarForm(false); setCarrito([]) }}
                  style={{ width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontSize: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>

              {/* Cliente */}
              <select value={clienteId} onChange={e => setClienteId(e.target.value)}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                <option value="">Cliente general</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>

              {/* Válido hasta */}
              <div>
                <label style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>Válido hasta (opcional)</label>
                <input type="date" value={validoHasta}
                  onChange={e => setValidoHasta(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', marginTop: '4px', outline: 'none' }}
                />
              </div>

              {/* Lista carrito */}
              <div style={{ flex: 1, maxHeight: '280px', overflowY: 'auto' }}>
                {carrito.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                    Tocá un producto para agregarlo
                  </div>
                ) : (
                  carrito.map(item => (
                    <div key={item.productoId} style={{ padding: '8px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, marginBottom: '4px' }}>{item.nombre}</div>
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input type="number" value={item.cantidad} min="0.5" step="0.5"
                          onChange={e => cambiarCantidad(item.productoId, e.target.value)}
                          style={{ width: '60px', padding: '4px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                        />
                        <span style={{ fontSize: '12px', color: '#64748b' }}>×</span>
                        <input type="number" value={item.precio} step="0.01"
                          onChange={e => cambiarPrecio(item.productoId, e.target.value)}
                          style={{ width: '80px', padding: '4px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                        />
                        <span style={{ fontSize: '13px', fontWeight: 700, marginLeft: 'auto' }}>
                          C$ {item.subtotal.toFixed(2)}
                        </span>
                        <button onClick={() => setCarrito(prev => prev.filter(i => i.productoId !== item.productoId))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626' }}>✕</button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totales */}
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                  <span style={{ color: '#64748b' }}>Subtotal</span>
                  <span>C$ {subtotal.toFixed(2)}</span>
                </div>
                {iva > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '4px' }}>
                    <span style={{ color: '#64748b' }}>IVA ({(tasaIva * 100).toFixed(0)}%)</span>
                    <span>C$ {iva.toFixed(2)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>
                  <span>TOTAL</span>
                  <span>C$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Nota */}
              <input value={nota} onChange={e => setNota(e.target.value)}
                placeholder="Nota u observaciones..."
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
              />

              <button onClick={guardarProforma} disabled={carrito.length === 0}
                style={{
                  width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
                  background: '#7c3aed', color: 'white', cursor: 'pointer',
                  fontWeight: 700, fontSize: '15px'
                }}>
                <Icons.Save size={16} /> Guardar Proforma
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ver proforma */}
      {proformaVer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '90vw', maxWidth: '750px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#7c3aed' }}>{proformaVer.numero}</h2>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                <button onClick={imprimirProforma}
  style={{
    padding: '8px 14px', borderRadius: '8px', border: 'none',
    background: '#dbeafe', color: '#2563eb',
    cursor: 'pointer', fontWeight: 600, fontSize: '13px',
    display: 'inline-flex', alignItems: 'center', gap: 6
  }}>
  <Icons.Printer size={16} /> Ticket 80mm
</button>
<button onClick={imprimirCarta}
  style={{
    padding: '8px 14px', borderRadius: '8px', border: 'none',
    background: '#f3e8ff', color: '#7c3aed',
    cursor: 'pointer', fontWeight: 600, fontSize: '13px',
    display: 'inline-flex', alignItems: 'center', gap: 6
  }}>
  <Icons.File size={16} /> Carta / PDF
</button>
                <button onClick={() => compartirWhatsApp(proformaVer)}
                  style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  <Icons.Smartphone size={16} /> WhatsApp
                </button>
                {proformaVer.estado === 'pendiente' && (
                  <button onClick={() => convertirAFactura(proformaVer)} disabled={convirtiendo}
                    style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', background: '#7c3aed', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
                    <Icons.FileText size={16} /> Convertir a Factura
                  </button>
                )}
                <button onClick={() => setProformaVer(null)}
                  style={{ marginLeft: 4, width: 32, height: 32, borderRadius: '50%', border: 'none', background: '#f1f5f9', color: '#64748b', cursor: 'pointer', fontSize: '16px', fontWeight: 700, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>✕</button>
              </div>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Cliente:</strong> {proformaVer.cliente?.nombre || 'General'}</div>
              <div><strong>Fecha:</strong> {new Date(proformaVer.creadoEn).toLocaleDateString('es-NI')}</div>
              {proformaVer.validoHasta && (
                <div><strong>Válido hasta:</strong> {new Date(proformaVer.validoHasta).toLocaleDateString('es-NI')}</div>
              )}
              {proformaVer.nota && <div><strong>Nota:</strong> {proformaVer.nota}</div>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Producto', 'Cant', 'Precio', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {proformaVer.detalles?.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontSize: '13px' }}>{d.producto?.nombre}</td>
                    <td style={{ padding: '8px', fontSize: '13px' }}>{d.cantidad}</td>
                    <td style={{ padding: '8px', fontSize: '13px' }}>C$ {d.precio.toFixed(2)}</td>
                    <td style={{ padding: '8px', fontSize: '13px', fontWeight: 600 }}>C$ {d.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
              {(proformaVer.iva || 0) > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                  <span style={{ color: '#64748b' }}>IVA</span>
                  <span>C$ {(proformaVer.iva || 0).toFixed(2)}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700, color: '#7c3aed' }}>
                <span>TOTAL</span>
                <span>C$ {proformaVer.total.toFixed(2)}</span>
              </div>
            </div>

            {/* Cambiar estado */}
            {proformaVer.estado === 'pendiente' && (
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button onClick={() => { cambiarEstado(proformaVer.id, 'aprobada'); setProformaVer(null) }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontWeight: 700 }}>
                  <Icons.CheckCircle size={16} /> Aprobar
                </button>
                <button onClick={() => { cambiarEstado(proformaVer.id, 'rechazada'); setProformaVer(null) }}
                  style={{ flex: 1, padding: '10px', borderRadius: '8px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontWeight: 700 }}>
                  <Icons.XCircle size={16} /> Rechazar
                </button>
              </div>
            )}
          </div>
        </div>
      )}
      {/* Recibo oculto para impresión */}
      <div style={{ display: 'none' }}>
        <ProformaRecibo ref={reciboRef} proforma={proformaVer} config={config} />
        <ProformaCarta  ref={cartaRef}  proforma={proformaVer} config={config} />
      </div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}