'use client'
import { useState, useEffect } from 'react'

// ─── COMPONENTE PRINCIPAL DEL POS ───────────────────────────────
export default function POS() {
  const [productos, setProductos]     = useState([])
  const [categorias, setCategorias]   = useState([])
  const [carrito, setCarrito]         = useState([])
  const [buscar, setBuscar]           = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [pagoCon, setPagoCon]         = useState('')
  const [metodoPago, setMetodoPago]   = useState('efectivo')
  const [cargando, setCargando]       = useState(false)
  const [facturaExitosa, setFacturaExitosa] = useState(null)

  // Al cargar la página, traemos productos y categorías
  useEffect(() => {
    cargarProductos()
    cargarCategorias()
  }, [])

  // Cada vez que cambia la búsqueda o categoría, filtramos
  useEffect(() => {
    cargarProductos()
  }, [buscar, categoriaActiva])

  async function cargarProductos() {
    let url = '/api/productos?'
    if (buscar)         url += `buscar=${buscar}&`
    if (categoriaActiva) url += `categoriaId=${categoriaActiva}`
    const res = await fetch(url)
    const data = await res.json()
    setProductos(data)
  }

  async function cargarCategorias() {
    const res = await fetch('/api/categorias')
    const data = await res.json()
    setCategorias(data)
  }

  // ── Agregar producto al carrito ──────────────────────────────
  function agregarAlCarrito(producto) {
    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id)
      if (existe) {
        // Si ya está, aumentamos la cantidad
        return prev.map(item =>
          item.id === producto.id
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      // Si no está, lo agregamos con cantidad 1
      return [...prev, { ...producto, cantidad: 1 }]
    })
  }

  function cambiarCantidad(id, nuevaCantidad) {
    if (nuevaCantidad < 1) return eliminarDelCarrito(id)
    setCarrito(prev =>
      prev.map(item => item.id === id ? { ...item, cantidad: nuevaCantidad } : item)
    )
  }

  function eliminarDelCarrito(id) {
    setCarrito(prev => prev.filter(item => item.id !== id))
  }

  function limpiarCarrito() {
    setCarrito([])
    setPagoCon('')
    setFacturaExitosa(null)
  }

  // ── Cálculos del carrito ─────────────────────────────────────
  const subtotal  = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
  const iva       = subtotal * 0.15
  const total     = subtotal + iva
  const cambio    = parseFloat(pagoCon || 0) - total

  // ── Procesar venta ───────────────────────────────────────────
  async function procesarVenta() {
    if (carrito.length === 0) return alert('Agregá productos al carrito')
    if (metodoPago === 'efectivo' && parseFloat(pagoCon || 0) < total) {
      return alert('El pago es menor al total')
    }

    setCargando(true)
    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subtotal,
          iva,
          total,
          pagoCon: parseFloat(pagoCon || total),
          cambio: Math.max(0, cambio),
          metodoPago,
          detalles: carrito.map(item => ({
            productoId: item.id,
            cantidad: item.cantidad,
            precio: item.precio,
            subtotal: item.precio * item.cantidad
          }))
        })
      })
      const factura = await res.json()
      setFacturaExitosa(factura)
      setCarrito([])
      setPagoCon('')
      cargarProductos() // Actualizamos el stock
    } catch (error) {
      alert('Error al procesar la venta')
    }
    setCargando(false)
  }

  // ────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 48px)' }}>

      {/* ── PANEL IZQUIERDO: Productos ─────────────────────── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Barra de búsqueda */}
        <div className="card" style={{ padding: '16px' }}>
          <input
            type="text"
            placeholder="🔍 Buscar producto..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '8px',
              border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none'
            }}
          />

          {/* Filtro por categorías */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCategoriaActiva(null)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                background: !categoriaActiva ? '#16a34a' : '#f1f5f9',
                color: !categoriaActiva ? 'white' : '#475569'
              }}>
              Todos
            </button>
            {categorias.map(cat => (
              <button key={cat.id}
                onClick={() => setCategoriaActiva(cat.id)}
                style={{
                  padding: '6px 14px', borderRadius: '20px', border: 'none',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                  background: categoriaActiva === cat.id ? '#16a34a' : '#f1f5f9',
                  color: categoriaActiva === cat.id ? 'white' : '#475569'
                }}>
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

        {/* Grid de productos */}
        <div style={{
          flex: 1, overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))',
          gap: '12px', alignContent: 'start'
        }}>
          {productos.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <div style={{ fontSize: '48px' }}>📦</div>
              <p>No hay productos aún</p>
              <p style={{ fontSize: '13px' }}>Agregá productos desde el módulo Productos</p>
            </div>
          ) : (
            productos.map(producto => (
              <button key={producto.id}
                onClick={() => agregarAlCarrito(producto)}
                disabled={producto.stock === 0}
                style={{
                  background: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '12px', padding: '16px 12px',
                  cursor: producto.stock === 0 ? 'not-allowed' : 'pointer',
                  textAlign: 'center', transition: 'all 0.2s',
                  opacity: producto.stock === 0 ? 0.5 : 1,
                }}>
                <div style={{ fontSize: '32px', marginBottom: '8px' }}>
                  {producto.categoria?.nombre === 'Ropa' ? '👕' :
                   producto.categoria?.nombre === 'Bebidas' ? '🥤' :
                   producto.categoria?.nombre === 'Granos básicos' ? '🌾' :
                   producto.categoria?.nombre === 'Chivería' ? '🍬' : '🛍️'}
                </div>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#1e293b', marginBottom: '4px' }}>
                  {producto.nombre}
                </div>
                <div style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a' }}>
                  C$ {producto.precio.toFixed(2)}
                </div>
                <div style={{
                  fontSize: '11px', marginTop: '4px',
                  color: producto.stock <= producto.stockMinimo ? '#dc2626' : '#64748b'
                }}>
                  Stock: {producto.stock}
                  {producto.stock <= producto.stockMinimo && ' ⚠️'}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* ── PANEL DERECHO: Carrito y cobro ────────────────────── */}
      <div className="card" style={{
        width: '340px', display: 'flex', flexDirection: 'column',
        gap: '12px', padding: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: '#1e293b' }}>
          🧾 Carrito de venta
        </h2>

        {/* Lista del carrito */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px' }}>🛒</div>
              <p style={{ fontSize: '14px' }}>Tocá un producto para agregarlo</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={item.id} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 0', borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>C$ {item.precio.toFixed(2)}</div>
                </div>
                {/* Controles de cantidad */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => cambiarCantidad(item.id, item.cantidad - 1)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}>
                    −
                  </button>
                  <span style={{ fontSize: '14px', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                    {item.cantidad}
                  </span>
                  <button onClick={() => cambiarCantidad(item.id, item.cantidad + 1)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}>
                    +
                  </button>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>
                  C$ {(item.precio * item.cantidad).toFixed(2)}
                </div>
                <button onClick={() => eliminarDelCarrito(item.id)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px' }}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>

        {/* Totales */}
        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>Subtotal</span>
            <span>C$ {subtotal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
            <span style={{ color: '#64748b' }}>IVA (15%)</span>
            <span>C$ {iva.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>
            <span>TOTAL</span>
            <span>C$ {total.toFixed(2)}</span>
          </div>
        </div>

        {/* Método de pago */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {['efectivo', 'tarjeta', 'transferencia'].map(m => (
            <button key={m} onClick={() => setMetodoPago(m)}
              style={{
                flex: 1, padding: '8px', borderRadius: '8px', border: '2px solid',
                borderColor: metodoPago === m ? '#16a34a' : '#e2e8f0',
                background: metodoPago === m ? '#dcfce7' : 'white',
                color: metodoPago === m ? '#16a34a' : '#64748b',
                cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                textTransform: 'capitalize'
              }}>
              {m === 'efectivo' ? '💵' : m === 'tarjeta' ? '💳' : '📱'} {m}
            </button>
          ))}
        </div>

        {/* Pago con / Cambio */}
        {metodoPago === 'efectivo' && (
          <div>
            <label style={{ fontSize: '13px', color: '#64748b', fontWeight: 600 }}>
              Pago con (C$)
            </label>
            <input
              type="number"
              value={pagoCon}
              onChange={e => setPagoCon(e.target.value)}
              placeholder="0.00"
              style={{
                width: '100%', padding: '10px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '16px',
                marginTop: '4px', outline: 'none'
              }}
            />
            {pagoCon && cambio >= 0 && (
              <div style={{
                marginTop: '8px', padding: '10px', borderRadius: '8px',
                background: '#dcfce7', color: '#16a34a', fontWeight: 700,
                fontSize: '16px', textAlign: 'center'
              }}>
                Cambio: C$ {cambio.toFixed(2)}
              </div>
            )}
          </div>
        )}

        {/* Botones de acción */}
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={limpiarCarrito}
            style={{
              flex: 1, padding: '12px', borderRadius: '8px',
              border: '1px solid #e2e8f0', background: 'white',
              cursor: 'pointer', fontWeight: 600, color: '#dc2626'
            }}>
            🗑️ Limpiar
          </button>
          <button onClick={procesarVenta} disabled={cargando || carrito.length === 0}
            className="btn-verde"
            style={{ flex: 2, padding: '12px', fontSize: '15px' }}>
            {cargando ? '⏳ Procesando...' : '✅ Cobrar'}
          </button>
        </div>

        {/* Factura exitosa */}
        {facturaExitosa && (
          <div style={{
            padding: '16px', borderRadius: '10px',
            background: '#dcfce7', border: '1px solid #16a34a',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px' }}>🎉</div>
            <div style={{ fontWeight: 700, color: '#16a34a' }}>
              ¡Venta exitosa!
            </div>
            <div style={{ fontSize: '13px', color: '#15803d' }}>
              Factura: {facturaExitosa.numero}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}