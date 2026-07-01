'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useReactToPrint } from 'react-to-print'
import { useAuth } from '@/app/context/AuthContext'
import FacturaRecibo from '../components/FacturaRecibo'

export default function POS() {
  const { user } = useAuth()
  const [productos, setProductos]     = useState([])
  const [categorias, setCategorias]   = useState([])
  const [carrito, setCarrito]         = useState([])
  const [buscar, setBuscar]           = useState('')
  const [categoriaActiva, setCategoriaActiva] = useState(null)
  const [pagoCon, setPagoCon]         = useState('')
  const [metodoPago, setMetodoPago]   = useState('efectivo')
  const [metodosPago, setMetodosPago] = useState([{ metodo: 'efectivo', monto: '' }])
  const [cargando, setCargando]       = useState(false)
  const [facturaExitosa, setFacturaExitosa] = useState(null)
  const [clienteSeleccionado, setClienteSeleccionado] = useState(null)
  const [clientes, setClientes]                       = useState([])
  const [buscarCliente, setBuscarCliente]             = useState('')
  const [mostrarClientes, setMostrarClientes]         = useState(false)
  const [config, setConfig]                           = useState({})
  const [descuento, setDescuento]                     = useState('')
  const [descPorc, setDescPorc]                       = useState(false)
  const [esCredito, setEsCredito]                     = useState(false)
  const [fechaVencimiento, setFechaVencimiento]         = useState('')
  const [parkedSessions, setParkedSessions]           = useState([])
  const [mostrarParked, setMostrarParked]             = useState(false)
  const [nombreParked, setNombreParked]               = useState('')
  const [presentacionSel, setPresentacionSel]         = useState({})
  const [errorCaja, setErrorCaja]                     = useState(false)
  const [mostrarFormCliente, setMostrarFormCliente]   = useState(false)
  const [nuevoCliente, setNuevoCliente]               = useState({ nombre: '', telefono: '', direccion: '' })

  const reciboRef = useRef(null)
  const imprimirTicket = useReactToPrint({
    contentRef: reciboRef,
    documentTitle: 'Recibo',
  })

  useEffect(() => {
    cargarCategorias()
    cargarClientes()
    cargarConfig()
    cargarParked()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    cargarProductos()
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [buscar, categoriaActiva])

  const barcodeBuf = useRef('')
  const barcodeTimer = useRef(null)
  const barcodeRef = useRef(null)

  const buscarProducto = useCallback(async (codigo) => {
    try {
      const res = await fetch(`/api/productos?buscar=${encodeURIComponent(codigo)}`)
      const data = await res.json()
      const productos = data.data || data || []
      const prod = productos.find(p => p.codigo === codigo) || productos[0]
      if (prod) {
        agregarAlCarrito(prod)
      } else {
        console.warn(`Producto con código "${codigo}" no encontrado`)
      }
    } catch (e) {
      console.error('Error buscando producto:', e)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') return
      if (e.key === 'Enter') {
        if (barcodeBuf.current.length >= 3) {
          e.preventDefault()
          buscarProducto(barcodeBuf.current)
          barcodeBuf.current = ''
        }
        if (barcodeTimer.current) { clearTimeout(barcodeTimer.current); barcodeTimer.current = null }
        return
      }
      if (e.key.length === 1) {
        barcodeBuf.current += e.key
        if (barcodeTimer.current) clearTimeout(barcodeTimer.current)
        barcodeTimer.current = setTimeout(() => { barcodeBuf.current = '' }, 100)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [buscarProducto])

  const searchRef = useRef(null)
  const pagoRef = useRef(null)
  const procesarRef = useRef(null)
  procesarRef.current = procesarVenta
  const carritoRef = useRef(null)
  carritoRef.current = carrito

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
        if (e.key === 'Escape') { e.target.blur(); return }
        return
      }
      switch (e.key) {
        case 'F1': e.preventDefault(); searchRef.current?.focus(); break
        case 'F2': e.preventDefault(); pagoRef.current?.focus(); break
        case 'F3': e.preventDefault(); if (carritoRef.current?.length > 0) procesarRef.current?.(); break
        case 'Escape': e.preventDefault(); if (carritoRef.current?.length > 0 && confirm('¿Limpiar carrito?')) { setCarrito([]); setPagoCon(''); setDescuento(''); setDescPorc(false) }; break
        case 'F4': e.preventDefault(); document.getElementById('campo-descuento')?.focus(); break
        case 'F5': e.preventDefault(); setMostrarClientes(true); break
        case 'F8': e.preventDefault(); if (carritoRef.current?.length > 0) setMostrarParked(true); break
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  async function cargarProductos() {
    let url = '/api/productos?'
    if (buscar)         url += `buscar=${buscar}&`
    if (categoriaActiva) url += `categoriaId=${categoriaActiva}`
    const res = await fetch(url)
    const data = await res.json()
    setProductos(data.data || data || [])
  }

  async function cargarCategorias() {
    const res = await fetch('/api/categorias')
    const data = await res.json()
    setCategorias(data)
  }
  async function cargarClientes() {
    const res  = await fetch('/api/clientes')
    const data = await res.json()
    setClientes(data.data || data || [])
  }

  async function cargarConfig() {
    try { const res = await fetch('/api/config'); const data = await res.json(); setConfig(data) } catch (e) { console.error('Error cargando config:', e) }
  }

  async function cargarParked() {
    try { const res = await fetch('/api/cart-sessions'); const data = await res.json(); setParkedSessions(Array.isArray(data) ? data : []) } catch (e) { console.error('Error cargando parked:', e) }
  }

  function agregarAlCarrito(producto) {
    setFacturaExitosa(null)
    const pres = presentacionSel[producto.id] || 'base'
    const esVenta2 = pres === 'venta2' && producto.unidadVenta2
    const precioUsado = esVenta2 ? producto.precioVenta2 : producto.precio
    const factorConv = esVenta2 ? (producto.factorVenta2 || 1) : 1
    const unidadVenta = esVenta2 ? producto.unidadVenta2 : producto.unidad

    const cantidadActual = carrito.reduce((sum, item) =>
      item.id === producto.id && item._pres === pres ? sum + item.cantidad : sum, 0
    )
    const stockRequerido = (cantidadActual + 1) * factorConv
    if (producto.stock < stockRequerido) {
      return alert(`Stock insuficiente. Disponible: ${producto.stock} ${producto.unidad}, necesitas ${stockRequerido} ${producto.unidad}`)
    }

    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id && item._pres === pres)
      if (existe) {
        return prev.map(item =>
          item.id === producto.id && item._pres === pres
            ? { ...item, cantidad: item.cantidad + 1 }
            : item
        )
      }
      return [...prev, { ...producto, cantidad: 1, _pres: pres, precio: precioUsado, unidadVenta, factorConversion: factorConv }]
    })
  }

  function cambiarCantidad(id, nuevaCantidad) {
    if (nuevaCantidad <= 0) return eliminarDelCarrito(id)
    const item = carrito.find(i => i.id === id)
    if (item) {
      const stockReq = nuevaCantidad * (item.factorConversion || 1)
      if (item.stock !== undefined && item.stock < stockReq) {
        return alert(`Stock insuficiente. Disponible: ${item.stock} ${item.unidad}, necesitas ${stockReq} ${item.unidad}`)
      }
    }
    setCarrito(prev =>
      prev.map(item => item.id === id ? { ...item, cantidad: nuevaCantidad } : item)
    )
  }

  function eliminarDelCarrito(id, pres = 'base') {
    setCarrito(prev => prev.filter(item => !(item.id === id && (item._pres || 'base') === pres)))
  }

  function limpiarCarrito() {
    setCarrito([])
    setPagoCon('')
    setFacturaExitosa(null)
    setClienteSeleccionado(null)
    setBuscarCliente('')
  }

  const subtotal  = carrito.reduce((sum, item) => sum + (item.precio * item.cantidad), 0)
  const descVal   = parseFloat(descuento || 0)
  const desc      = descPorc ? (subtotal * descVal) / 100 : descVal
  const ivaActivo = config.ivaActivo === 'true'
  const porcIva   = parseFloat(config.tasaIva || 15)
  const iva       = ivaActivo ? (subtotal - desc) * (porcIva / 100) : 0
  const total     = subtotal - desc + iva
  const tasaCambio      = parseFloat(config.tasaCambio || 0) || 0
  const pagoConCordobas  = metodoPago === 'dolares' ? parseFloat(pagoCon || 0) * tasaCambio : parseFloat(pagoCon || 0)
  const cambio           = pagoConCordobas - total

  async function procesarVenta() {
    if (carrito.length === 0) return alert('Agregá productos al carrito')
    if (esCredito && !clienteSeleccionado) return alert('Seleccioná un cliente para venta al crédito')
    if (metodosPago.length > 1) {
      const totalPagado = metodosPago.reduce((sum, p) => {
        if (p.metodo === 'dolares') return sum + (parseFloat(p.monto || 0) * tasaCambio)
        return sum + parseFloat(p.monto || 0)
      }, 0)
      if (totalPagado < total) return alert('El total del pago mixto es menor al total de la venta')
    } else if (!esCredito) {
      if (metodoPago === 'efectivo' && parseFloat(pagoCon || 0) < total) {
        return alert('El pago es menor al total')
      }
      if (metodoPago === 'dolares') {
        if (!tasaCambio || tasaCambio <= 0) return alert('Configurá la tasa de cambio en ⚙️ Configuración antes de cobrar en dólares')
        const enCordobas = parseFloat(pagoCon || 0) * tasaCambio
        if (enCordobas < total) return alert('El pago en dólares es menor al total')
      }

    }
    const esVentaCredito = esCredito || metodoPago === 'credito'
    if (esVentaCredito && clienteSeleccionado?.limiteCredito > 0) {
      const res = await fetch(`/api/facturas?clienteId=${clienteSeleccionado.id}&estado=credito&page=1&limit=9999`)
      const data = await res.json()
      const facturas = data.data || data || []
      const pendiente = facturas.reduce((s, f) => s + (f.saldoPendiente || 0), 0)
      if (pendiente + total > clienteSeleccionado.limiteCredito) {
        setCargando(false)
        return alert(`❌ Límite de crédito excedido.\nDisponible: C$ ${Math.max(0, clienteSeleccionado.limiteCredito - pendiente).toFixed(2)}\nTotal venta: C$ ${total.toFixed(2)}`)
      }
    }

    for (const item of carrito) {
      const factor = item.factorConversion || 1
      const stockReq = item.cantidad * factor
      if (item.stock !== undefined && item.stock < stockReq) {
        setCargando(false)
        return alert(`Stock insuficiente para "${item.nombre}". Disponible: ${item.stock} ${item.unidad}, necesitas ${stockReq} ${item.unidad}`)
      }
    }

    setCargando(true)

    try {
      const rCaja = await fetch('/api/caja')
      const dCaja = await rCaja.json()
      if (!dCaja.actual) {
        setCargando(false)
        setErrorCaja(true)
        return
      }
    } catch {
      setCargando(false)
      setErrorCaja(true)
      return
    }

    try {
      const res = await fetch('/api/facturas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuario: user?.username || user?.nombre || 'desconocido',
          subtotal,
          iva,
          descuento: desc,
          total,
          pagoCon: metodosPago.length > 1
            ? metodosPago.reduce((s, p) => s + (p.metodo === 'dolares' ? parseFloat(p.monto || 0) * tasaCambio : (p.metodo === 'credito' ? 0 : parseFloat(p.monto || 0))), 0)
            : (metodoPago === 'dolares' ? pagoConCordobas : parseFloat(pagoCon || total)),
          pagoEnUsd: metodosPago.length > 1 ? metodosPago.filter(p => p.metodo === 'dolares').reduce((s, p) => s + parseFloat(p.monto || 0), 0) : (metodoPago === 'dolares' ? parseFloat(pagoCon || 0) : 0),
          cambio: Math.max(0, (metodosPago.length > 1 ? metodosPago.reduce((s, p) => s + (p.metodo === 'dolares' ? parseFloat(p.monto || 0) * tasaCambio : (p.metodo === 'credito' ? 0 : parseFloat(p.monto || 0))), 0) : pagoConCordobas) - total),
          clienteId: clienteSeleccionado?.id || null,
          metodoPago: metodosPago.length > 1 ? 'mixto' : (esVentaCredito ? 'credito' : metodoPago),
          esCredito: esVentaCredito,
          fechaVencimiento: esVentaCredito ? fechaVencimiento : null,
          detallesPago: metodosPago.length > 1 ? metodosPago.filter(p => parseFloat(p.monto || 0) > 0) : undefined,
          detalles: carrito.map(item => ({
            productoId: item.id,
            cantidad: item.cantidad,
            precio: item.precio,
            costo: item._pres === 'venta2' ? parseFloat(item.costoVenta2 || 0) || (item.costo || 0) * (item.factorConversion || 1) : (item.costo || 0),
            subtotal: item.precio * item.cantidad,
            unidadVenta: item.unidadVenta || item.unidad,
            factorConversion: item.factorConversion || 1
          }))
        })
      })
      const factura = await res.json()
      setFacturaExitosa(factura)
      setCarrito([])
      setPagoCon('')
      setDescuento('')
      setEsCredito(false)
      setFechaVencimiento('')
      setMetodosPago([{ metodo: 'efectivo', monto: '' }])
      cargarProductos()
      setTimeout(() => setFacturaExitosa(null), 6000)
      setTimeout(imprimirTicket, 300)
    } catch (error) {
      alert('Error al procesar la venta')
    }
    setCargando(false)
  }

  return (
    <>
      {errorCaja && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
          background: 'linear-gradient(135deg, #991b1b, #dc2626)',
          color: '#fff', textAlign: 'center', padding: '16px 20px',
          fontSize: '15px', fontWeight: 600,
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px'
        }}>
          <span style={{ fontSize: '24px' }}>⚠️</span>
          No hay caja abierta.
          <a href="/caja" style={{ color: '#fde68a', textDecoration: 'underline', fontWeight: 700, marginLeft: '4px' }}>
            Abrir caja →
          </a>
          <button onClick={() => setErrorCaja(false)}
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', fontSize: 16, lineHeight: '28px', padding: 0 }}>
            ✕
          </button>
        </div>
      )}
    <div style={{ display: 'flex', gap: '20px', height: 'calc(100vh - 48px)' }}>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>

        <div className="card" style={{ padding: '16px' }}>
          <input
            ref={searchRef}
            type="text"
            placeholder="🔍 Buscar producto..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            style={{
              width: '100%', padding: '10px 14px', borderRadius: '8px',
              border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none'
            }}
          />

          <div style={{ display: 'flex', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
            <button
              onClick={() => setCategoriaActiva(null)}
              style={{
                padding: '6px 14px', borderRadius: '20px', border: 'none',
                cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                background: !categoriaActiva ? '#16a34a' : '#f1f5f9',
                color: !categoriaActiva ? 'white' : 'var(--texto-secundario)'
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
                  color: categoriaActiva === cat.id ? 'white' : 'var(--texto-secundario)'
                }}>
                {cat.nombre}
              </button>
            ))}
          </div>
        </div>

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
            productos.map(producto => {
              const tieneVenta2 = producto.unidadVenta2 && producto.precioVenta2 > 0
              const presActual = presentacionSel[producto.id] || 'base'
              const precioMostrar = presActual === 'venta2' ? producto.precioVenta2 : producto.precio
              const unidadMostrar = presActual === 'venta2' ? producto.unidadVenta2 : producto.unidad
              const factorProd = presActual === 'venta2' ? (producto.factorVenta2 || 1) : 1
              const stockSuficiente = producto.stock >= factorProd
              return (
              <div key={producto.id} style={{
                background: 'white', border: '1px solid #e2e8f0',
                borderRadius: '12px', padding: '12px',
                textAlign: 'center', transition: 'all 0.2s',
                opacity: producto.stock === 0 ? 0.5 : 1,
              }}>
                {tieneVenta2 && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', justifyContent: 'center' }}>
                    <button onClick={() => setPresentacionSel(prev => ({...prev, [producto.id]: 'base'}))}
                      style={{
                        flex: 1, padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                        border: presActual === 'base' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                        background: presActual === 'base' ? '#f0fdf4' : 'white',
                        color: presActual === 'base' ? '#16a34a' : '#94a3b8'
                      }}>
                      {producto.unidad}
                    </button>
                    <button onClick={() => setPresentacionSel(prev => ({...prev, [producto.id]: 'venta2'}))}
                      style={{
                        flex: 1, padding: '3px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                        border: presActual === 'venta2' ? '2px solid #16a34a' : '1px solid #e2e8f0',
                        background: presActual === 'venta2' ? '#f0fdf4' : 'white',
                        color: presActual === 'venta2' ? '#16a34a' : '#94a3b8'
                      }}>
                      {producto.unidadVenta2}
                    </button>
                  </div>
                )}
                  <button
                    onClick={() => agregarAlCarrito(producto)}
                    disabled={!stockSuficiente}
                    style={{
                      width: '100%', background: 'transparent', border: 'none',
                      cursor: !stockSuficiente ? 'not-allowed' : 'pointer',
                      padding: '4px 0'
                    }}>
                  <div style={{ fontSize: '32px', marginBottom: '6px' }}>
                    {producto.categoria?.nombre === 'Ropa' ? '👕' :
                     producto.categoria?.nombre === 'Bebidas' ? '🥤' :
                     producto.categoria?.nombre === 'Granos básicos' ? '🌾' :
                     producto.categoria?.nombre === 'Chivería' ? '🍬' : '🛍️'}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--texto)', marginBottom: '4px' }}>
                    {producto.nombre}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a' }}>
                    C$ {precioMostrar.toFixed(2)} / {unidadMostrar}
                  </div>
                </button>
                <div style={{
                  fontSize: '11px', marginTop: '4px',
                  color: !stockSuficiente ? '#dc2626' : (producto.stock <= producto.stockMinimo ? '#dc2626' : 'var(--texto-secundario)')
                }}>
                  Stock: {producto.stock} {producto.unidad}
                  {!stockSuficiente ? ` ❌ (necesita ${factorProd})` : (producto.stock <= producto.stockMinimo ? ' ⚠️' : '')}
                </div>
              </div>
              )
            })
          )}
        </div>
      </div>

      <div style={{
        width: '340px', display: 'flex', flexDirection: 'column', gap: '12px', alignSelf: 'stretch'
      }}>
      <div className="card" style={{
        flex: 1, display: 'flex', flexDirection: 'column',
        gap: '12px', padding: '20px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--texto)' }}>
          🧾 Carrito de venta
        </h2>

        <div style={{ flex: 1, overflowY: 'auto', minHeight: '120px' }}>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94a3b8' }}>
              <div style={{ fontSize: '40px' }}>🛒</div>
              <p style={{ fontSize: '14px' }}>Tocá un producto para agregarlo</p>
            </div>
          ) : (
            carrito.map(item => (
              <div key={`${item.id}-${item._pres || 'base'}`} style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '10px 0', borderBottom: '1px solid #f1f5f9'
              }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '13px', fontWeight: 600 }}>{item.nombre}</div>
                  <div style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>
                    C$ {item.precio.toFixed(2)} / {item.unidadVenta || item.unidad}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <button onClick={() => cambiarCantidad(item.id, Math.max(0, item.cantidad - 0.5))}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}>
                    −
                  </button>
                  <input type="number" step="0.5" min="0.5"
                    value={item.cantidad}
                    onChange={e => cambiarCantidad(item.id, parseFloat(e.target.value) || 0)}
                    style={{
                      fontSize: '14px', fontWeight: 700, width: '48px', textAlign: 'center',
                      border: '1px solid #e2e8f0', borderRadius: '4px', padding: '2px'
                    }} />
                  <button onClick={() => cambiarCantidad(item.id, item.cantidad + 0.5)}
                    style={{ width: '26px', height: '26px', borderRadius: '6px', border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontWeight: 700 }}>
                    +
                  </button>
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>
                  C$ {(item.precio * item.cantidad).toFixed(2)}
                </div>
                <button onClick={() => eliminarDelCarrito(item.id, item._pres)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px' }}>
                  ✕
                </button>
              </div>
            ))
          )}
        </div>
        <div style={{ position: 'relative' }}>
           <div
              onClick={() => setMostrarClientes(!mostrarClientes)}
              style={{
                    padding: '10px 14px', borderRadius: '8px',
                     border: '1px solid #e2e8f0', cursor: 'pointer',
                    background: clienteSeleccionado ? '#dbeafe' : '#f8fafc',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
              }}>
              <span style={{ fontSize: '14px', color: clienteSeleccionado ? '#2563eb' : '#94a3b8', fontWeight: clienteSeleccionado ? 600 : 400 }}>
                  {clienteSeleccionado ? `👤 ${clienteSeleccionado.nombre}` : '👤 Cliente general (opcional)'}
             </span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>▼</span>
            </div>

        {mostrarClientes && (
           <div style={{
                position: 'absolute', top: '100%', left: 0, right: 0,
               background: 'white', border: '1px solid #e2e8f0',
                borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                zIndex: 10, maxHeight: '200px', overflowY: 'auto'
            }}>
            <div style={{ padding: '8px' }}>
              <input
               autoFocus
               type="text"
                placeholder="Buscar cliente..."
               value={buscarCliente}
               onChange={e => setBuscarCliente(e.target.value)}
               style={{
                   width: '100%', padding: '8px', borderRadius: '6px',
                    border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none'
                }}
             />
            </div>

      <div
        onClick={() => { setClienteSeleccionado(null); setMostrarClientes(false); setBuscarCliente('') }}
        style={{
          padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
          color: 'var(--texto-secundario)', borderBottom: '1px solid #f1f5f9',
          background: !clienteSeleccionado ? '#f8fafc' : 'white'
        }}>
        👤 Cliente general
      </div>

      {clientes
        .filter(c => c.nombre.toLowerCase().includes(buscarCliente.toLowerCase()))
        .map(c => (
          <div key={c.id}
            onClick={() => { setClienteSeleccionado(c); setMostrarClientes(false); setBuscarCliente('') }}
            style={{
              padding: '10px 14px', cursor: 'pointer', fontSize: '13px',
              borderBottom: '1px solid #f1f5f9',
              background: clienteSeleccionado?.id === c.id ? '#dbeafe' : 'white',
              color: clienteSeleccionado?.id === c.id ? '#2563eb' : 'var(--texto)',
            }}>
            <div style={{ fontWeight: 600 }}>{c.nombre}</div>
            {c.telefono && <div style={{ fontSize: '11px', color: '#94a3b8' }}>{c.telefono}</div>}
          </div>
        ))
      }

      {clientes.filter(c => c.nombre.toLowerCase().includes(buscarCliente.toLowerCase())).length === 0 && (
        <div style={{ padding: '16px', textAlign: 'center' }}>
          <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>
            No se encontr&oacute; &apos;{buscarCliente}&apos;
          </div>
          <button onClick={() => { setNuevoCliente({ nombre: buscarCliente, telefono: '', direccion: '' }); setMostrarFormCliente(true) }}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none',
              background: '#16a34a', color: 'white', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px'
            }}>
            + Crear cliente rápido
          </button>
        </div>
      )}
    </div>
  )}
