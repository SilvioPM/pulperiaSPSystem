'use client'
import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import ReportePDF from '../components/ReportePDF'
import * as Icons from 'lucide-react'

const MODULOS = [
  { id: 'resumen', label: 'Resumen general', icono: 'BarChart3', necesitaFechas: false },
  { id: 'facturas', label: 'Facturas', icono: 'FileText', necesitaFechas: true, api: '/api/facturas' },
  { id: 'ventas', label: 'Ventas totales (detallado)', icono: 'DollarSign', necesitaFechas: true, api: '/api/facturas' },
  { id: 'ganancias', label: 'Ganancias totales', icono: 'TrendingUp', necesitaFechas: true, api: '/api/facturas' },
  { id: 'compras', label: 'Compras', icono: 'Package', necesitaFechas: true, api: '/api/compras' },
  { id: 'productos', label: 'Productos', icono: 'Tags', necesitaFechas: false, api: '/api/productos' },
  { id: 'clientes', label: 'Clientes', icono: 'Users', necesitaFechas: false, api: '/api/clientes' },
  { id: 'proveedores', label: 'Proveedores', icono: 'Building2', necesitaFechas: false, api: '/api/proveedores' },
  { id: 'inventario', label: 'Inventario (existencias)', icono: 'ClipboardList', necesitaFechas: false, api: '/api/productos' },
  { id: 'proformas', label: 'Proformas', icono: 'Edit', necesitaFechas: true, api: '/api/proformas' },
  { id: 'rentabilidad', label: 'Rentabilidad x producto', icono: 'TrendingUp', necesitaFechas: true, api: '/api/reportes?tipo=rentabilidad' },
  { id: 'morosos', label: 'Clientes morosos', icono: 'AlertTriangle', necesitaFechas: false, api: '/api/reportes?tipo=morosos' },
  { id: 'rotacion', label: 'Rotación inventario', icono: 'RefreshCw', necesitaFechas: true, api: '/api/reportes?tipo=rotacion' },
  { id: 'comparativo', label: 'Comparativo períodos', icono: 'BarChart3', necesitaFechas: true, api: '/api/reportes?tipo=comparativo' },
  { id: 'flujo-caja', label: 'Flujo de caja próximo', icono: 'DollarSign', necesitaFechas: false, api: '/api/reportes?tipo=flujo-caja' },
  { id: 'mermas', label: 'Mermas y ajustes', icono: 'AlertTriangle', necesitaFechas: true, api: '/api/reportes?tipo=mermas' },
  { id: 'pyl', label: 'Ganancias y pérdidas', icono: 'Wallet', necesitaFechas: true, api: '/api/reportes?tipo=ganancias' },
  { id: 'fiscal', label: 'Reporte fiscal', icono: 'FileText', necesitaFechas: true, api: '/api/reportes?tipo=fiscal' },
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
    { key: 'codigo', label: 'Código' },
    { key: 'categoria', label: 'Categoría' },
    { key: 'stock', label: 'Existencia', align: 'right' },
    { key: 'costo', label: 'Costo', align: 'right' },
    { key: 'precio', label: 'Precio', align: 'right' },
    { key: 'valorTotal', label: 'Valor total', align: 'right' },
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
  const [vistaVentas, setVistaVentas] = useState('dia')

  useEffect(() => {
    cargarReporte()
    cargarConfig()
  }, [])

  async function cargarConfig() {
    try { const res = await fetch('/api/config'); const data = await res.json(); setConfig(data) } catch {}
  }

  async function cargarReporte() {
    try {
      const mod = MODULOS.find(m => m.id === modulo)
      let url = '/api/reportes'
      const params = new URLSearchParams()
      if (mod?.api?.includes('?tipo=')) {
        const tipo = mod.api.split('?tipo=')[1]
        params.set('tipo', tipo)
      }
      if (desde) params.set('desde', desde)
      if (hasta) params.set('hasta', hasta)
      const qs = params.toString()
      if (qs) url += '?' + qs
      const res = await fetch(url)
      const data = await res.json()
      setReporte(data)
    } catch {}
  }

  async function buscarDatos() {
    setCargando(true)
    try {
      const mod = MODULOS.find(m => m.id === modulo)
      if (!mod || !mod.api) { setDatos([]); return }

      if (modulo === 'resumen' || mod.api.includes('?tipo=')) {
        await cargarReporte()
        setDatos([])
        setCargando(false)
        return
      }

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
          estado: item.estado === 'anulada' ? 'Anulada' : item.estado === 'credito' ? 'Crédito' : 'Pagada',
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
          producto: item.nombre || '-',
          codigo: item.codigo || '-',
          categoria: item.categoria?.nombre || '-',
          stock: item.stock || 0,
          costo: item.costo || 0,
          precio: item.precio || 0,
          valorTotal: ((item.stock || 0) * (item.costo || 0)).toFixed(2),
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

  async function exportarExcel() {
    const XLSX = await import('xlsx')
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
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--texto)', display: 'flex', alignItems: 'center', gap: 10 }}><Icons.BarChart3 size={24} /> Reportes</h1>
          <p style={{ color: 'var(--texto-secundario)', fontSize: '14px' }}>Consultá y exportá datos de todos los módulos</p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={imprimirPDF}
            style={{
              padding: '10px 16px', borderRadius: '8px', border: '1px solid #7c3aed',
              background: '#f3e8ff', color: '#7c3aed', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
            <Icons.FileText size={16} /> PDF
          </button>
          <button onClick={exportarExcel}
            style={{
              padding: '10px 16px', borderRadius: '8px', border: '1px solid #16a34a',
              background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              display: 'inline-flex', alignItems: 'center', gap: '6px'
            }}>
            <Icons.Download size={16} /> Excel
          </button>
        </div>
      </div>

      {/* Filtros */}
      <div className="card" style={{ marginBottom: '20px', display: 'flex', gap: '12px', alignItems: 'end', flexWrap: 'wrap' }}>
        <div>
          <label style={{ fontSize: '12px', fontWeight: 600, color: 'var(--texto-secundario)', display: 'block', marginBottom: '4px' }}>Módulo</label>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {(() => { const modItem = MODULOS.find(m => m.id === modulo); const IconC = modItem && Icons[modItem.icono]; return IconC ? <IconC size={20} /> : null })()}
            <select value={modulo} onChange={e => setModulo(e.target.value)}
              style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
              {MODULOS.map(m => (
                <option key={m.id} value={m.id}>{m.label}</option>
              ))}
            </select>
          </div>
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
              className="btn-verde" style={{ padding: '8px 20px', display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
              {cargando ? <Icons.Loader size={16} /> : <><Icons.Search size={16} /> Buscar</>}
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
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}><Icons.TrendingUp size={20} /> Ventas</h2>
                    <div style={{ display: 'flex', background: '#f1f5f9', borderRadius: '8px', overflow: 'hidden' }}>
                      <button onClick={() => setVistaVentas('dia')}
                        style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: vistaVentas === 'dia' ? '#16a34a' : 'transparent', color: vistaVentas === 'dia' ? 'white' : '#64748b', transition: 'all 0.15s' }}>
                        Por día
                      </button>
                      <button onClick={() => setVistaVentas('mes')}
                        style={{ padding: '6px 14px', border: 'none', cursor: 'pointer', fontSize: '12px', fontWeight: 600, background: vistaVentas === 'mes' ? '#16a34a' : 'transparent', color: vistaVentas === 'mes' ? 'white' : '#64748b', transition: 'all 0.15s' }}>
                        Por mes
                      </button>
                    </div>
                  </div>
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={vistaVentas === 'dia' ? (reporte.ventasPorDia || []) : (reporte.ventasPorMes || [])} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                      <XAxis dataKey={vistaVentas === 'dia' ? 'dia' : 'mes'} tick={{ fontSize: 12, fill: '#64748b' }} />
                      <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
                      <Tooltip formatter={(value) => [`C$ ${value.toFixed(2)}`, 'Total']}
                        contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                      <Bar dataKey="total" fill="#16a34a" radius={[6, 6, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="card">
                  <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}><Icons.Briefcase size={20} /> CXC / CXP</h2>
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
                  <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}><Icons.Trophy size={20} /> Top 5 productos</h2>
                  {(reporte.topProductos || []).slice(0, 5).map((p, i) => (
                    <div key={p.nombre} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '10px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                      <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? '#fef9c3' : '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 700 }}>
                        {i === 0 ? <Icons.Medal size={16} color="#f59e0b" fill="#f59e0b" /> : i === 1 ? <Icons.Medal size={16} color="#94a3b8" /> : i === 2 ? <Icons.Medal size={16} color="#b45309" /> : i + 1}
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
                  <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}><Icons.CreditCard size={20} /> Métodos de pago</h2>
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
                  <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: 8 }}><Icons.Package size={20} /> Inventario valorizado</h2>
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
      ) : modulo === 'rentabilidad' ? (
        reporte && <RentabilidadView data={reporte} />
      ) : modulo === 'morosos' ? (
        reporte && <MorososView data={reporte} />
      ) : modulo === 'rotacion' ? (
        reporte && <RotacionView data={reporte} />
      ) : modulo === 'comparativo' ? (
        reporte && <ComparativoView data={reporte} />
      ) : modulo === 'flujo-caja' ? (
        reporte && <FlujoCajaView data={reporte} />
      ) : modulo === 'mermas' ? (
        reporte && <MermasView data={reporte} />
      ) : modulo === 'ganancias' ? (
        reporte && <GananciasView data={reporte} />
      ) : modulo === 'fiscal' ? (
        reporte && <FiscalView data={reporte} />
      ) : (
        <>
          {cargando ? (
            <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}><Icons.Loader size={16} /> Cargando datos...</div>
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
                                  display: 'inline-flex', alignItems: 'center', gap: '4px',
                                  background: fila._raw?.estado === 'anulada' ? '#fee2e2' : fila._raw?.estado === 'credito' ? '#fef9c3' : '#dcfce7',
                                  color: fila._raw?.estado === 'anulada' ? '#dc2626' : fila._raw?.estado === 'credito' ? '#ca8a04' : '#16a34a'
                                }}>
                                  {fila._raw?.estado === 'anulada' ? <><Icons.XCircle size={14} /> Anulada</> : fila._raw?.estado === 'credito' ? <><Icons.ClipboardList size={14} /> Crédito</> : <><Icons.CheckCircle size={14} /> Pagada</>}
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

/* ── Componentes de vista para nuevos reportes ─────────────────── */

function RentabilidadView({ data }) {
  const [verCat, setVerCat] = useState(false)
  const items = verCat ? (data.categorias || []) : (data.productos || [])
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Ventas totales</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>C$ {data.resumen?.totalVentas?.toFixed(2)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Costo total</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>C$ {data.resumen?.totalCosto?.toFixed(2)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Ganancia · Margen</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>C$ {data.resumen?.totalGanancia?.toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>{data.resumen?.margenGeneral?.toFixed(1)}% de margen</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        <button onClick={() => setVerCat(false)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: !verCat ? 'white' : 'transparent', color: !verCat ? '#1e293b' : '#64748b', boxShadow: !verCat ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}><Icons.Package size={16} /> Por producto</button>
        <button onClick={() => setVerCat(true)} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 14, background: verCat ? 'white' : 'transparent', color: verCat ? '#1e293b' : '#64748b', boxShadow: verCat ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}><Icons.Tags size={16} /> Por categoría</button>
      </div>

      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>{verCat ? 'Categoría' : 'Producto'}</th>
              {!verCat && <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Categoría</th>}
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cantidad</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Ventas C$</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Costo C$</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Ganancia C$</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Margen</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Sin datos</td></tr>
            ) : items.map((item, i) => {
              const margen = item.margen || 0
              const colorMargen = margen > 30 ? '#16a34a' : margen > 10 ? '#ca8a04' : '#dc2626'
              return (
                <tr key={i} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{item.nombre}</td>
                  {!verCat && <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{item.categoria}</td>}
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>{item.cantidad}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {item.ventas?.toFixed(2)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {item.costoTotal?.toFixed(2)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: item.ganancia >= 0 ? '#16a34a' : '#dc2626' }}>C$ {item.ganancia?.toFixed(2)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}><span style={{ padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12, background: margen > 30 ? '#dcfce7' : margen > 10 ? '#fef9c3' : '#fee2e2', color: colorMargen }}>{margen.toFixed(1)}%</span></td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function MorososView({ data }) {
  if (!data) return null
  const total = data.total || 0
  const colores = ['#dc2626', '#ea580c', '#ca8a04', '#16a34a']
  const etiquetas = Object.keys(data.agrupado || {})
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        {etiquetas.map((e, i) => (
          <div key={e} className="card" style={{ borderLeft: `4px solid ${colores[i]}` }}>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{e}</div>
            <div style={{ fontSize: 20, fontWeight: 700, color: colores[i] }}>C$ {(data.agrupado[e] || 0).toFixed(2)}</div>
          </div>
        ))}
      </div>

      <div className="card" style={{ marginBottom: 16, padding: 16, background: total > 0 ? '#fef2f2' : '#dcfce7', borderRadius: 10 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Total cartera vencida: <strong style={{ color: '#dc2626' }}>C$ {total.toFixed(2)}</strong></span>
          <span style={{ fontSize: 13, color: '#64748b' }}>{data.cantidad || 0} factura(s) pendiente(s)</span>
        </div>
      </div>

      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Cliente</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Teléfono</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Factura</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Total</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Pendiente</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#475569' }}>Días</th>
              <th style={{ padding: '10px 16px', textAlign: 'center', fontSize: 13, fontWeight: 600, color: '#475569' }}>Estado</th>
            </tr>
          </thead>
          <tbody>
            {(data.clientes || []).length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>¡Todos al día! 🎉</td></tr>
            ) : data.clientes.map((c, i) => {
              const color = c.diasDeuda > 90 ? '#dc2626' : c.diasDeuda > 60 ? '#ea580c' : c.diasDeuda > 30 ? '#ca8a04' : '#16a34a'
              return (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '10px 16px', fontWeight: 600 }}>{c.cliente}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{c.telefono || '—'}</td>
                  <td style={{ padding: '10px 16px', fontSize: 13, color: '#2563eb', fontWeight: 600 }}>{c.numero}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {c.total?.toFixed(2)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700, color: '#dc2626' }}>C$ {c.saldoPendiente?.toFixed(2)}</td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}><span style={{ padding: '2px 10px', borderRadius: 6, fontWeight: 700, fontSize: 12, background: c.diasDeuda > 90 ? '#fee2e2' : c.diasDeuda > 30 ? '#fef9c3' : '#dcfce7', color }}>{c.diasDeuda}d</span></td>
                  <td style={{ padding: '10px 16px', textAlign: 'center' }}>
                    <span style={{ padding: '3px 10px', borderRadius: 12, fontSize: 11, fontWeight: 600, background: c.vencida ? '#fee2e2' : '#dcfce7', color: c.vencida ? '#dc2626' : '#16a34a' }}>{c.vencida ? 'VENCIDA' : 'Al día'}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function RotacionView({ data }) {
  const [filtroRot, setFiltroRot] = useState('todas')
  if (!data) return null
  const r = data.resumen || {}
  let items = data.conRotacion || []
  if (filtroRot === 'sin_movimiento') items = data.sinMovimiento || []
  else if (filtroRot === 'lenta') items = data.lenta || []
  else if (filtroRot === 'normal') items = data.normal || []
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Productos activos</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{r.totalProductos || 0}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Sin movimiento</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{(data.sinMovimiento || []).length}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Rotación lenta</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ea580c' }}>{(data.lenta || []).length}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Valor estancado</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>C$ {(r.valorEstancado || 0).toFixed(2)}</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, marginBottom: 16, background: '#f1f5f9', padding: 4, borderRadius: 10, width: 'fit-content' }}>
        {[
          { key: 'todas', label: `Todas (${(data.conRotacion || []).length})` },
          { key: 'sin_movimiento', label: `❌ Sin mov. (${(data.sinMovimiento || []).length})` },
          { key: 'lenta', label: `🐢 Lenta (${(data.lenta || []).length})` },
          { key: 'normal', label: `✅ Normal (${(data.normal || []).length})` },
        ].map(t => (
          <button key={t.key} onClick={() => setFiltroRot(t.key)}
            style={{ padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 13, background: filtroRot === t.key ? 'white' : 'transparent', color: filtroRot === t.key ? '#1e293b' : '#64748b', boxShadow: filtroRot === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Producto</th>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Categoría</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Stock</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Vendido</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Rotación</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Valor C$</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Sin datos</td></tr>
            ) : items.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600 }}>{p.nombre}</td>
                <td style={{ padding: '10px 16px', fontSize: 13, color: '#64748b' }}>{p.categoria}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>{p.stock}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>{p.vendido}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>
                  <span style={{ padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12, background: p.rotacion >= 3 ? '#dcfce7' : p.rotacion >= 1 ? '#fef9c3' : '#fee2e2', color: p.rotacion >= 3 ? '#16a34a' : p.rotacion >= 1 ? '#ca8a04' : '#dc2626' }}>
                    {p.rotacion}x
                  </span>
                </td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>C$ {(p.valorInventario || 0).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function ComparativoView({ data }) {
  if (!data) return null
  const { actual, anterior, diferencia } = data
  if (!actual) return <div className="card" style={{ padding: 20, textAlign: 'center', color: '#94a3b8' }}>Seleccioná ambos períodos para comparar</div>

  const metricas = [
    { key: 'ventas', label: 'Ventas totales', fmt: v => `C$ ${(v || 0).toFixed(2)}` },
    { key: 'ganancia', label: 'Ganancia', fmt: v => `C$ ${(v || 0).toFixed(2)}` },
    { key: 'margen', label: 'Margen %', fmt: v => `${(v || 0).toFixed(1)}%` },
    { key: 'numFacturas', label: 'Facturas', fmt: v => String(v || 0) },
    { key: 'numCompras', label: 'Compras', fmt: v => String(v || 0) },
  ]

  return (
    <div>
      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f1f5f9', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Métrica</th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Período actual</th>
              {anterior && <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Período anterior</th>}
              {diferencia && <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Diferencia</th>}
            </tr>
          </thead>
          <tbody>
            {metricas.map((m, i) => {
              const valActual = actual[m.key]
              const valAnt = anterior?.[m.key]
              const diff = diferencia?.[m.key]
              const diffPct = diferencia?.[m.key + 'Pct']
              const positivo = diff >= 0
              return (
                <tr key={m.key} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{m.label}</td>
                  <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700 }}>{m.fmt(valActual)}</td>
                  {anterior && <td style={{ padding: '12px 16px', textAlign: 'right', color: '#64748b' }}>{m.fmt(valAnt)}</td>}
                  {diferencia && (
                    <td style={{ padding: '12px 16px', textAlign: 'right', fontWeight: 700, color: positivo ? '#16a34a' : '#dc2626' }}>
                      {diffPct !== undefined ? `${positivo ? '+' : ''}${diffPct.toFixed(1)}%` : m.fmt(diff)}
                    </td>
                  )}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {diferencia && (
        <div style={{ marginTop: 16, padding: 16, borderRadius: 10, background: diferencia.ventasPct >= 0 ? '#dcfce7' : '#fee2e2', border: `1px solid ${diferencia.ventasPct >= 0 ? '#16a34a' : '#dc2626'}` }}>
          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>
            {diferencia.ventasPct >= 0 ? '📈 Crecimiento' : '📉 Decremento'} del {Math.abs(diferencia.ventasPct).toFixed(1)}% en ventas
          </div>
          <div style={{ fontSize: 13, color: '#64748b' }}>
            {diferencia.facturas > 0 ? `+${diferencia.facturas}` : diferencia.facturas} facturas vs. el período anterior
          </div>
        </div>
      )}
    </div>
  )
}

function FlujoCajaView({ data: initialData }) {
  const [dias, setDias] = useState(30)
  const [data, setData] = useState(initialData)
  if (!data) return null

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, alignItems: 'end', marginBottom: 20 }}>
        <div>
          <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 4 }}>Proyección a</label>
          <select value={dias} onChange={e => setDias(Number(e.target.value))}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}>
            <option value={7}>7 días</option>
            <option value={15}>15 días</option>
            <option value={30}>30 días</option>
            <option value={60}>60 días</option>
          </select>
        </div>
        <button onClick={async () => {
          const res = await fetch(`/api/reportes?tipo=flujo-caja&dias=${dias}`)
          const d = await res.json()
          setData(d)
        }} style={{ padding: '8px 20px', borderRadius: 8, border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontWeight: 600 }}>
          <Icons.Search size={16} /> Consultar
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Por cobrar (CXC)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>C$ {(data.totalCobrar || 0).toFixed(2)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Por pagar (CXP)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>C$ {(data.totalPagar || 0).toFixed(2)}</div>
        </div>
        <div className="card" style={{ borderLeft: `4px solid ${(data.saldoNeto || 0) >= 0 ? '#16a34a' : '#dc2626'}` }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Saldo neto próximo</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: (data.saldoNeto || 0) >= 0 ? '#16a34a' : '#dc2626' }}>C$ {(data.saldoNeto || 0).toFixed(2)}</div>
          <div style={{ fontSize: 12, color: '#94a3b8' }}>a {data.dias || 30} días</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.DollarSign size={18} color="#16a34a" /> Por cobrar (CXC)</h3>
          <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Cliente</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569' }}>Monto</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569' }}>Vence en</th>
              </tr></thead>
              <tbody>
                {(data.porCobrar || []).length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Sin cobros próximos</td></tr>
                ) : data.porCobrar.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{c.cliente}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#16a34a' }}>C$ {c.saldoPendiente.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13 }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: c.venceEn <= 7 ? '#fee2e2' : '#fef9c3', color: c.venceEn <= 7 ? '#dc2626' : '#ca8a04' }}>{c.venceEn}d</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.ShoppingCart size={18} color="#dc2626" /> Por pagar (CXP)</h3>
          <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Proveedor</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569' }}>Monto</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569' }}>Vence en</th>
              </tr></thead>
              <tbody>
                {(data.porPagar || []).length === 0 ? (
                  <tr><td colSpan={3} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Sin pagos próximos</td></tr>
                ) : data.porPagar.map((c, i) => (
                  <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{c.proveedor}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>C$ {c.saldoPendiente.toFixed(2)}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 13 }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, background: c.venceEn <= 7 ? '#fee2e2' : '#fef9c3', color: c.venceEn <= 7 ? '#dc2626' : '#ca8a04' }}>{c.venceEn}d</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function MermasView({ data }) {
  if (!data) return null
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Total mermas (unidades)</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#dc2626' }}>{(data.totalMermas || 0).toFixed(2)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #ea580c' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Movimientos</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#ea580c' }}>{data.cantidadMovimientos || 0}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Productos afectados</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>{(data.porProducto || []).length}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.AlertTriangle size={18} color="#dc2626" /> Por producto</h3>
          <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Producto</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569' }}>Cantidad</th>
              </tr></thead>
              <tbody>
                {(data.porProducto || []).length === 0 ? (
                  <tr><td colSpan={2} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Sin mermas registradas</td></tr>
                ) : data.porProducto.map((p, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{p.nombre}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontSize: 13, fontWeight: 700, color: '#dc2626' }}>{p.cantidad}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div>
          <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><Icons.ClipboardList size={18} color="#ea580c" /> Detalle de movimientos</h3>
          <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden', maxHeight: 400, overflowY: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead><tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0', position: 'sticky', top: 0 }}>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Producto</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569' }}>Tipo</th>
                <th style={{ padding: '8px 12px', textAlign: 'right', fontSize: 12, fontWeight: 600, color: '#475569' }}>Cant</th>
                <th style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: '#475569' }}>Motivo</th>
                <th style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, fontWeight: 600, color: '#475569' }}>Fecha</th>
              </tr></thead>
              <tbody>
                {(data.movimientos || []).length === 0 ? (
                  <tr><td colSpan={5} style={{ textAlign: 'center', padding: 20, color: '#94a3b8' }}>Sin movimientos</td></tr>
                ) : data.movimientos.map((m, i) => (
                  <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px 12px', fontSize: 13, fontWeight: 600 }}>{m.producto?.nombre || '—'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center' }}><span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 600, background: m.tipo === 'salida' ? '#fee2e2' : '#fef9c3', color: m.tipo === 'salida' ? '#dc2626' : '#ca8a04' }}>{m.tipo}</span></td>
                    <td style={{ padding: '8px 12px', textAlign: 'right', fontWeight: 700 }}>{m.cantidad}</td>
                    <td style={{ padding: '8px 12px', fontSize: 12, color: '#64748b' }}>{m.motivo || '—'}</td>
                    <td style={{ padding: '8px 12px', textAlign: 'center', fontSize: 12, color: '#64748b' }}>{new Date(m.creadoEn).toLocaleDateString('es-NI')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function FiscalView({ data }) {
  if (!data) return null
  const r = data.resumen || {}
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Ventas totales</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#16a34a' }}>C$ {(r.totalVentas || 0).toFixed(2)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>IVA total</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#7c3aed' }}>C$ {(r.totalIva || 0).toFixed(2)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Facturas emitidas</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#2563eb' }}>{r.numFacturas || 0}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>Clientes únicos</div>
          <div style={{ fontSize: 22, fontWeight: 700, color: '#f59e0b' }}>{r.numClientes || 0}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
        <div className="card" style={{ background: '#dcfce7' }}>
          <div style={{ fontSize: 13, color: '#15803d', marginBottom: 4 }}>Ventas al contado</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#16a34a' }}>C$ {(r.contado || 0).toFixed(2)}</div>
        </div>
        <div className="card" style={{ background: '#fef9c3' }}>
          <div style={{ fontSize: 13, color: '#92400e', marginBottom: 4 }}>Ventas al crédito</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: '#ca8a04' }}>C$ {(r.credito || 0).toFixed(2)}</div>
        </div>
      </div>

      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              <th style={{ padding: '10px 16px', textAlign: 'left', fontSize: 13, fontWeight: 600, color: '#475569' }}>Mes</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Facturas</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Ventas C$</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>IVA C$</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Descuentos C$</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Contado</th>
              <th style={{ padding: '10px 16px', textAlign: 'right', fontSize: 13, fontWeight: 600, color: '#475569' }}>Crédito</th>
            </tr>
          </thead>
          <tbody>
            {(data.porMes || []).length === 0 ? (
              <tr><td colSpan={7} style={{ textAlign: 'center', padding: 30, color: '#94a3b8' }}>Sin datos fiscales</td></tr>
            ) : data.porMes.map((m, i) => (
              <tr key={m.mes} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                <td style={{ padding: '10px 16px', fontWeight: 600 }}>{m.mes}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>{m.facturas}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', fontWeight: 700 }}>C$ {m.ventas?.toFixed(2)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', color: '#7c3aed', fontWeight: 600 }}>C$ {m.iva?.toFixed(2)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right', color: '#dc2626' }}>C$ {m.descuentos?.toFixed(2)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {m.contado?.toFixed(2)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {m.credito?.toFixed(2)}</td>
              </tr>
            ))}
            {(data.porMes || []).length > 0 && (
              <tr style={{ background: '#f1f5f9', fontWeight: 700, borderTop: '2px solid #94a3b8' }}>
                <td style={{ padding: '10px 16px' }}>TOTALES</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>{data.porMes.reduce((s, m) => s + m.facturas, 0)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {data.porMes.reduce((s, m) => s + m.ventas, 0).toFixed(2)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {data.porMes.reduce((s, m) => s + m.iva, 0).toFixed(2)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {data.porMes.reduce((s, m) => s + m.descuentos, 0).toFixed(2)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {data.porMes.reduce((s, m) => s + m.contado, 0).toFixed(2)}</td>
                <td style={{ padding: '10px 16px', textAlign: 'right' }}>C$ {data.porMes.reduce((s, m) => s + m.credito, 0).toFixed(2)}</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function GananciasView({ data }) {
  const [vista, setVista] = useState('dia')
  if (!data) return null
  const r = data.resumen || {}
  const series = vista === 'dia' ? data.porDia || [] : vista === 'quincena' ? data.porQuincena || [] : data.porMes || []

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10, marginBottom: 16 }}>
        <div style={{ borderRadius: 10, padding: 14, background: '#dcfce7', border: '1px solid #bbf7d0' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#16a34a' }}>Ventas</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#15803d' }}>C$ {r.ventas?.toFixed(2)}</div>
        </div>
        <div style={{ borderRadius: 10, padding: 14, background: '#fef3c7', border: '1px solid #fde68a' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#d97706' }}>Costo ventas</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#92400e' }}>C$ {r.costo?.toFixed(2)}</div>
        </div>
        <div style={{ borderRadius: 10, padding: 14, background: '#dbeafe', border: '1px solid #bfdbfe' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#2563eb' }}>Ganancia bruta</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#1d4ed8' }}>C$ {r.gananciaBruta?.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Margen: {r.margenBruto?.toFixed(1)}%</div>
        </div>
        <div style={{ borderRadius: 10, padding: 14, background: '#fce7f3', border: '1px solid #fbcfe8' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#db2777' }}>Gastos</div>
          <div style={{ fontSize: 18, fontWeight: 700, color: '#be185d' }}>C$ {r.gastos?.toFixed(2)}</div>
        </div>
        <div style={{ borderRadius: 10, padding: 14, background: (r.gananciaNeta || 0) >= 0 ? '#dcfce7' : '#fee2e2', border: '1px solid', borderColor: (r.gananciaNeta || 0) >= 0 ? '#bbf7d0' : '#fecaca' }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: (r.gananciaNeta || 0) >= 0 ? '#16a34a' : '#dc2626' }}>Ganancia neta</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: (r.gananciaNeta || 0) >= 0 ? '#15803d' : '#dc2626' }}>C$ {r.gananciaNeta?.toFixed(2)}</div>
          <div style={{ fontSize: 11, color: '#64748b' }}>Margen: {r.margenNeto?.toFixed(1)}%</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        {[
          { key: 'dia', label: 'Por día' },
          { key: 'quincena', label: 'Por quincena' },
          { key: 'mes', label: 'Por mes' },
        ].map(b => (
          <button key={b.key} onClick={() => setVista(b.key)}
            style={{ padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: vista === b.key ? '#16a34a' : 'white', color: vista === b.key ? 'white' : '#64748b' }}>
            {b.label}
          </button>
        ))}
      </div>

      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Período', 'Ventas', 'Costo', 'Ganancia bruta', 'Margen', 'Gastos', 'Ganancia neta', 'Margen neto'].map(h => (
                <th key={h} style={{ padding: '10px 14px', fontSize: 11, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'right' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {series.length === 0 ? (
              <tr><td colSpan={8} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>Sin datos en el período</td></tr>
            ) : (
              series.map((s, i) => {
                const margen = s.ventas > 0 ? (s.ganancia / s.ventas * 100) : 0
                const margenNetoVal = s.ventas > 0 ? ((s.ganancia - s.gastos) / s.ventas * 100) : 0
                return (
                  <tr key={s.periodo} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                    <td style={{ padding: '10px 14px', fontWeight: 600, textAlign: 'left' }}>{s.periodo}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#16a34a', fontWeight: 600 }}>C$ {s.ventas.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#d97706' }}>C$ {s.costo.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: s.ganancia >= 0 ? '#2563eb' : '#dc2626' }}>C$ {s.ganancia.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>{margen.toFixed(1)}%</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#db2777' }}>C$ {s.gastos.toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', fontWeight: 700, color: (s.ganancia - s.gastos) >= 0 ? '#15803d' : '#dc2626' }}>C$ {(s.ganancia - s.gastos).toFixed(2)}</td>
                    <td style={{ padding: '10px 14px', textAlign: 'right', color: '#64748b' }}>{margenNetoVal.toFixed(1)}%</td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
