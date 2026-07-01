'use client'
import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ReportePDF from '../components/ReportePDF'

const MODULOS = [
  { id: 'resumen', label: '📊 Resumen general', necesitaFechas: false },
  { id: 'facturas', label: '🧾 Facturas', necesitaFechas: true, api: '/api/facturas' },
  { id: 'ventas', label: '💰 Ventas totales (detallado)', necesitaFechas: true, api: '/api/facturas' },
  { id: 'ganancias', label: '📈 Ganancias totales', necesitaFechas: true, api: '/api/facturas' },
  { id: 'compras', label: '📦 Compras', necesitaFechas: true, api: '/api/compras' },
  { id: 'productos', label: '🏷️ Productos', necesitaFechas: false, api: '/api/productos' },
  { id: 'clientes', label: '👥 Clientes', necesitaFechas: false, api: '/api/clientes' },
  { id: 'proveedores', label: '🏢 Proveedores', necesitaFechas: false, api: '/api/proveedores' },
  { id: 'inventario', label: '📋 Mov. Inventario', necesitaFechas: true, api: '/api/inventario' },
  { id: 'proformas', label: '📝 Proformas', necesitaFechas: true, api: '/api/proformas' },
]

const COLUMNAS = {
  facturas: [
    { key: 'numero', label: 'N° Factura' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'total', label: 'Total', align: 'right' },
    { key: 'metodoPago', label: 'Pago' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha', label: 'Fecha' },
  ],
  ventas: [
    { key: 'cliente', label: 'Cliente' },
    { key: 'producto', label: 'Producto' },
    { key: 'cantidad', label: 'Cant', align: 'right' },
    { key: 'precio', label: 'Precio', align: 'right' },
    { key: 'subtotal', label: 'Subtotal', align: 'right' },
    { key: 'descuento', label: 'Desc', align: 'right' },
    { key: 'total', label: 'Total', align: 'right' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha', label: 'Fecha' },
  ],
  ganancias: [
    { key: 'factura', label: 'Factura' },
    { key: 'producto', label: 'Producto' },
    { key: 'cantidad', label: 'Cant', align: 'right' },
    { key: 'precio', label: 'Precio C$', align: 'right' },
    { key: 'costo', label: 'Costo C$', align: 'right' },
    { key: 'ganancia', label: 'Ganancia C$', align: 'right' },
    { key: 'margen', label: 'Margen %', align: 'right' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha', label: 'Fecha' },
  ],
  compras: [
    { key: 'numero', label: 'N° Compra' },
    { key: 'proveedor', label: 'Proveedor' },
    { key: 'total', label: 'Total', align: 'right' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha', label: 'Fecha' },
  ],
  productos: [
    { key: 'nombre', label: 'Producto' },
    { key: 'codigo', label: 'Código' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'precio', label: 'Precio', align: 'right' },
    { key: 'costo', label: 'Costo', align: 'right' },
    { key: 'stock', label: 'Stock', align: 'right' },
  ],
  clientes: [
    { key: 'nombre', label: 'Cliente' },
    { key: 'telefono', label: 'Teléfono' },
    { key: 'cedula', label: 'Cédula' },
  ],
  proveedores: [
    { key: 'nombre', label: 'Proveedor' },
    { key: 'contacto', label: 'Contacto' },
    { key: 'telefono', label: 'Teléfono' },
  ],
  inventario: [
    { key: 'producto', label: 'Producto' },
    { key: 'tipo', label: 'Tipo' },
    { key: 'cantidad', label: 'Cantidad', align: 'right' },
    { key: 'motivo', label: 'Motivo' },
    { key: 'fecha', label: 'Fecha' },
  ],
  proformas: [
    { key: 'numero', label: 'N° Proforma' },
    { key: 'cliente', label: 'Cliente' },
    { key: 'total', label: 'Total', align: 'right' },
    { key: 'estado', label: 'Estado' },
    { key: 'fecha', label: 'Fecha' },
  ],
}

export default function Reportes() {
  const [reporte, setReporte]       = useState(null)
  const [modulo, setModulo]         = useState('resumen')
  const [desde, setDesde]           = useState('')
  const [hasta, setHasta]           = useState('')
  const [datos, setDatos]           = useState([])
  const [config, setConfig]         = useState({})
  const [cargando, setCargando]     = useState(false)

  useEffect(() => {
    cargarReporte()
    cargarConfig()
  }, [])

  async function cargarConfig() {
    try { const res = await fetch('/api/config'); const data = await res.json(); setConfig(data) } catch {}
  }

  async function cargarReporte() {
    try {
      let url = '/api/reportes'
      if (desde || hasta) {
        const params = new URLSearchParams()
        if (desde) params.set('desde', desde)
        if (hasta) params.set('hasta', hasta)
        url += '?' + params.toString()
      }
      const res = await fetch(url)
      const data = await res.json()
      setReporte(data)
    } catch {}
  }

  async function buscarDatos() {
    setCargando(true)
    try {
      if (modulo === 'resumen') {
        await cargarReporte()
        setDatos([])
        return
      }

      const mod = MODULOS.find(m => m.id === modulo)
      if (!mod || !mod.api) { setDatos([]); return }

      let url = mod.api
      if (mod.necesitaFechas && (desde || hasta)) {
        const params = new URLSearchParams()
        if (desde) params.set('desde', desde)
        if (hasta) params.set('hasta', hasta)
        url += '?' + params.toString()
      }

      const res = await fetch(url)
      const data = await res.json()
      const arr = Array.isArray(data) ? data : (data.data || [])

      let mapeados
      if (modulo === 'ventas' || modulo === 'ganancias') {
        mapeados = arr.flatMap(factura => {
          const cliente = factura.cliente?.nombre || 'General'
          const fecha = new Date(factura.creadoEn).toLocaleDateString('es-NI')
          const descuento = factura.descuento || 0
          const detalles = factura.detalles || []
          if (detalles.length === 0) {
            if (modulo === 'ventas') {
              return [{
                cliente, producto: '(sin detalle)',
                cantidad: 0, precio: 0, subtotal: 0,
                descuento: descuento, total: factura.total || 0, estado: factura.estado, fecha, _raw: factura
              }]
            } else {
              return [{
                factura: factura.numero, producto: '(sin detalle)',
                cantidad: 0, precio: 0, costo: 0, ganancia: 0,
                margen: 0, estado: factura.estado, fecha, _raw: factura
              }]
            }
          }
          return detalles.map(d => {
            const cantidad = d.cantidad || 0
            const precio = d.precio || 0
            const costo = d.costo > 0 ? d.costo : (d.producto?.costo || 0)
            const subtotal = d.subtotal || (precio * cantidad)
            const nombre = d.producto?.nombre || 'Producto'
            if (modulo === 'ventas') {
              return {
                cliente, producto: nombre,
                cantidad, precio, subtotal,
                descuento, total: factura.total || 0, estado: factura.estado, fecha, _raw: factura
              }
            }
            const ganancia = (precio - costo) * cantidad
            const margen = precio > 0 ? ((precio - costo) / precio * 100) : 0
            return {
              factura: factura.numero, producto: nombre,
              cantidad, precio, costo, ganancia,
              margen, estado: factura.estado, fecha, _raw: factura
            }
          })
        })
      } else {
        mapeados = arr.map(item => mapearFila(modulo, item)).filter(Boolean)
      }
      setDatos(mapeados)
    } catch { setDatos([]) }
    setCargando(false)
  }

  useEffect(() => { buscarDatos() }, [modulo])

  function mapearFila(mod, item) {
    switch (mod) {
      case 'facturas':
        return {
          numero: item.numero,
          cliente: item.cliente?.nombre || 'General',
          total: item.total || 0,
          metodoPago: item.metodoPago || '-',
          estado: item.estado === 'anulada' ? '❌ Anulada' : item.estado === 'credito' ? '📋 Crédito' : '✅ Pagada',
          fecha: new Date(item.creadoEn).toLocaleDateString('es-NI'),
          _raw: item
        }
      case 'compras':
        return {
          numero: item.numero,
          proveedor: item.proveedor?.nombre || '-',
          total: item.total || 0,
          estado: item.estado || '-',
          fecha: new Date(item.creadoEn).toLocaleDateString('es-NI'),
          _raw: item
        }
      case 'productos':
        return {
          nombre: item.nombre,
          codigo: item.codigo || '-',
          categoria: item.categoria?.nombre || '-',
          precio: item.precio || 0,
          costo: item.costo || 0,
          stock: item.stock || 0,
          _raw: item
        }
      case 'clientes':
        return {
          nombre: item.nombre,
          telefono: item.telefono || '-',
          cedula: item.cedula || '-',
          _raw: item
        }
      case 'proveedores':
        return {
          nombre: item.nombre,
          contacto: item.contacto || '-',
          telefono: item.telefono || '-',
          _raw: item
        }
      case 'inventario':
        return {
          producto: item.producto?.nombre || '-',
          tipo: item.tipo === 'entrada' ? '📥 Entrada' : '📤 Salida',
          cantidad: item.cantidad || 0,
          motivo: item.motivo || '-',
          fecha: new Date(item.creadoEn).toLocaleDateString('es-NI'),
          _raw: item
        }
      case 'proformas':
        return {
          numero: item.numero,
          cliente: item.cliente?.nombre || 'General',
          total: item.total || 0,
          estado: item.estado || '-',
          fecha: new Date(item.creadoEn).toLocaleDateString('es-NI'),
          _raw: item
        }
      default:
        return null
    }
  }

  function formatearFilaPDF(fila, key) {
    if (key === 'total' || key === 'subtotal' || key === 'ganancia') return `C$ ${(fila[key] || 0).toFixed(2)}`
    if (key === 'precio' || key === 'costo') return `C$ ${(fila[key] || 0).toFixed(2)}`
    if (key === 'margen') return `${(fila[key] || 0).toFixed(1)}%`
    if (key === 'cantidad' || key === 'stock') return String(fila[key] ?? '')
    if (key === 'descuento') return `C$ ${(fila[key] || 0).toFixed(2)}`
    if (key === 'estado') return fila[key] ?? ''
    return fila[key] ?? ''
  }

  function exportarExcel() {
    const XLSX = require('xlsx')
    const wb = XLSX.utils.book_new()

    if (modulo === 'resumen' && reporte) {
      const resumen = [{
        'Métrica': 'Ventas totales', 'Valor': reporte.resumen?.totalVentas || 0
      }, {
        'Métrica': 'Costo total', 'Valor': reporte.resumen?.costoTotal || 0
      }, {
        'Métrica': 'Ganancia total', 'Valor': reporte.resumen?.gananciaTotal || 0
      }, {
        'Métrica': 'Margen %', 'Valor': reporte.resumen?.margenPct || 0
      }, {
        'Métrica': 'Total facturas', 'Valor': reporte.resumen?.numFacturas || 0
      }, {
        'Métrica': 'Ticket promedio', 'Valor': reporte.resumen?.ticketPromedio || 0
      }, {
        'Métrica': 'Valor inventario', 'Valor': reporte.resumen?.totalValorInventario || 0
      }]
      const ws1 = XLSX.utils.json_to_sheet(resumen)
      XLSX.utils.book_append_sheet(wb, ws1, 'Resumen')

      if (reporte.ventasPorDia?.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reporte.ventasPorDia), 'Ventas por día')
      }
      if (reporte.topProductos?.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reporte.topProductos), 'Top productos')
      }
      if (reporte.metodosPago?.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reporte.metodosPago), 'Métodos de pago')
      }
      if (reporte.inventario?.length) {
        XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(reporte.inventario), 'Inventario')
      }
    } else {
      const cols = COLUMNAS[modulo] || []
      const rows = datos.map(fila => {
        const obj = {}
        cols.forEach(c => { obj[c.label] = formatearFilaPDF(fila, c.key) })
        return obj
      })
      if ((modulo === 'ventas' || modulo === 'ganancias') && rows.length > 0) {
        const totalRow = {}
        cols.forEach(c => {
          if (c.key === 'cliente' || c.key === 'producto') totalRow[c.label] = 'TOTALES'
          else if (c.key === 'total') totalRow[c.label] = `C$ ${sumTotal.toFixed(2)}`
          else if (c.key === 'subtotal') totalRow[c.label] = `C$ ${sumSubtotal.toFixed(2)}`
          else if (c.key === 'descuento') totalRow[c.label] = `C$ ${sumDescuento.toFixed(2)}`
          else if (c.key === 'costo') totalRow[c.label] = `C$ ${sumCosto.toFixed(2)}`
          else if (c.key === 'ganancia') totalRow[c.label] = `C$ ${sumGanancia.toFixed(2)}`
          else if (c.key === 'precio') totalRow[c.label] = `C$ ${sumTotal.toFixed(2)}`
          else totalRow[c.label] = ''
        })
        rows.push(totalRow)
      }
      const ws = XLSX.utils.json_to_sheet(rows)
      const modLabel = MODULOS.find(m => m.id === modulo)?.label || modulo
      XLSX.utils.book_append_sheet(wb, ws, modLabel.replace(/[^\w\s]/g, '').trim())
    }

    XLSX.writeFile(wb, `reporte_${modulo}_${new Date().toISOString().split('T')[0]}.xlsx`)
  }

  const reporteRef = useRef()
  const imprimirPDF = useReactToPrint({ contentRef: reporteRef, documentTitle: `Reporte_${modulo}` })

  const colActual = modulo === 'resumen' ? [] : (COLUMNAS[modulo] || [])
  const datosValidos = datos.filter(f => f._raw?.estado !== 'anulada')
  const sumSubtotal = datosValidos.reduce((s, f) => s + (f.subtotal || 0), 0)
  const sumDescuento = datosValidos.reduce((s, f) => s + (f.descuento || 0), 0)
  const facturasUnicas = [...new Set(datosValidos.map(f => f._raw?.id || ''))]
  const sumTotal = modulo === 'ventas'
    ? facturasUnicas.reduce((s, id) => {
        const f = datosValidos.find(d => d._raw?.id === id)
        return s + (f?.total || 0)
      }, 0)
    : datosValidos.reduce((s, f) => s + (f.total || 0), 0)
  const sumCosto = datosValidos.reduce((s, f) => s + (f.costo || 0), 0)
  const sumGanancia = datosValidos.reduce((s, f) => s + (f.ganancia || 0), 0)

  return (
    <div>
      {/* Cabecera */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--texto)' }}>📊 Reportes</h1>
          <p style={{ color: 'var(--texto-secundario)', fontSize: '14px' }}>Consultá y exportá datos de todos los módulos</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={imprimirPDF}
            style={{
              padding: '10px 16px', borderRadius: '8px', border: '1px solid #7c3aed',
              background: '#f3e8ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 600, fontSize: '14px'
            }}>
            📄 PDF
          </button>
          <button onClick={exportarExcel}
            style={{
              padding: '10px 16px', borderRadius: '8px', border: '1px solid #16a34a',
              background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontWeight: 600, fontSize: '14px'
            }}>
            📥 Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--texto-secundario)', display: 'block', marginBottom: '4px' }}>Módulo</label>
          <select value={modulo} onChange={e => setModulo(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
            {MODULOS.map(m => (
              <option key={m.id} value={m.id}>{m.label}</option>
            ))}
          </select>
        </div>
        {(MODULOS.find(m => m.id === modulo)?.necesitaFechas || modulo === 'resumen') && (
          <>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--texto-secundario)', display: 'block', marginBottom: '4px' }}>Desde</label>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--texto-secundario)', display: 'block', marginBottom: '4px' }}>Hasta</label>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} />
            </div>
            <button onClick={buscarDatos} disabled={cargando}
              className="btn-verde" style={{ padding: '8px 20px' }}>
              {cargando ? '⏳' : '🔍 Buscar'}
            </button>
          </>
        )}
      </div>

      {/* Contenido según módulo */}
      {modulo === 'resumen' ? (
        <>
          {reporte && (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
                <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Ventas totales</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#16a34a' }}>C$ {reporte.resumen?.totalVentas?.toFixed(2) || '0.00'}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{reporte.resumen?.numFacturas || 0} facturas</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Ticket promedio</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#2563eb' }}>C$ {reporte.resumen?.ticketPromedio?.toFixed(2) || '0.00'}</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Ganancia</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#7c3aed' }}>C$ {reporte.resumen?.gananciaTotal?.toFixed(2) || '0.00'}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>Margen: {reporte.resumen?.margenPct?.toFixed(1) || '0'}%</div>
                </div>
                <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
                  <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Stock bajo</div>
                  <div style={{ fontSize: '26px', fontWeight: 700, color: '#f59e0b' }}>{reporte.stockBajo?.length || 0}</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div className="card">
                  <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>📈 Ventas por día</h2>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={reporte.ventasPorDia || []} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip formatter={(value) => [`C$ ${value.toFixed(2)}`, 'Total']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="total" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>💼 CXC / CXP</h2>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#dc2626' }}>Cuentas por Cobrar</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#dc2626' }}>C$ {reporte.resumen?.totalCXC?.toFixed(2) || '0.00'}</div>
                    </div>
                    <div style={{ background: '#fef9c3', borderRadius: '10px', padding: '16px', textAlign: 'center' }}>
                      <div style={{ fontSize: '12px', color: '#ca8a04' }}>Cuentas por Pagar</div>
                      <div style={{ fontSize: '22px', fontWeight: 700, color: '#ca8a04' }}>C$ {reporte.resumen?.totalCXP?.toFixed(2) || '0.00'}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
                <div className="card">
                  <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🏆 Top 5 productos</h2>
                  {(reporte.topProductos || []).slice(0, 5).map((p, i) => (
                    <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? '#fef9c3' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                        {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.nombre}</div>
                        <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.cantidad} uds · C$ {p.ventas?.toFixed(2)}</div>
                      </div>
                      <div style={{ fontWeight: 700, color: '#16a34a' }}>C$ {p.ventas?.toFixed(2)}</div>
                    </div>
                  ))}
                </div>

                <div className="card">
                  <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>💳 Métodos de pago</h2>
                  {['efectivo', 'tarjeta', 'transferencia', 'credito'].map(metodo => {
                    const m = (reporte.metodosPago || []).find(mm => mm.metodo === metodo)
                    const total = m?.total || 0
                    const totalGeneral = reporte.resumen?.totalVentas || 1
                    const pct = totalGeneral > 0 ? (total / totalGeneral) * 100 : 0
                    return (
                      <div key={metodo} style={{ marginBottom: '16px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                          <span style={{ fontSize: '14px', fontWeight: 600, textTransform: 'capitalize' }}>{metodo}</span>
                          <span style={{ fontSize: '13px', color: '#64748b' }}>C$ {total.toFixed(2)}</span>
                        </div>
                        <div style={{ background: '#f1f5f9', borderRadius: '10px', height: '8px' }}>
                          <div style={{ width: `${pct}%`, height: '8px', borderRadius: '10px', background: metodo === 'efectivo' ? '#16a34a' : metodo === 'tarjeta' ? '#2563eb' : metodo === 'transferencia' ? '#7c3aed' : '#dc2626' }} />
                        </div>
                        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>{pct.toFixed(1)}%</div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {reporte.inventario?.length > 0 && (
                <div className="card" style={{ marginBottom: '24px' }}>
                  <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>📦 Inventario valorizado</h2>
                  <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                      <thead>
                        <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                          <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Producto</th>
                          <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Stock</th>
                          <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Costo</th>
                          <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 600, color: '#475569' }}>Valor C$</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reporte.inventario.slice(0, 20).map(p => (
                          <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                            <td style={{ padding: '10px 16px', fontWeight: 600 }}>{p.nombre}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', color: p.stock <= p.stockMinimo ? '#dc2626' : 'inherit' }}>{p.stock}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {p.costo.toFixed(2)}</td>
                            <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>C$ {p.valorCosto.toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      ) : (
        <>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>⏳ Cargando datos...</div>
          ) : (
            <div className="card">
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                      {colActual.map(col => (
                        <th key={col.key} style={{ padding: '10px 16px', textAlign: col.align || 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>{col.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {datos.length === 0 ? (
                      <tr><td colSpan={colActual.length} style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>Sin datos para este período</td></tr>
                    ) : (
                      datos.map((fila, i) => (
                        <tr key={i} style={{
                          borderBottom: '1px solid #f1f5f9',
                          opacity: fila._raw?.estado === 'anulada' ? 0.5 : 1
                        }}>
                          {colActual.map(col => (
                            <td key={col.key} style={{ padding: '10px 16px', textAlign: col.align || 'left', fontSize: '13px' }}>
                              {col.key === 'estado' ? (
                                <span style={{
                                  padding: '3px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: 600,
                                  background: fila._raw?.estado === 'anulada' ? '#fee2e2' : fila._raw?.estado === 'credito' ? '#fef9c3' : '#dcfce7',
                                  color: fila._raw?.estado === 'anulada' ? '#dc2626' : fila._raw?.estado === 'credito' ? '#ca8a04' : '#16a34a'
                                }}>
                                  {fila._raw?.estado === 'anulada' ? '❌ Anulada' : fila._raw?.estado === 'credito' ? '📋 Crédito' : '✅ Pagada'}
                                </span>
                              ) : col.key === 'total' || col.key === 'subtotal' || col.key === 'ganancia' || col.key === 'precio' || col.key === 'costo' || col.key === 'descuento'
                                ? `C$ ${(fila[col.key] || 0).toFixed(2)}`
                                : col.key === 'margen'
                                ? `${(fila[col.key] || 0).toFixed(1)}%`
                                : col.key === 'cantidad' || col.key === 'stock'
                                ? (fila[col.key] ?? '')
                                : fila[col.key] ?? ''}
                            </td>
                          ))}
                        </tr>
                      ))
                    )}
                  </tbody>
                  {(modulo === 'ventas' || modulo === 'ganancias') && datos.length > 0 && (
                    <tfoot>
                      <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #94a3b8' }}>
                        {colActual.map(col => (
                          <td key={col.key} style={{ padding: '10px 16px', textAlign: col.align || 'left', fontSize: '14px' }}>
                            {col.key === 'total' ? `C$ ${sumTotal.toFixed(2)}`
                            : col.key === 'subtotal' ? `C$ ${sumSubtotal.toFixed(2)}`
                            : col.key === 'descuento' ? `C$ ${sumDescuento.toFixed(2)}`
                            : col.key === 'costo' ? `C$ ${sumCosto.toFixed(2)}`
                            : col.key === 'ganancia' ? `C$ ${sumGanancia.toFixed(2)}`
                            : col.key === 'precio' ? `C$ ${sumTotal.toFixed(2)}`
                            : modulo === 'ventas' && col.key === 'cliente' ? 'TOTALES'
                            : modulo === 'ganancias' && col.key === 'producto' ? 'TOTALES'
                            : ''}
                          </td>
                        ))}
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
              <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '12px' }}>
                {datos.length} registro(s) encontrados
              </div>
            </div>
          )}
        </>
      )}

      {/* Componente PDF oculto */}
      <div style={{ display: 'none' }}>
        {modulo === 'resumen' ? (
          <ReportePDF ref={reporteRef} config={config} titulo="Resumen General"
            columnas={[
              { key: 'metrica', label: 'Métrica' },
              { key: 'valor', label: 'Valor', align: 'right' },
            ]}
            datos={reporte ? [
              { metrica: 'Ventas totales', valor: `C$ ${(reporte.resumen?.totalVentas || 0).toFixed(2)}` },
              { metrica: 'Costo total', valor: `C$ ${(reporte.resumen?.costoTotal || 0).toFixed(2)}` },
              { metrica: 'Ganancia total', valor: `C$ ${(reporte.resumen?.gananciaTotal || 0).toFixed(2)}` },
              { metrica: 'Margen %', valor: `${(reporte.resumen?.margenPct || 0).toFixed(1)}%` },
              { metrica: 'Facturas', valor: String(reporte.resumen?.numFacturas || 0) },
              { metrica: 'Ticket promedio', valor: `C$ ${(reporte.resumen?.ticketPromedio || 0).toFixed(2)}` },
              { metrica: 'CXC', valor: `C$ ${(reporte.resumen?.totalCXC || 0).toFixed(2)}` },
              { metrica: 'CXP', valor: `C$ ${(reporte.resumen?.totalCXP || 0).toFixed(2)}` },
            ] : []}
            formatearFila={(f, k) => f[k]} />
        ) : (
          <ReportePDF ref={reporteRef} config={config}
            titulo={MODULOS.find(m => m.id === modulo)?.label || modulo}
            columnas={colActual}
            datos={(() => {
              if ((modulo === 'ventas' || modulo === 'ganancias') && datos.length > 0) {
                const totalRow = {}
                colActual.forEach(c => {
                  if (c.key === 'cliente' || c.key === 'producto') totalRow[c.key] = 'TOTALES'
                  else if (c.key === 'total') totalRow[c.key] = sumTotal
                  else if (c.key === 'subtotal') totalRow[c.key] = sumSubtotal
                  else if (c.key === 'descuento') totalRow[c.key] = sumDescuento
                  else if (c.key === 'costo') totalRow[c.key] = sumCosto
                  else if (c.key === 'ganancia') totalRow[c.key] = sumGanancia
                  else if (c.key === 'precio') totalRow[c.key] = sumTotal
                  else totalRow[c.key] = ''
                })
                return [...datos, totalRow]
              }
              return datos
            })()}
            formatearFila={formatearFilaPDF} />
        )}
      </div>
    </div>
  )
}