</div>

        <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
            <span style={{ color: 'var(--texto-secundario)' }}>Subtotal</span>
            <span>C$ {subtotal.toFixed(2)}</span>
          </div>
          {desc > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px' }}>
              <span style={{ color: '#dc2626' }}>Descuento</span>
              <span style={{ color: '#dc2626' }}>- C$ {desc.toFixed(2)}</span>
            </div>
          )}
          {ivaActivo && (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px', fontSize: '14px', color: '#7c3aed' }}>
              <span>IVA ({porcIva}%)</span>
              <span>+ C$ {iva.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#16a34a' }}>
            <span>TOTAL</span>
            <span>C$ {total.toFixed(2)}</span>
          </div>
        </div>

        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
            <label style={{ fontSize: '13px', color: 'var(--texto-secundario)', fontWeight: 600 }}>
              Descuento {descPorc ? '(%)' : '(C$)'}
            </label>
            <button onClick={() => { setDescPorc(!descPorc); setDescuento('') }}
              style={{
                padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0',
                fontSize: '11px', cursor: 'pointer', background: descPorc ? '#dbeafe' : 'white',
                fontWeight: 600, color: descPorc ? '#2563eb' : '#64748b'
              }}>
              {descPorc ? 'C$' : '%'}
            </button>
          </div>
          <input
            id="campo-descuento"
            type="number"
            value={descuento}
            onChange={e => setDescuento(e.target.value)}
            placeholder="0.00"
            style={{
              width: '100%', padding: '10px', borderRadius: '8px',
              border: '1px solid #e2e8f0', fontSize: '14px',
              marginTop: '4px', outline: 'none'
            }}
          />
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {['efectivo', 'dolares', 'tarjeta', 'transferencia', 'credito'].map(m => {
            const activo = metodosPago.some(p => p.metodo === m) || metodoPago === m
            const esUnico = metodosPago.length <= 1
            return (
              <button key={m} onClick={() => {
                if (m === 'credito') {
                  if (activo) {
                    setEsCredito(false)
                    setFechaVencimiento('')
                    setMetodosPago(prev => prev.filter(p => p.metodo !== 'credito'))
                    if (metodosPago.length <= 1) setMetodoPago('efectivo')
                  } else {
                    setEsCredito(true)
                    setMetodoPago('credito')
                    setMetodosPago([{ metodo: 'credito', monto: '' }])
                  }
                  return
                }
                setEsCredito(false)
                setFechaVencimiento('')
                if (metodosPago.some(p => p.metodo === m)) {
                  if (metodosPago.length <= 1) return
                  const nuevos = metodosPago.filter(p => p.metodo !== m)
                  setMetodosPago(nuevos)
                  setMetodoPago(nuevos[0]?.metodo || 'efectivo')
                } else {
                  if (metodosPago.length === 1 && metodosPago[0].metodo === 'efectivo') {
                    setMetodosPago([{ metodo: m, monto: '' }])
                    setMetodoPago(m)
                  } else {
                    setMetodosPago(prev => [...prev, { metodo: m, monto: '' }])
                  }
                }
              }}
                style={{
                  flex: '1 0 auto', minWidth: '60px', padding: '8px 6px', borderRadius: '8px', border: '2px solid',
                  borderColor: activo ? (m === 'credito' ? '#d97706' : '#16a34a') : '#e2e8f0',
                  background: activo ? (m === 'credito' ? '#fef3c7' : '#dcfce7') : 'white',
                  color: activo ? (m === 'credito' ? '#92400e' : '#16a34a') : 'var(--texto-secundario)',
                  cursor: 'pointer', fontSize: '11px', fontWeight: 600,
                  textTransform: 'capitalize'
                }}>
                {m === 'efectivo' ? '💵' : m === 'dolares' ? '🇺🇸' : m === 'tarjeta' ? '💳' : m === 'transferencia' ? '📱' : '📋'} {m}
                {activo && !esUnico && m !== 'credito' && <span style={{ marginLeft: 4, color: '#dc2626' }}>✕</span>}
              </button>
            )
          })}
        </div>
        {metodosPago.length > 1 && (
          <div style={{ fontSize: 12, color: '#7c3aed', fontWeight: 600, textAlign: 'center', padding: '4px 0' }}>
            Pago mixto — Ingresá montos para cada método
          </div>
        )}

        {esCredito && (
          <div>
            <div style={{
              padding: '10px', borderRadius: '8px',
              background: '#fef9c3', border: '1px solid #fde047',
              fontSize: '13px', color: '#92400e', textAlign: 'center', marginBottom: 8
            }}>
              {clienteSeleccionado
                ? `📋 Venta al crédito para ${clienteSeleccionado.nombre}`
                : '⚠️ Seleccioná un cliente para venta al crédito'}
            </div>
            {clienteSeleccionado && (
              <div style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 13, fontWeight: 600, display: 'block', marginBottom: 2, color: 'var(--texto-secundario)' }}>
                  Fecha de vencimiento
                </label>
                <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: 14 }} />
              </div>
            )}
          </div>
        )}

        {metodosPago.length > 1 ? (
          <div>
            {metodosPago.filter(p => p.metodo !== 'credito').map(p => (
              <div key={p.metodo} style={{ marginBottom: 8 }}>
                <label style={{ fontSize: 13, color: 'var(--texto-secundario)', fontWeight: 600 }}>
                  {p.metodo === 'efectivo' ? '💵 Efectivo (C$)' : p.metodo === 'dolares' ? '🇺🇸 Dólares ($)' : p.metodo === 'tarjeta' ? '💳 Tarjeta (C$)' : '📱 Transferencia (C$)'}
                </label>
                <input type="number" value={p.monto} placeholder="0.00"
                  onChange={e => setMetodosPago(prev => prev.map(pm => pm.metodo === p.metodo ? { ...pm, monto: e.target.value } : pm))}
                  style={{ width: '100%', padding: '10px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 16, marginTop: 4, outline: 'none' }}
                />
              </div>
            ))}
            {(() => {
              const totalPagado = metodosPago.reduce((sum, p) => {
                if (p.metodo === 'credito') return sum
                if (p.metodo === 'dolares') return sum + (parseFloat(p.monto || 0) * tasaCambio)
                return sum + parseFloat(p.monto || 0)
              }, 0)
              const cambioCalc = Math.max(0, totalPagado - total)
              return (
                <div style={{ fontSize: 13, color: 'var(--texto-secundario)', textAlign: 'center', marginTop: 4 }}>
                  Total pagado: C$ {totalPagado.toFixed(2)}
                  {totalPagado >= total && <div style={{ color: '#16a34a', fontWeight: 700, fontSize: 16, marginTop: 4 }}>Cambio: C$ {cambioCalc.toFixed(2)}</div>}
                </div>
              )
            })()}
          </div>
        ) : (metodoPago === 'efectivo' || metodoPago === 'dolares') && (
          <div>
            <label style={{ fontSize: '13px', color: 'var(--texto-secundario)', fontWeight: 600 }}>
              {metodoPago === 'dolares' ? 'Pago con ($)' : 'Pago con (C$)'}
            </label>
            <input
              ref={pagoRef}
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
            {metodoPago === 'dolares' && pagoCon && (
              <div style={{ fontSize: '12px', color: tasaCambio > 0 ? 'var(--texto-secundario)' : '#dc2626', marginTop: '4px', textAlign: 'center' }}>
                {tasaCambio > 0
                  ? `= C$ ${pagoConCordobas.toFixed(2)} (tasa ${tasaCambio.toFixed(2)})`
                  : '⚠️ Configurá la tasa de cambio en Configuración'}
              </div>
            )}
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

        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setMostrarParked(true)} disabled={carrito.length === 0}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px',
              border: '1px solid #7c3aed',
              background: carrito.length === 0 ? '#f1f5f9' : '#f3e8ff',
              cursor: carrito.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              color: carrito.length === 0 ? '#94a3b8' : '#7c3aed',
              fontSize: '13px', opacity: carrito.length === 0 ? 0.5 : 1
            }}>
            ⏸️ Pausar ticket
          </button>
          <button onClick={async () => { await cargarParked(); setMostrarParked(true) }}
            disabled={parkedSessions.length === 0}
            style={{
              flex: 1, padding: '8px', borderRadius: '8px',
              border: '1px solid #2563eb',
              background: parkedSessions.length === 0 ? '#f1f5f9' : '#dbeafe',
              cursor: parkedSessions.length === 0 ? 'not-allowed' : 'pointer',
              fontWeight: 600,
              color: parkedSessions.length === 0 ? '#94a3b8' : '#2563eb',
              fontSize: '13px', opacity: parkedSessions.length === 0 ? 0.5 : 1
            }}>
            📋 Tickets ({parkedSessions.length})
          </button>
        </div>

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
      </div>

        {mostrarParked && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
          }}>
            <div className="card" style={{ width: '420px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>⏸️ Tickets en espera</h2>
                <button onClick={() => setMostrarParked(false)}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>

              {carrito.length > 0 && (
                <div style={{ marginBottom: '20px', padding: '16px', background: '#f8fafc', borderRadius: '10px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '6px' }}>
                    Nombre del ticket
                  </label>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input value={nombreParked} onChange={e => setNombreParked(e.target.value)}
                      placeholder="Ej: Cliente esperando..."
                      style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                    <button onClick={async () => {
                      if (!nombreParked.trim()) return alert('Escribí un nombre para el ticket')
                      await fetch('/api/cart-sessions', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                          nombre: nombreParked,
                          data: { carrito, clienteSeleccionado, metodoPago }
                        })
                      })
                      setNombreParked('')
                      limpiarCarrito()
                      await cargarParked()
                    }}
                      style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', background: '#7c3aed', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '13px' }}>
                      💾 Guardar
                    </button>
                  </div>
                </div>
              )}

              {parkedSessions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>
                  No hay tickets en espera
                </div>
              ) : (
                parkedSessions.map(s => {
                  let info = { carrito: [], clienteSeleccionado: null, metodoPago: 'efectivo' }
                  try { info = JSON.parse(s.data); if (typeof info === 'string') info = JSON.parse(info); if (typeof info !== 'object' || info === null) info = { carrito: [], clienteSeleccionado: null, metodoPago: 'efectivo' } } catch (e) { console.warn('Error parseando parked:', e); info = { carrito: [], clienteSeleccionado: null, metodoPago: 'efectivo' } }
                  return (
                    <div key={s.id} style={{
                      display: 'flex', alignItems: 'center', gap: '10px',
                      padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '8px'
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{s.nombre}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                          {info.carrito?.length || 0} productos · {new Date(s.creadoEn).toLocaleDateString('es-NI')}
                        </div>
                      </div>
                      <button onClick={async () => {
                        setCarrito(info.carrito || [])
                        setClienteSeleccionado(info.clienteSeleccionado || null)
                        setMetodoPago(info.metodoPago || 'efectivo')
                        const res = await fetch(`/api/cart-sessions?id=${s.id}`, { method: 'DELETE' })
                        if (!res.ok) return alert('Error al eliminar el ticket')
                        await cargarParked()
                        setMostrarParked(false)
                      }}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #16a34a', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>
                        ▶️ Reanudar
                      </button>
                      <button onClick={async () => {
                        await fetch(`/api/cart-sessions?id=${s.id}`, { method: 'DELETE' })
                        await cargarParked()
                      }}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>
                        🗑️
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}
        
      </div>

      {mostrarFormCliente && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: '380px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>+ Nuevo cliente rápido</h2>
              <button onClick={() => setMostrarFormCliente(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input placeholder="Nombre *" value={nuevoCliente.nombre}
                onChange={e => setNuevoCliente(p => ({ ...p, nombre: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} />
              <input placeholder="Teléfono" value={nuevoCliente.telefono}
                onChange={e => setNuevoCliente(p => ({ ...p, telefono: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} />
              <input placeholder="Dirección" value={nuevoCliente.direccion}
                onChange={e => setNuevoCliente(p => ({ ...p, direccion: e.target.value }))}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} />
              <button onClick={async () => {
                if (!nuevoCliente.nombre.trim()) return alert('El nombre es obligatorio')
                try {
                  const res = await fetch('/api/clientes', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(nuevoCliente)
                  })
                  const cliente = await res.json()
                  setClientes(prev => [...prev, cliente])
                  setClienteSeleccionado(cliente)
                  setMostrarFormCliente(false)
                  setMostrarClientes(false)
                  setBuscarCliente('')
                } catch {
                  alert('Error al crear cliente')
                }
              }}
                style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>
                💾 Guardar y seleccionar
              </button>
            </div>
          </div>
        </div>
      )}

      {facturaExitosa && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div style={{
            background: 'white', borderRadius: '16px', padding: '40px 48px',
            textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🎉</div>
            <div style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a', marginBottom: '8px' }}>
              ¡Venta exitosa!
            </div>
            <div style={{ fontSize: '15px', color: '#15803d' }}>
              Factura: {facturaExitosa.numero}
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'none' }}>
        <FacturaRecibo ref={reciboRef} factura={facturaExitosa} config={config} />
      </div>
    </div>
    </>
  )
}
