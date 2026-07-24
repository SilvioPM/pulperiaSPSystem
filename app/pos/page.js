'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { useTecladoVirtual } from '@/app/context/TecladoVirtualContext'
import { Search, Shirt, Coffee, Wheat, Candy, ShoppingBag, AlertTriangle, ShoppingCart, FileText, User, CheckCircle, Loader, Trash2, PauseCircle, ClipboardList, DollarSign, CreditCard, Smartphone, Star, Package, UserPlus, Play, XCircle, Save, Printer } from 'lucide-react'
import Toast from '../components/Toast'

import FacturaRecibo from '../components/FacturaRecibo'
import { useReactToPrint } from 'react-to-print'
import { useToast } from '../hooks/useToast'

export default function POS() {
  const { user } = useAuth()
  const { visible: tecladoVisible, keyboardHeight: tecladoAlturaRaw } = useTecladoVirtual()
  const tecladoAltura = tecladoVisible && tecladoAlturaRaw === 0 ? 240 : tecladoAlturaRaw
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
  const { toast, mostrar, cerrar } = useToast()
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
  const [genericoModal, setGenericoModal]             = useState(null)
  const [genPrecio, setGenPrecio]                     = useState('')
  const [genCantidad, setGenCantidad]                 = useState('1')
  const [mostrarFormCliente, setMostrarFormCliente]   = useState(false)
  const [nuevoCliente, setNuevoCliente]               = useState({ nombre: '', telefono: '', direccion: '' })
  const [infoCliente, setInfoCliente]                 = useState(null)
  const [mostrarProformas, setMostrarProformas]       = useState(false)
  const [proformasPendientes, setProformasPendientes] = useState([])
  const [proformaActiva, setProformaActiva]           = useState(null)
  const [cargandoProformas, setCargandoProformas]     = useState(false)
  const [esPhone, setEsPhone]                         = useState(false)
  const [mostrarCats, setMostrarCats]                 = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 640px)')
    setEsPhone(mq.matches)
    const handler = e => setEsPhone(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  const reciboRef = useRef(null)
  const imprimirTicket = useReactToPrint({
    contentRef: reciboRef,
    documentTitle: 'Recibo',
    pageStyle: '@page { size: 80mm auto; margin: 0mm; }',
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

  const agregarAlCarritoRef = useRef(null)
  agregarAlCarritoRef.current = agregarAlCarrito

  const buscarProducto = useCallback(async (codigo) => {
    try {
      const res = await fetch(`/api/productos?buscar=${encodeURIComponent(codigo)}`)
      const data = await res.json()
      const prods = data.data || data || []
      const prod = prods.find(p =>
        p.codigo === codigo ||
        (p.codigosAlias && p.codigosAlias.some(a => a.codigo === codigo))
      ) || prods[0]
      if (prod) {
        agregarAlCarritoRef.current(prod)
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

  async function cargarProformas() {
    setCargandoProformas(true)
    try {
      const res = await fetch('/api/proformas?page=1&limit=999')
      const data = await res.json()
      setProformasPendientes((data.data || []).filter(p => p.estado === 'pendiente'))
    } catch (e) {
      console.error('Error cargando proformas:', e)
    }
    setCargandoProformas(false)
  }

  function cargarProformaEnPOS(proforma) {
    setCarrito(proforma.detalles.map(d => ({
      ...d.producto,
      cantidad: d.cantidad,
      precio: d.precio,
      subtotal: d.subtotal,
      _proformaDetalleId: d.id
    })))
    if (proforma.cliente) setClienteSeleccionado(proforma.cliente)
    setProformaActiva(proforma.id)
    setMostrarProformas(false)
  }

  async function cargarParked() {
    try { const res = await fetch('/api/cart-sessions'); const data = await res.json(); setParkedSessions(Array.isArray(data) ? data : []) } catch (e) { console.error('Error cargando parked:', e) }
  }

  function aplicarMayorista(producto, pres, cantidad) {
    if (pres !== 'base') return false
    if (!producto.precioMayor || producto.precioMayor <= 0) return false
    if (!producto.cantidadMinimaMayor || producto.cantidadMinimaMayor <= 0) return false
    return cantidad >= producto.cantidadMinimaMayor
  }

  function obtenerPres(producto, pres) {
    let base
    if (pres === 'venta2' && producto.unidadVenta2) base = { precio: producto.precioVenta2, factor: producto.factorVenta2 || 1, unidad: producto.unidadVenta2, costo: producto.costoVenta2 || 0 }
    else if (pres === 'venta3' && producto.unidadVenta3) base = { precio: producto.precioVenta3, factor: producto.factorVenta3 || 1, unidad: producto.unidadVenta3, costo: producto.costoVenta3 || 0 }
    else if (pres === 'venta4' && producto.unidadVenta4) base = { precio: producto.precioVenta4, factor: producto.factorVenta4 || 1, unidad: producto.unidadVenta4, costo: producto.costoVenta4 || 0 }
    else base = { precio: producto.precio, factor: 1, unidad: producto.unidad, costo: producto.costo || 0 }
    return base
  }

  function agregarAlCarrito(producto) {
    setFacturaExitosa(null)
    const pres = presentacionSel[producto.id] || 'base'
    const p = obtenerPres(producto, pres)
    const precioUsado = p.precio
    const factorConv = p.factor
    const unidadVenta = p.unidad

    const cantidadActual = carrito.reduce((sum, item) =>
      item.id === producto.id && item._pres === pres ? sum + item.cantidad : sum, 0
    )
    const stockRequerido = (cantidadActual + 1) * factorConv
    if (producto.stock < stockRequerido) {
      return mostrar(`Stock insuficiente. Disponible: ${producto.stock} ${producto.unidad}, necesitas ${stockRequerido} ${producto.unidad}`, 'alerta')
    }

    setCarrito(prev => {
      const existe = prev.find(item => item.id === producto.id && item._pres === pres)
      if (existe) {
        const nuevaCant = existe.cantidad + 1
        const precioFinal = aplicarMayorista(producto, pres, nuevaCant) ? (producto.precioMayor || precioUsado) : precioUsado
        return prev.map(item =>
          item.id === producto.id && item._pres === pres
            ? { ...item, cantidad: nuevaCant, precio: precioFinal }
            : item
        )
      }
      const precioFinal = aplicarMayorista(producto, pres, 1) ? (producto.precioMayor || precioUsado) : precioUsado
      return [...prev, { ...producto, cantidad: 1, _pres: pres, precio: precioFinal, unidadVenta, factorConversion: factorConv }]
    })
  }

  function cambiarCantidad(id, nuevaCantidad, pres) {
    if (nuevaCantidad <= 0) return eliminarDelCarrito(id, pres)
    const item = carrito.find(i => i.id === id && (i._pres || 'base') === (pres || 'base'))
    if (item) {
      const stockReq = nuevaCantidad * (item.factorConversion || 1)
      if (item.stock !== undefined && item.stock < stockReq) {
        return mostrar(`Stock insuficiente. Disponible: ${item.stock} ${item.unidad}, necesitas ${stockReq} ${item.unidad}`, 'alerta')
      }
    }
    setCarrito(prev =>
      prev.map(item =>
        item.id === id && (item._pres || 'base') === (pres || 'base')
          ? {
              ...item, cantidad: nuevaCantidad,
              precio: aplicarMayorista(item, item._pres || 'base', nuevaCantidad) ? (item.precioMayor || item.precio) : obtenerPres(item, item._pres || 'base').precio
            }
          : item
      )
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
    setProformaActiva(null)
    setBuscarCliente('')
    setInfoCliente(null)
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
    if (carrito.length === 0) return mostrar('Agregá productos al carrito', 'alerta')
    if (esCredito && !clienteSeleccionado) return mostrar('Seleccioná un cliente para venta al crédito', 'alerta')
    if (metodosPago.length > 1) {
      const totalPagado = metodosPago.reduce((sum, p) => {
        if (p.metodo === 'dolares') return sum + (parseFloat(p.monto || 0) * tasaCambio)
        return sum + parseFloat(p.monto || 0)
      }, 0)
      if (totalPagado < total) return mostrar('El total del pago mixto es menor al total de la venta', 'alerta')
    } else if (!esCredito) {
      if (metodoPago === 'efectivo' && parseFloat(pagoCon || 0) < total) {
        return mostrar('El pago es menor al total', 'alerta')
      }
      if (metodoPago === 'dolares') {
        if (!tasaCambio || tasaCambio <= 0) return mostrar('Configurá la tasa de cambio en ⚙️ Configuración antes de cobrar en dólares', 'alerta')
        const enCordobas = parseFloat(pagoCon || 0) * tasaCambio
        if (enCordobas < total) return mostrar('El pago en dólares es menor al total', 'alerta')
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
        return mostrar(`Límite de crédito excedido.\nDisponible: C$ ${Math.max(0, clienteSeleccionado.limiteCredito - pendiente).toFixed(2)}\nTotal venta: C$ ${total.toFixed(2)}`, 'alerta')
      }
    }

    for (const item of carrito) {
      if (item.esGenerico) continue
      const factor = item.factorConversion || 1
      const stockReq = item.cantidad * factor
      if (item.stock !== undefined && item.stock < stockReq) {
        setCargando(false)
        return mostrar(`Stock insuficiente para "${item.nombre}". Disponible: ${item.stock} ${item.unidad}, necesitas ${stockReq} ${item.unidad}`, 'alerta')
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
            costo: item._pres === 'venta2' ? parseFloat(item.costoVenta2 || 0) || (item.costo || 0) * (item.factorConversion || 1) : item._pres === 'venta3' ? parseFloat(item.costoVenta3 || 0) || (item.costo || 0) * (item.factorConversion || 1) : item._pres === 'venta4' ? parseFloat(item.costoVenta4 || 0) || (item.costo || 0) * (item.factorConversion || 1) : (item.costo || 0),
            subtotal: item.precio * item.cantidad,
            unidadVenta: item.unidadVenta || item.unidad,
            factorConversion: item.factorConversion || 1
          }))
        })
      })
      const factura = await res.json()
      if (proformaActiva) {
        await fetch(`/api/proformas/${proformaActiva}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ estado: 'aprobada' })
        }).catch(() => {})
        setProformaActiva(null)
      }
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
      mostrar('Error al procesar la venta', 'error')
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
          <AlertTriangle size={24} />
          No hay caja abierta.
          <a href="/caja" style={{ color: '#fde68a', textDecoration: 'underline', fontWeight: 700, marginLeft: '4px' }}>
            Abrir caja
          </a>
          <button onClick={() => setErrorCaja(false)}
            style={{ marginLeft: 'auto', background: 'rgba(255,255,255,0.15)', border: 'none', color: '#fff', borderRadius: '50%', width: 28, height: 28, cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <XCircle size={16} />
          </button>
        </div>
      )}
    <div className="pos-layout" style={{ display: 'flex', flexDirection: 'row', height: '100vh', overflow: 'hidden', gap: '8px' }}>

      {/* ── LEFT COLUMN: Products ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflow: 'hidden' }}>

        <div className="card" style={{ padding: '10px 14px 8px 14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Search size={18} color="#94a3b8" />
            <input
              ref={searchRef}
              type="text" inputMode="none"
              placeholder="Buscar producto..."
              value={buscar}
              onChange={e => setBuscar(e.target.value)}
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none'
              }}
            />
          </div>

          {esPhone && buscar ? null : esPhone ? (
            <div style={{ marginTop: '6px' }}>
              <button onClick={() => setMostrarCats(!mostrarCats)}
                style={{
                  padding: '8px 16px', borderRadius: '20px', border: '1px solid #cbd5e1',
                  background: categoriaActiva ? '#16a34a' : '#f1f5f9',
                  color: categoriaActiva ? 'white' : '#475569',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600,
                }}>
                {categoriaActiva ? categorias.find(c => c.id === categoriaActiva)?.nombre || 'Categoría' : 'Categorías'} {mostrarCats ? '▲' : '▼'}
              </button>
              {mostrarCats && (
                <div style={{ display: 'flex', gap: '4px', marginTop: '6px', flexWrap: 'wrap' }}>
                  <button onClick={() => { setCategoriaActiva(null); setMostrarCats(false) }}
                    style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: !categoriaActiva ? '#16a34a' : '#f1f5f9', color: !categoriaActiva ? 'white' : '#64748b' }}>
                    Todas
                  </button>
                  {categorias.map(cat => (
                    <button key={cat.id} onClick={() => { setCategoriaActiva(cat.id); setMostrarCats(false) }}
                      style={{ padding: '6px 12px', borderRadius: '16px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: categoriaActiva === cat.id ? '#16a34a' : '#f1f5f9', color: categoriaActiva === cat.id ? 'white' : '#64748b' }}>
                      {cat.nombre}
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', gap: '4px', marginTop: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
              <button className="pos-cat-btn"
                onClick={() => setCategoriaActiva(null)}
                style={{
                  padding: '7px 14px', borderRadius: '20px', border: 'none',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600, minHeight: '34px',
                  background: !categoriaActiva ? '#16a34a' : '#f1f5f9',
                  color: !categoriaActiva ? 'white' : 'var(--texto-secundario)'
                }}>
                Todos
              </button>
              {categorias.slice(0, 3).map(cat => (
                <button key={cat.id}
                  onClick={() => setCategoriaActiva(cat.id)}
                  style={{
                    padding: '7px 14px', borderRadius: '20px', border: 'none',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600, minHeight: '34px',
                    background: categoriaActiva === cat.id ? '#16a34a' : '#f1f5f9',
                    color: categoriaActiva === cat.id ? 'white' : 'var(--texto-secundario)'
                  }}>
                  {cat.nombre}
                </button>
              ))}
              {categorias.length > 3 && (
                <select
                  value={categoriaActiva || ''}
                  onChange={e => setCategoriaActiva(e.target.value ? parseInt(e.target.value) : null)}
                  style={{
                    padding: '7px 28px 7px 14px', borderRadius: '20px', border: 'none',
                    cursor: 'pointer', fontSize: '13px', fontWeight: 600, minHeight: '34px',
                    background: categoriaActiva && !categorias.slice(0, 3).some(c => c.id === categoriaActiva) ? '#16a34a' : '#f1f5f9',
                    color: categoriaActiva && !categorias.slice(0, 3).some(c => c.id === categoriaActiva) ? 'white' : 'var(--texto-secundario)',
                    appearance: 'none',
                    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%2364748b' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpolyline points='6 9 12 15 18 9'%3E%3C/polyline%3E%3C/svg%3E")`,
                    backgroundRepeat: 'no-repeat', backgroundPosition: 'right 10px center', backgroundSize: '12px'
                  }}>
                  <option value="">Más...</option>
                  {categorias.slice(3).map(cat => (
                    <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                  ))}
                </select>
              )}
            </div>
          )}
        </div>

        <div className="pos-product-grid" style={{
          flex: 1, overflowY: 'auto',
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
          gap: '12px', alignContent: 'start'
        }}>
          {productos.length === 0 ? (
            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', color: '#94a3b8' }}>
              <Package size={48} style={{ margin: '0 auto 12px', opacity: 0.4 }} />
              <p>No hay productos aún</p>
              <p style={{ fontSize: '13px' }}>Agregá productos desde el módulo Productos</p>
            </div>
          ) : (
            productos.map(producto => {
              const presentaciones = [
                { key: 'base', label: producto.unidad, check: true },
                { key: 'venta2', label: producto.unidadVenta2, check: producto.unidadVenta2 && producto.precioVenta2 > 0 },
                { key: 'venta3', label: producto.unidadVenta3, check: producto.unidadVenta3 && producto.precioVenta3 > 0 },
                { key: 'venta4', label: producto.unidadVenta4, check: producto.unidadVenta4 && producto.precioVenta4 > 0 },
              ].filter(p => p.check)
              const presActual = presentacionSel[producto.id] || 'base'
              const p = obtenerPres(producto, presActual)
              const stockSuficiente = producto.stock >= p.factor
              return (
              <div key={producto.id}
                onClick={() => {
                  if (producto.esGenerico && config.permiteGenericos !== 'false') {
                    const pres = presentacionSel[producto.id] || 'base'
                    const p = obtenerPres(producto, pres)
                    setGenPrecio(p.precio > 0 ? p.precio.toString() : '')
                    setGenCantidad('1')
                    setGenericoModal(producto)
                  } else if (stockSuficiente) {
                    agregarAlCarrito(producto)
                  }
                }}
                className="touch-active"
                style={{
                  background: 'white', border: '1px solid #e2e8f0',
                  borderRadius: '12px', padding: '14px 10px 10px',
                  textAlign: 'center', cursor: stockSuficiente ? 'pointer' : 'not-allowed',
                  opacity: producto.stock === 0 ? 0.5 : 1,
                  userSelect: 'none',
                }}>
                {presentaciones.length > 1 && (
                  <div style={{ display: 'flex', gap: '4px', marginBottom: '8px', justifyContent: 'center' }} onClick={e => e.stopPropagation()}>
                    {presentaciones.map(pre => (
                      <button key={pre.key} onClick={() => setPresentacionSel(prev => ({...prev, [producto.id]: pre.key}))}
                        style={{
                          flex: 1, padding: '6px 6px', borderRadius: '4px', fontSize: '10px', fontWeight: 700, cursor: 'pointer',
                          border: presActual === pre.key ? '2px solid #16a34a' : '1px solid #e2e8f0',
                          background: presActual === pre.key ? '#f0fdf4' : 'white',
                          color: presActual === pre.key ? '#16a34a' : '#94a3b8'
                        }}>
                        {pre.label}
                      </button>
                    ))}
                  </div>
                )}
                  <div style={{ marginBottom: '6px' }}>
                    {producto.categoria?.nombre === 'Ropa' ? <Shirt size={32} /> :
                     producto.categoria?.nombre === 'Bebidas' ? <Coffee size={32} /> :
                     producto.categoria?.nombre === 'Granos básicos' ? <Wheat size={32} /> :
                     producto.categoria?.nombre === 'Chivería' ? <Candy size={32} /> : <ShoppingBag size={32} />}
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--texto)', marginBottom: '4px' }}>
                    {producto.nombre}
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#16a34a' }}>
                    {producto.esGenerico ? 'Precio variable' : `C$ ${p.precio.toFixed(2)} / ${p.unidad}`}
                  </div>
                  {producto.precioMayor > 0 && producto.cantidadMinimaMayor > 0 && (
                    <div style={{ fontSize: '11px', color: '#7c3aed', fontWeight: 600, marginTop: 2 }}>
                      Mayorista: C$ {producto.precioMayor.toFixed(2)} (desde {producto.cantidadMinimaMayor})
                    </div>
                  )}
                <div style={{
                  fontSize: '11px', marginTop: '4px',
                  color: producto.esGenerico ? '#92400e' : (!stockSuficiente ? '#dc2626' : (producto.stock <= producto.stockMinimo ? '#dc2626' : 'var(--texto-secundario)'))
                }}>
                  {producto.esGenerico ? <><Star size={12} /> Genérico — sin inventario</> : <>Stock: {producto.stock} {producto.unidad}
                  {!stockSuficiente ? <><XCircle size={12} /> (necesita {p.factor})</> : (producto.stock <= producto.stockMinimo ? <AlertTriangle size={12} /> : '')}</>}
                </div>
              </div>
              )
            })
          )}
        </div>
      </div>

      {/* ── RIGHT COLUMN: Cart + Payment + Actions ── */}
      <div className="card" style={{
        flex: 1, display: 'flex', flexDirection: 'column', gap: '6px',
        padding: '10px 14px', overflow: 'hidden', minWidth: 0
      }}>
        {/* Cart items */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px', overflow: 'hidden', minHeight: 0 }}>
          <h2 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--texto)' }}>
            <ShoppingCart size={15} style={{ marginRight: 2 }} /> Carrito
          </h2>
          {carrito.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px', color: '#94a3b8', fontSize: '14px' }}>
              Tocá un producto para agregarlo
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', overflowY: 'auto', flex: 1, minHeight: 0 }}>
              {carrito.map(item => (
                <div key={`${item.id}-${item._pres || 'base'}`} style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px',
                  background: '#f8fafc', fontSize: '13px', flexShrink: 0
                }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: '13px' }}>{item.nombre}</div>
                    <div style={{ fontSize: '12px', color: 'var(--texto-secundario)' }}>
                      C$ {item.precio.toFixed(2)} / {item.unidadVenta || item.unidad}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <button onClick={() => cambiarCantidad(item.id, Math.max(0, item.cantidad - 0.5), item._pres)}
                      style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '18px' }}>
                      −
                    </button>
                    <input type="number" step="0.5" min="0.5"
                      value={item.cantidad}
                      onChange={e => cambiarCantidad(item.id, parseFloat(e.target.value) || 0, item._pres)}
                      style={{ fontSize: '14px', fontWeight: 700, width: '44px', textAlign: 'center', border: '1px solid #e2e8f0', borderRadius: '6px', padding: '4px' }} />
                    <button onClick={() => cambiarCantidad(item.id, item.cantidad + 0.5, item._pres)}
                      style={{ width: '40px', height: '40px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 700, fontSize: '18px' }}>
                      +
                    </button>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, minWidth: '60px', textAlign: 'right' }}>
                    C$ {(item.precio * item.cantidad).toFixed(2)}
                  </div>
                  <button onClick={() => eliminarDelCarrito(item.id, item._pres)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <XCircle size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Payment methods */}
        <div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {['efectivo', 'dolares', 'tarjeta', 'transferencia', 'credito'].map(m => {
              const activo = metodosPago.some(p => p.metodo === m) || metodoPago === m
              const esUnico = metodosPago.length <= 1
              return (
                <button key={m} onClick={() => {
                  if (m === 'credito') {
                    if (activo) { setEsCredito(false); setFechaVencimiento(''); setMetodosPago(prev => prev.filter(p => p.metodo !== 'credito')); if (metodosPago.length <= 1) setMetodoPago('efectivo') }
                    else { setEsCredito(true); setMetodoPago('credito'); setMetodosPago([{ metodo: 'credito', monto: '' }]) }
                    return
                  }
                  setEsCredito(false); setFechaVencimiento('')
                  if (metodosPago.some(p => p.metodo === m)) {
                    if (metodosPago.length <= 1) return
                    const nuevos = metodosPago.filter(p => p.metodo !== m)
                    setMetodosPago(nuevos); setMetodoPago(nuevos[0]?.metodo || 'efectivo')
                  } else {
                    if (metodosPago.length === 1 && metodosPago[0].metodo === 'efectivo') { setMetodosPago([{ metodo: m, monto: '' }]); setMetodoPago(m) }
                    else { setMetodosPago(prev => [...prev, { metodo: m, monto: '' }]) }
                  }
                }}
                  style={{ flex: '1 0 auto', minWidth: '80px', padding: '12px 10px', borderRadius: '8px', border: '2px solid', borderColor: activo ? (m === 'credito' ? '#d97706' : '#16a34a') : '#e2e8f0', background: activo ? (m === 'credito' ? '#fef3c7' : '#dcfce7') : 'white', color: activo ? (m === 'credito' ? '#92400e' : '#16a34a') : 'var(--texto-secundario)', cursor: 'pointer', fontSize: '13px', fontWeight: 600, textTransform: 'capitalize' }}>
                  {m === 'efectivo' || m === 'dolares' ? <DollarSign size={16} /> : m === 'tarjeta' ? <CreditCard size={16} /> : m === 'transferencia' ? <Smartphone size={16} /> : <ClipboardList size={16} />} {m === 'efectivo' ? 'Córdobas' : m}
                  {activo && !esUnico && m !== 'credito' && <span style={{ marginLeft: 2, color: '#dc2626' }}>✕</span>}
                </button>
              )
            })}
          </div>
          {metodosPago.length > 1 && <div style={{ fontSize: '12px', color: '#7c3aed', fontWeight: 600, textAlign: 'center', marginTop: '4px' }}>Pago mixto — Ingresá montos para cada método</div>}
          {esCredito && (
            <div style={{ marginTop: '4px' }}>
              <div style={{ padding: '8px', borderRadius: '6px', background: '#fef9c3', border: '1px solid #fde047', fontSize: '13px', color: '#92400e', textAlign: 'center', marginBottom: 4 }}>
                {clienteSeleccionado ? <><ClipboardList size={14} /> Venta al crédito para {clienteSeleccionado.nombre}</> : <><AlertTriangle size={14} /> Seleccioná un cliente para venta al crédito</>}
              </div>
              {clienteSeleccionado && <input type="date" value={fechaVencimiento} onChange={e => setFechaVencimiento(e.target.value)} style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px' }} />}
            </div>
          )}
        </div>

        {/* Discount + Summary row */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
          {/* Discount */}
          <div style={{ flex: '0 0 130px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 2 }}>
              <label style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 600 }}>
                Descuento
              </label>
              <button onClick={() => { setDescPorc(!descPorc); setDescuento('') }}
                style={{ padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', cursor: 'pointer', background: descPorc ? '#dbeafe' : 'white', fontWeight: 600, color: descPorc ? '#2563eb' : '#64748b' }}>
                {descPorc ? '%' : 'C$'}
              </button>
            </div>
            <input id="campo-descuento" type="number" inputMode="none" value={descuento} onChange={e => setDescuento(e.target.value)} placeholder="0.00"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none', minHeight: '40px' }} />
          </div>
          {/* Summary */}
          <div style={{ flex: 1, border: '1px solid #e2e8f0', borderRadius: '8px', padding: '6px 10px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: '13px' }}>
              <span style={{ color: 'var(--texto-secundario)' }}>Subtotal</span>
              <span>C$ {subtotal.toFixed(2)}</span>
            </div>
            {desc > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: '13px' }}>
                <span style={{ color: '#dc2626' }}>Descuento</span>
                <span style={{ color: '#dc2626' }}>- C$ {desc.toFixed(2)}</span>
              </div>
            )}
            {ivaActivo && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1px', fontSize: '13px', color: '#7c3aed' }}>
                <span>IVA ({porcIva}%)</span>
                <span>+ C$ {iva.toFixed(2)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#16a34a', borderTop: '1px solid #e2e8f0', paddingTop: '2px' }}>
              <span>TOTAL</span>
              <span>C$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Mixed payment inputs */}
        {metodosPago.length > 1 && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
            <div style={{ flex: '0 0 45%' }}>
              {metodosPago.filter(p => p.metodo !== 'credito').map(p => (
                <div key={p.metodo} style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: 2 }}>
                  <span style={{ fontSize: '11px', color: 'var(--texto-secundario)', fontWeight: 600, minWidth: '68px', flex: '0 0 68px' }}>{p.metodo === 'efectivo' ? 'Córdobas (C$)' : p.metodo === 'dolares' ? 'Dólares ($)' : p.metodo === 'tarjeta' ? 'Tarjeta (C$)' : 'Transferencia (C$)'}</span>
                  <input type="number" inputMode="none" value={p.monto} placeholder="0.00"
                    onChange={e => setMetodosPago(prev => prev.map(pm => pm.metodo === p.metodo ? { ...pm, monto: e.target.value } : pm))}
                    style={{ flex: 1, padding: '6px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none', minWidth: 0 }} />
                </div>
              ))}
            </div>
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              {(() => { const totalPagado = metodosPago.reduce((sum, p) => { if (p.metodo === 'credito') return sum; if (p.metodo === 'dolares') return sum + (parseFloat(p.monto || 0) * tasaCambio); return sum + parseFloat(p.monto || 0) }, 0); const diff = totalPagado - total; return <div style={{ fontSize: '13px', color: 'var(--texto-secundario)', textAlign: 'center' }}><div style={{ fontWeight: 600 }}>Total: C$ {totalPagado.toFixed(2)}</div>{diff < 0 ? <div style={{ color: '#dc2626', fontWeight: 700, fontSize: '15px' }}>Falta: C$ {Math.abs(diff).toFixed(2)}</div> : diff > 0 ? <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '15px' }}>Cambio: C$ {diff.toFixed(2)}</div> : <div style={{ color: '#16a34a', fontWeight: 700, fontSize: '15px' }}>Pago exacto</div>}</div> })()}
            </div>
          </div>
        )}

        {/* Client selector */}
        <div style={{ position: 'relative' }}>
          <div onClick={() => setMostrarClientes(!mostrarClientes)} style={{
            padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', cursor: 'pointer', minHeight: '42px',
            background: clienteSeleccionado ? '#dbeafe' : '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '13px'
          }}>
            <span style={{ color: clienteSeleccionado ? '#2563eb' : '#94a3b8', fontWeight: clienteSeleccionado ? 600 : 400 }}>
              {clienteSeleccionado ? <><User size={14} style={{ marginRight: 4 }} /> {clienteSeleccionado.nombre}</> : <><User size={14} style={{ marginRight: 4 }} /> Cliente general</>}
            </span>
            <span style={{ fontSize: '11px', color: '#94a3b8' }}>▼</span>
          </div>
          {infoCliente && (
            <div style={{ marginTop: 4, padding: '6px 10px', borderRadius: '6px', background: '#f8fafc', border: '1px solid #e2e8f0', fontSize: '12px', display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: infoCliente.pendiente > 0 ? '#dc2626' : '#16a34a', fontWeight: 600 }}>
                Pendiente: C$ {infoCliente.pendiente.toFixed(2)}
              </span>
              <span style={{ color: '#64748b' }}>
                Límite: C$ {infoCliente.limite.toFixed(2)}
              </span>
              {infoCliente.limite > 0 && (
                <span style={{ color: '#2563eb', fontWeight: 600 }}>
                  Disp: C$ {Math.max(0, infoCliente.limite - infoCliente.pendiente).toFixed(2)}
                </span>
              )}
            </div>
          )}
          {mostrarClientes && (
            <div style={{
              position: 'fixed',
              left: '50%',
              transform: tecladoVisible ? 'translateX(-50%)' : 'translate(-50%, -50%)',
              top: tecladoVisible ? 60 : '50%',
              bottom: tecladoVisible ? tecladoAltura + 20 : 'auto',
              width: '90vw', maxWidth: '400px',
              background: 'white', border: '1px solid #e2e8f0', borderRadius: '12px',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)', zIndex: 1000,
              maxHeight: tecladoVisible ? `calc(100vh - ${tecladoAltura + 80}px)` : '65vh',
              display: 'flex', flexDirection: 'column'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontWeight: 700, fontSize: '15px' }}>Seleccionar cliente</span>
                <button onClick={() => { setMostrarClientes(false); setBuscarCliente('') }}
                  style={{ width: '32px', height: '32px', borderRadius: '8px', border: 'none', background: '#f1f5f9', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', color: '#64748b' }}>
                  ✕
                </button>
              </div>
              <div style={{ padding: '8px 16px' }}>
                <input autoFocus type="text" placeholder="Buscar cliente..." value={buscarCliente} onChange={e => setBuscarCliente(e.target.value)}
                  style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none' }} />
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                <div onClick={() => { setClienteSeleccionado(null); setMostrarClientes(false); setBuscarCliente(''); setInfoCliente(null) }}
                  style={{ padding: '14px 16px', cursor: 'pointer', fontSize: '14px', color: 'var(--texto-secundario)', borderBottom: '1px solid #f1f5f9', background: !clienteSeleccionado ? '#f8fafc' : 'white', minHeight: '44px', display: 'flex', alignItems: 'center' }}>
                  <User size={16} style={{ marginRight: 6 }} /> Cliente general
                </div>
                {clientes.filter(c => c.nombre.toLowerCase().includes(buscarCliente.toLowerCase())).map(c => (
                  <div key={c.id} onClick={async () => {
                    setClienteSeleccionado(c); setMostrarClientes(false); setBuscarCliente('')
                    try {
                      const r = await fetch(`/api/facturas?clienteId=${c.id}&estado=credito&page=1&limit=1`)
                      const d = await r.json()
                      const totalFacturas = d.total || 0
                      setInfoCliente({ pendiente: totalFacturas, limite: c.limiteCredito || 0 })
                    } catch { setInfoCliente(null) }
                  }}
                    style={{ padding: '14px 16px', cursor: 'pointer', fontSize: '14px', borderBottom: '1px solid #f1f5f9', minHeight: '44px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: clienteSeleccionado?.id === c.id ? '#dbeafe' : 'white', color: clienteSeleccionado?.id === c.id ? '#2563eb' : 'var(--texto)' }}>
                    <div style={{ fontWeight: 600 }}>{c.nombre}</div>
                    {c.telefono && <div style={{ fontSize: '12px', color: '#94a3b8' }}>{c.telefono}</div>}
                  </div>
                ))}
                {clientes.filter(c => c.nombre.toLowerCase().includes(buscarCliente.toLowerCase())).length === 0 && (
                  <div style={{ padding: '16px', textAlign: 'center' }}>
                    <div style={{ color: '#94a3b8', fontSize: '13px', marginBottom: '8px' }}>No se encontr&oacute; &apos;{buscarCliente}&apos;</div>
                    <button onClick={() => { setNuevoCliente({ nombre: buscarCliente, telefono: '', direccion: '' }); setMostrarFormCliente(true); setMostrarClientes(false) }}
                      style={{ padding: '12px 24px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: '14px' }}>
                      <UserPlus size={16} style={{ marginRight: 4 }} /> Crear cliente rápido
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
          {mostrarClientes && <div onClick={() => { setMostrarClientes(false); setBuscarCliente('') }}
            style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 999 }} />}
        </div>

        {/* Payment input */}
        {(metodoPago === 'efectivo' || metodoPago === 'dolares') && metodosPago.length <= 1 && (
          <div>
            <label style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 600 }}>
              {metodoPago === 'dolares' ? 'Pago con ($)' : 'Pago con (C$)'}
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ flex: '0 0 45%' }}>
                <input ref={pagoRef} type="number" inputMode="none" value={pagoCon} onChange={e => setPagoCon(e.target.value)} placeholder="0.00"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none', minHeight: '42px' }} />
              </div>
              <div style={{ flex: 1 }}>
                {metodoPago === 'dolares' && pagoCon && parseFloat(pagoCon) > 0 && (
                  <div style={{ fontSize: '12px', color: tasaCambio > 0 ? 'var(--texto-secundario)' : '#dc2626', textAlign: 'center', marginBottom: '2px' }}>
                    {tasaCambio > 0 ? `= C$ ${pagoConCordobas.toFixed(2)} (tasa ${tasaCambio.toFixed(2)})` : 'Configurá la tasa de cambio en Configuración'}
                  </div>
                )}
                {pagoCon && parseFloat(pagoCon) > 0 && total > 0 && (
                  <div style={{ padding: '8px 10px', borderRadius: '8px', textAlign: 'center', fontSize: '14px', fontWeight: 700, whiteSpace: 'nowrap',
                    background: cambio >= 0 ? '#dcfce7' : '#fef2f2', color: cambio >= 0 ? '#16a34a' : '#dc2626' }}>
                    {cambio >= 0 ? `Cambio: C$ ${cambio.toFixed(2)}` : `Falta: C$ ${Math.abs(cambio).toFixed(2)}`}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => setMostrarParked(true)} disabled={carrito.length === 0}
            style={{ flex: 1, padding: '10px 6px', borderRadius: '8px', border: '1px solid #7c3aed', background: carrito.length === 0 ? '#f1f5f9' : '#f3e8ff', cursor: carrito.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, color: carrito.length === 0 ? '#94a3b8' : '#7c3aed', fontSize: '12px', opacity: carrito.length === 0 ? 0.5 : 1, minHeight: '40px' }}>
            <PauseCircle size={14} style={{ marginRight: 2 }} /> Pausar ticket
          </button>
          <button onClick={async () => { await cargarParked(); setMostrarParked(true) }} disabled={parkedSessions.length === 0}
            style={{ flex: 1, padding: '10px 6px', borderRadius: '8px', border: '1px solid #2563eb', background: parkedSessions.length === 0 ? '#f1f5f9' : '#dbeafe', cursor: parkedSessions.length === 0 ? 'not-allowed' : 'pointer', fontWeight: 600, color: parkedSessions.length === 0 ? '#94a3b8' : '#2563eb', fontSize: '12px', opacity: parkedSessions.length === 0 ? 0.5 : 1, minHeight: '40px' }}>
            <ClipboardList size={14} style={{ marginRight: 2 }} /> Tickets ({parkedSessions.length})
          </button>
          <button onClick={async () => { await cargarProformas(); setMostrarProformas(true) }}
            style={{ flex: 1, padding: '10px 6px', borderRadius: '8px', border: '1px solid #f59e0b', background: '#fffbeb', cursor: 'pointer', fontWeight: 600, color: '#d97706', fontSize: '12px', minHeight: '40px' }}>
            <FileText size={14} style={{ marginRight: 2 }} /> Proformas
          </button>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={limpiarCarrito}
            style={{ flex: 1, padding: '14px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600, color: '#dc2626', fontSize: '14px', minHeight: '48px' }}>
            <Trash2 size={16} style={{ marginRight: 4 }} /> Limpiar
          </button>
          <button onClick={procesarVenta} disabled={cargando || carrito.length === 0}
            className="btn-verde"
            style={{ flex: 2, padding: '14px 12px', fontSize: '16px', fontWeight: 700, minHeight: '48px' }}>
            {cargando ? <><Loader size={16} className="spin" /> Procesando...</> : <><CheckCircle size={18} /> Cobrar</>}
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
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Tickets en espera</h2>
                <button onClick={() => setMostrarParked(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><XCircle size={20} /></button>
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
                      if (!nombreParked.trim()) return mostrar('Escribí un nombre para el ticket', 'alerta')
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
                      <Save size={14} color="white" /> Guardar
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
                        if (!res.ok) return mostrar('Error al eliminar el ticket', 'error')
                        await cargarParked()
                        setMostrarParked(false)
                      }}
                        style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #16a34a', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>
                        <Play size={14} /> Reanudar
                      </button>
                      <button onClick={async () => {
                        await fetch(`/api/cart-sessions?id=${s.id}`, { method: 'DELETE' })
                        await cargarParked()
                      }}
                        style={{ padding: '6px 8px', borderRadius: '6px', border: 'none', background: '#fee2e2', color: '#dc2626', cursor: 'pointer', fontSize: '12px' }}>
                        <Trash2 size={14} />
                      </button>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

        {mostrarProformas && (
          <div style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
          }}>
            <div className="card" style={{ width: '480px', maxHeight: '80vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}>Proformas pendientes</h2>
                <button onClick={() => setMostrarProformas(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><XCircle size={20} /></button>
              </div>
              {cargandoProformas ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}><Loader size={24} className="spin" /></div>
              ) : proformasPendientes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8', fontSize: '13px' }}>No hay proformas pendientes</div>
              ) : (
                proformasPendientes.map(p => (
                  <div key={p.id} style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px', border: '1px solid #e2e8f0', borderRadius: '10px', marginBottom: '8px'
                  }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.numero}</div>
                      <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                        {p.cliente?.nombre || 'Sin cliente'} · {p.detalles?.length || 0} prod. · C$ {p.total.toFixed(2)}
                      </div>
                    </div>
                    <button onClick={() => cargarProformaEnPOS(p)}
                      style={{ padding: '6px 12px', borderRadius: '6px', border: '1px solid #f59e0b', background: '#fffbeb', color: '#d97706', cursor: 'pointer', fontWeight: 600, fontSize: '12px' }}>
                      Cargar en POS
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {mostrarFormCliente && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: tecladoVisible ? 'flex-start' : 'center',
          justifyContent: 'center',
          paddingTop: tecladoVisible ? 16 : 0,
          zIndex: 100
        }}>
          <div className="card" style={{ width: '380px', padding: '24px', marginBottom: tecladoVisible ? tecladoAltura + 16 : 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>+ Nuevo cliente rápido</h2>
                <button onClick={() => setMostrarFormCliente(false)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><XCircle size={20} /></button>
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
                if (!nuevoCliente.nombre.trim()) return mostrar('El nombre es obligatorio', 'alerta')
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
                  mostrar('Error al crear cliente', 'error')
                }
              }}
                style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>
                <Save size={16} /> Guardar y seleccionar
              </button>
            </div>
          </div>
        </div>
      )}

      {genericoModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
        }}>
          <div className="card" style={{ width: '380px', padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}><Star size={18} /> {genericoModal.nombre}</h2>
              <button onClick={() => setGenericoModal(null)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><XCircle size={20} /></button>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Cantidad ({genericoModal.unidad})</label>
                <input type="number" step="0.5" min="0.5" autoFocus value={genCantidad}
                  onChange={e => setGenCantidad(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '4px' }}>Total a cobrar (C$) *</label>
                <input type="number" step="0.01" min="0.01" value={genPrecio}
                  onChange={e => setGenPrecio(e.target.value)}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '16px', outline: 'none' }} />
              </div>
              {genPrecio && parseFloat(genPrecio) > 0 && genCantidad && parseFloat(genCantidad) > 0 && (
                <div style={{ padding: '10px', borderRadius: '8px', background: '#dcfce7', color: '#16a34a', fontWeight: 700, fontSize: '15px', textAlign: 'center' }}>
                  Total a cobrar: C$ {parseFloat(genPrecio).toFixed(2)}
                </div>
              )}
              <button onClick={() => {
                const total = parseFloat(genPrecio)
                const cant = parseFloat(genCantidad)
                if (!cant || cant <= 0) return mostrar('Ingresá una cantidad válida', 'alerta')
                if (!total || total <= 0) return mostrar('Ingresá el total a cobrar', 'alerta')
                const precioUnitario = total / cant
                setCarrito(prev => [...prev, {
                  ...genericoModal, cantidad: cant, _pres: 'base',
                  precio: precioUnitario, unidadVenta: genericoModal.unidad,
                  factorConversion: 1,
                }])
                setGenericoModal(null)
              }}
                style={{ padding: '12px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '15px' }}>
                <CheckCircle size={16} /> Agregar al carrito
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
            <Star size={48} color="#16a34a" style={{ marginBottom: '12px' }} />
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
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </>
  )
}

