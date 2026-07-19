'use client'
import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { auditar } from '@/lib/auditarClient'
import Toast from '@/app/components/Toast'
import { useToast } from '@/app/hooks/useToast'
import StockAlerta from '@/app/components/StockAlerta'
import BarcodeLabel, { PrintBarcodeLabel } from '@/app/components/BarcodeLabel'
import * as Icons from 'lucide-react'

export default function Productos() {
  const { puedeEditar, user } = useAuth()
  const editable = puedeEditar('productos')
  const { toast, mostrar, cerrar } = useToast()
  const [confirm, setConfirm] = useState(null) // { mensaje, onConfirm }
  const [tab, setTab]         = useState('productos')
  const [productos, setProductos]   = useState([])
  const [categorias, setCategorias] = useState([])
  const [unidades, setUnidades] = useState([])
  const [mostrarGestionUnidades, setMostrarGestionUnidades] = useState(false)
  const [formUnidad, setFormUnidad] = useState({ nombre: '' })
  const [editandoUnidad, setEditandoUnidad] = useState(null)
  const [mostrarFormProd, setMostrarFormProd] = useState(false)
  const [mostrarFormCat, setMostrarFormCat]   = useState(false)
  const [buscando, setBuscando]     = useState('')
  const [formProd, setFormProd]     = useState({
    nombre: '', codigo: '', precio: '', costo: '',
    stock: '', stockMinimo: '5', unidad: 'unidad',
    unidadVenta2: '', precioVenta2: '', costoVenta2: '', factorVenta2: '',
    unidadVenta3: '', precioVenta3: '', costoVenta3: '', factorVenta3: '',
    unidadVenta4: '', precioVenta4: '', costoVenta4: '', factorVenta4: '',
    categoriaId: '',
    esGenerico: false,
    precioMayor: '', cantidadMinimaMayor: '',
  })
  const [productoEditar, setProductoEditar] = useState(null)

  const [formCat, setFormCat]       = useState({ nombre: '' })
  const [mostrarImport, setMostrarImport] = useState(false)
  const [importando, setImportando]       = useState(false)
  const [resultImport, setResultImport]   = useState(null)
  const inputExcel                        = useRef(null) 
  const [cargando, setCargando]           = useState(true)
  const [mostrarInactivos, setMostrarInactivos] = useState(false)

  function generarCodigo(productosExistentes) {
    const maxId = productosExistentes.reduce((m, p) => Math.max(m, p.id || 0), 0)
    const sig = maxId + 1
    return `PUL${String(sig).padStart(6, '0')}`
  }

  useEffect(() => {
    Promise.all([cargarProductos(), cargarCategorias(), cargarUnidades()])
      .finally(() => setCargando(false))
  }, [mostrarInactivos])

  async function cargarProductos() {
    const res  = await fetch(`/api/productos?incluirInactivos=${mostrarInactivos}`)
    const data = await res.json()
    setProductos(data.data || data)
  }

  async function cargarCategorias() {
    const res  = await fetch('/api/categorias')
    const data = await res.json()
    setCategorias(data)
  }

  async function cargarUnidades() {
    const res  = await fetch('/api/unidades-medida')
    const data = await res.json()
    setUnidades(data)
  }

  async function guardarUnidad(e) {
    e.preventDefault()
    const metodo = editandoUnidad ? 'PUT' : 'POST'
    const body   = editandoUnidad ? { ...formUnidad, id: editandoUnidad.id } : formUnidad
    const res = await fetch('/api/unidades-medida', {
      method: metodo,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    })
    if (res.ok) {
      setFormUnidad({ nombre: '' })
      setEditandoUnidad(null)
      setMostrarGestionUnidades(false)
      cargarUnidades()
    }
  }

  async function eliminarUnidad(id) {
    if (!confirm('¿Desactivar esta unidad de medida?')) return
    await fetch(`/api/unidades-medida?id=${id}`, { method: 'DELETE' })
    cargarUnidades()
  }

  async function guardarProducto(e) {
    e.preventDefault()
    const res = await fetch('/api/productos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formProd)
    })
    if (res.ok) {
      setMostrarFormProd(false)
      setFormProd({ nombre: '', codigo: '', precio: '', costo: '',
                    stock: '', stockMinimo: '5', unidad: 'unidad',
                    unidadVenta2: '', precioVenta2: '', costoVenta2: '', factorVenta2: '',
                    unidadVenta3: '', precioVenta3: '', costoVenta3: '', factorVenta3: '',
                    unidadVenta4: '', precioVenta4: '', costoVenta4: '', factorVenta4: '',
                    categoriaId: '', esGenerico: false, precioMayor: '', cantidadMinimaMayor: '' })
      auditar(user?.username || user?.nombre, 'crear', 'producto', `Producto "${formProd.nombre}" creado`)
      cargarProductos()
    } else {
      mostrar('Error al guardar producto', 'error')
    }
  }

  async function guardarCategoria(e) {
    e.preventDefault()
    const res = await fetch('/api/categorias', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formCat)
    })
    if (res.ok) {
      setMostrarFormCat(false)
      setFormCat({ nombre: '' })
      cargarCategorias()
    } else {
      mostrar('Error al guardar categoría', 'error')
    }
  }

async function eliminarCategoria(id) {
  setConfirm({ mensaje: '¿Seguro que querés eliminar esta categoría?', onConfirm: async () => {
    try {
      const res  = await fetch(`/api/categorias?id=${id}`, { method: 'DELETE' })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) {
        mostrar(data.error || 'Error al eliminar', 'error')
      } else {
        cargarCategorias()
      }
    } catch (error) {
      mostrar('Error al eliminar categoría', 'error')
    }
  }})
}

async function guardarEdicion(e) {
  e.preventDefault()
  const res = await fetch(`/api/productos/${productoEditar.id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(productoEditar)
  })
  if (res.ok) {
    setProductoEditar(null)
    auditar(user?.username || user?.nombre, 'editar', 'producto', `Producto "${productoEditar.nombre}" editado`)
    cargarProductos()
  } else {
    mostrar('Error al editar producto', 'error')
  }
}
async function eliminarProducto(id) {
  setConfirm({ mensaje: '¿Seguro que querés eliminar este producto?', onConfirm: async () => {
    try {
      const res  = await fetch(`/api/productos/${id}`, { method: 'DELETE' })
      const text = await res.text()
      const data = text ? JSON.parse(text) : {}
      if (!res.ok) {
        mostrar(data.error || 'Error al eliminar', 'error')
      } else if (data.inactivado) {
        mostrar(data.motivo || 'Producto marcado como inactivo (tiene movimientos)', 'exito')
        auditar(user?.username || user?.nombre, 'inactivar', 'producto', `Producto ID ${id} marcado inactivo por tener movimientos`)
        cargarProductos()
      } else {
        auditar(user?.username || user?.nombre, 'eliminar', 'producto', `Producto ID ${id} eliminado`)
        cargarProductos()
      }
    } catch (error) {
      mostrar('Error al eliminar producto', 'error')
    }
  }})
}
// Descargar plantilla Excel de ejemplo
async function descargarPlantilla() {
  const XLSX = await import('xlsx')
  const datos = [
    {
      Nombre: 'Arroz Diana 1lb',
      Codigo: '001',
      Precio: 28,
      Costo: 22,
      Stock: 50,
      StockMinimo: 10,
      Unidad: 'libra',
      Categoria: 'Granos básicos',
      UnidadVenta2: 'quintal',
      PrecioVenta2: 2800,
      CostoVenta2: 2200,
      FactorVenta2: 100,
      UnidadVenta3: 'docena',
      PrecioVenta3: 336,
      CostoVenta3: 264,
      FactorVenta3: 12,
      UnidadVenta4: 'caja',
      PrecioVenta4: 560,
      CostoVenta4: 440,
      FactorVenta4: 20,
      PrecioMayor: 26,
      CantidadMinimaMayor: 12,
      FechaVencimiento: '2026-12-31'
    },
    {
      Nombre: 'Coca Cola 500ml',
      Codigo: '002',
      Precio: 25,
      Costo: 18,
      Stock: 24,
      StockMinimo: 6,
      Unidad: 'unidad',
      Categoria: 'Bebidas',
      UnidadVenta2: 'caja',
      PrecioVenta2: 288,
      CostoVenta2: 200,
      FactorVenta2: 12,
      PrecioMayor: 22,
      CantidadMinimaMayor: 24
    },
    {
      Nombre: 'Chiverías surtidas',
      Codigo: '003',
      Precio: 5,
      Costo: 3,
      Stock: 100,
      StockMinimo: 20,
      Unidad: 'unidad',
      Categoria: 'Chivería'
    }
  ]
  const ws = XLSX.utils.json_to_sheet(datos)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Productos')
  XLSX.writeFile(wb, 'plantilla_productos.xlsx')
}

// Importar el Excel
async function importarExcel(e) {
  const archivo = e.target.files[0]
  if (!archivo) return

  setImportando(true)
  setResultImport(null)

  const formData = new FormData()
  formData.append('archivo', archivo)

  try {
    const res  = await fetch('/api/productos/importar', {
      method: 'POST',
      body: formData
    })
    const data = await res.json()
    setResultImport(data)
    cargarProductos()
    cargarCategorias()
  } catch (error) {
    mostrar('Error al importar archivo', 'error')
  }

  setImportando(false)
  // Limpiamos el input para permitir subir el mismo archivo de nuevo
  e.target.value = ''
}

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(buscando.toLowerCase()) ||
    (p.codigo && p.codigo.toLowerCase().includes(buscando.toLowerCase()))
  )

  // Colores para las categorías
  const colores = [
    '#dcfce7', '#dbeafe', '#fef9c3', '#fce7f3',
    '#f3e8ff', '#ffedd5', '#e0f2fe', '#fee2e2'
  ]
  const coloresTexto = [
    '#16a34a', '#2563eb', '#ca8a04', '#db2777',
    '#7c3aed', '#ea580c', '#0284c7', '#dc2626'
  ]

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>

  return (
    <div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
      {confirm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
        }}>
          <div style={{
            background: '#fff', borderRadius: 12, padding: 24, width: 380,
            boxShadow: '0 4px 24px rgba(0,0,0,0.15)', textAlign: 'center'
          }}>
            <p style={{ fontSize: 15, color: '#1e293b', marginBottom: 20, fontWeight: 500 }}>
              {confirm.mensaje}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button onClick={() => setConfirm(null)}
                style={{
                  padding: '8px 24px', borderRadius: 8, border: '1px solid #e2e8f0',
                  background: '#fff', color: '#475569', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}>
                Cancelar
              </button>
              <button onClick={() => { confirm.onConfirm(); setConfirm(null) }}
                style={{
                  padding: '8px 24px', borderRadius: 8, border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer'
                }}>
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
            {tab === 'productos' ? <><Icons.Package size={24} /> Productos</> : <><Icons.Tags size={24} /> Categorías</>}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {tab === 'productos'
              ? `${productos.length} productos registrados`
              : `${categorias.length} categorías registradas`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <StockAlerta />
                {tab === 'productos' && editable && (
                <>
            <input
                ref={inputExcel}
                type="file"
                accept=".xlsx,.xls"
                onChange={importarExcel}
                style={{ display: 'none' }}
            />
            <button
                onClick={descargarPlantilla}
                style={{
                    padding: '10px 16px', borderRadius: '8px',
                    border: '1px solid #e2e8f0', background: 'white',
                    cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#475569'
                }}>
                <Icons.Download size={16} /> Plantilla Excel
            </button>
            <button
                onClick={() => inputExcel.current.click()}
                disabled={importando}
                style={{
                    padding: '10px 16px', borderRadius: '8px',
                    border: '1px solid #2563eb', background: '#dbeafe',
                    cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#2563eb'
                }}>
                {importando ? <><Icons.Loader size={16} /> Importando...</> : <><Icons.Upload size={16} /> Importar Excel</>}
            </button>
        </>
    )}
          <button
            className="btn-verde"
            onClick={() => tab === 'productos' ? setMostrarFormProd(true) : setMostrarFormCat(true)}
            style={{ display: editable ? undefined : 'none' }}>
            {tab === 'productos' ? '+ Nuevo Producto' : '+ Nueva Categoría'}
          </button>
</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { key: 'productos',  label: <><Icons.Package size={16} /> Productos</>  },
          { key: 'categorias', label: <><Icons.Tags size={16} /> Categorías</> },
        ].map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              background: tab === t.key ? 'white' : 'transparent',
              color: tab === t.key ? '#1e293b' : '#64748b',
              boxShadow: tab === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── TAB PRODUCTOS ────────────────────────────────────── */}
      {tab === 'productos' && (
        <>
            {/* Resultado de importación */}
            {resultImport && (
                <div style={{
                        marginBottom: '20px', padding: '16px', borderRadius: '12px',
                        background: resultImport.fallidos > 0 ? '#fef9c3' : '#dcfce7',
                        border: `1px solid ${resultImport.fallidos > 0 ? '#fde047' : '#16a34a'}`
                }}>
                <div style={{ fontWeight: 700, marginBottom: '8px', fontSize: '15px' }}>
                    {resultImport.fallidos === 0 ? '✅' : '⚠️'} Importación completada
                </div>
                <div style={{ fontSize: '14px', display: 'flex', gap: '20px' }}>
                    <span style={{ color: '#16a34a', fontWeight: 600 }}>
                         ✓ {resultImport.exitosos} productos importados
                    </span>
                    {resultImport.fallidos > 0 && (
                    <span style={{ color: '#dc2626', fontWeight: 600 }}>
                         ✗ {resultImport.fallidos} fallidos
                    </span>
                    )}
                </div>
                {resultImport.errores?.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                    {resultImport.errores.map((err, i) => (
                    <div key={i} style={{ fontSize: '12px', color: '#92400e', marginTop: '4px' }}>
                        ⚠ {err}
          </div>
        ))}
      </div>
    )}
    <button
      onClick={() => setResultImport(null)}
      style={{
        marginTop: '10px', padding: '4px 12px', borderRadius: '6px',
        border: '1px solid #e2e8f0', background: 'white',
        cursor: 'pointer', fontSize: '12px'
      }}>
      Cerrar
    </button>
  </div>
)}

          <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input type="text"
                placeholder="Buscar producto..."
                value={buscando}
                onChange={e => setBuscando(e.target.value)}
                style={{
                  flex: 1, padding: '10px 14px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none'
                }}
              />
              <button onClick={() => { setMostrarInactivos(!mostrarInactivos); setBuscando('') }}
                style={{
                  padding: '10px 14px', borderRadius: '8px', border: '1px solid #cbd5e1',
                  background: mostrarInactivos ? '#fef3c7' : 'white',
                  cursor: 'pointer', fontSize: '13px', fontWeight: 600, whiteSpace: 'nowrap',
                  color: mostrarInactivos ? '#92400e' : '#64748b'
                }}>
                {mostrarInactivos ? '✓ Mostrando inactivos' : 'Mostrar inactivos'}
              </button>
            </div>
          </div>

          <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Producto', 'Categoría', 'Precio', 'Costo', 'Stock', 'Mín.', 'Estado', ...(editable ? ['Acciones'] : [])].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={editable ? 8 : 7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      No hay productos aún
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.nombre} {p.esGenerico && <span style={{ background: '#fef3c7', color: '#92400e', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginLeft: 4 }}>Genérico</span>} {!p.activo && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: '10px', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', marginLeft: 4 }}>Inactivo</span>}</div>
                        {p.codigo && (
                          <div style={{ fontSize: '12px', color: '#94a3b8', display: 'flex', alignItems: 'center', gap: 6, marginTop: 2 }}>
                            <Icons.ScanBarcode size={12} /> #{p.codigo}
                            <PrintBarcodeLabel codigo={p.codigo} nombre={p.nombre} precio={p.precio} />
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '12px 16px' }}>
                        <span style={{
                          background: '#f1f5f9', padding: '4px 10px',
                          borderRadius: '20px', fontSize: '12px', fontWeight: 600, color: '#475569'
                        }}>
                          {p.categoria?.nombre || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: '#16a34a' }}>
                        C$ {(p.precio || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        C$ {(p.costo || 0).toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', fontWeight: 700, color: p.stock <= p.stockMinimo ? '#dc2626' : '#1e293b' }}>
                        {p.stock}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.stockMinimo}</td>
                      <td style={{ padding: '12px 16px' }}>
                        {p.stock === 0 ? (
                          <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>Agotado</span>
                        ) : p.stock <= p.stockMinimo ? (
                          <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>⚠️ Bajo</span>
                        ) : (
                          <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>✓ OK</span>
                        )}
                      </td>
                      {editable && (
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={async () => {
                              setProductoEditar({
                                ...p,
                                categoriaId: p.categoriaId,
                                precio: p.precio,
                                costo: p.costo,
                                stock: p.stock,
                                stockMinimo: p.stockMinimo
                              })
                            }}
                            style={{
                              padding: '6px 10px', borderRadius: '6px',
                              border: '1px solid #dbeafe', background: '#dbeafe',
                              cursor: 'pointer', fontSize: '13px', color: '#2563eb', fontWeight: 600
                            }}>
                            ✏️
                          </button>
                          {mostrarInactivos && !p.activo && (
                            <button onClick={async () => {
                              await fetch(`/api/productos/${p.id}`, {
                                method: 'PUT',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ ...p, activo: true })
                              })
                              cargarProductos()
                            }}
                              style={{
                                padding: '6px 10px', borderRadius: '6px',
                                border: '1px solid #bbf7d0', background: '#dcfce7',
                                cursor: 'pointer', fontSize: '12px', color: '#16a34a', fontWeight: 700
                              }}>
                              Reactivar
                            </button>
                          )}
                          <button
                            onClick={() => eliminarProducto(p.id)}
                            style={{
                              padding: '6px 10px', borderRadius: '6px',
                              border: '1px solid #fee2e2', background: '#fee2e2',
                              cursor: 'pointer', fontSize: '13px', color: '#dc2626', fontWeight: 600
                            }}>
                            <Icons.Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* ── TAB CATEGORÍAS ───────────────────────────────────── */}
      {tab === 'categorias' && (
        <>
          {categorias.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '60px' }}>
              <div style={{ fontSize: '48px', marginBottom: '12px' }}><Icons.Tags size={48} /></div>
              <p style={{ color: '#94a3b8', marginBottom: '16px' }}>No hay categorías aún</p>
              <button className="btn-verde" onClick={() => setMostrarFormCat(true)}
                style={{ display: editable ? undefined : 'none' }}>
                + Crear primera categoría
              </button>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px' }}>
              {categorias.map((cat, i) => {
                const prodsCat = productos.filter(p => p.categoriaId === cat.id).length
                const colorBg  = colores[i % colores.length]
                const colorTx  = coloresTexto[i % coloresTexto.length]
                return (
                  <div key={cat.id} className="card" style={{ borderTop: `4px solid ${colorTx}`, position: 'relative' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: colorBg, display: 'flex', alignItems: 'center',
                      justifyContent: 'center', marginBottom: '12px'
                    }}>
                      <Icons.Tags size={24} />
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
                      {cat.nombre}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                      {prodsCat} producto{prodsCat !== 1 ? 's' : ''}
                    </div>
                    {editable && (
                    <button
                      onClick={() => eliminarCategoria(cat.id)}
                      style={{
                        width: '100%', padding: '8px', borderRadius: '8px',
                        border: '1px solid #fee2e2', background: '#fff5f5',
                        color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                      }}>
                      <Icons.Trash2 size={16} /> Eliminar
                    </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* Modal nuevo producto */}
      {mostrarFormProd && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>➕ Nuevo Producto</h2>
              <button onClick={() => setMostrarFormProd(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={guardarProducto}>
              {[
                { key: 'nombre', label: 'Nombre *', placeholder: 'Ej: Arroz Diana 1lb', required: true },
                { key: 'codigo', label: 'Código', placeholder: 'Ej: 001', required: false },
              ].map(campo => (
                <div key={campo.key} style={{ marginBottom: '16px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    {campo.label}
                  </label>
                  <input required={campo.required} value={formProd[campo.key]}
                    onChange={e => setFormProd({...formProd, [campo.key]: e.target.value})}
                    placeholder={campo.placeholder}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                  {campo.key === 'codigo' && (
                    <button type="button" onClick={() => setFormProd({...formProd, codigo: generarCodigo(productos)})}
                      style={{ marginTop: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <Icons.ScanBarcode size={14} /> Generar código
                    </button>
                  )}
                </div>
              ))}
              {formProd.codigo && (
                <div style={{ marginBottom: 16, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
                  <BarcodeLabel codigo={formProd.codigo} nombre={formProd.nombre} precio={formProd.precio} tamano="chico" />
                  <div style={{ marginTop: 8 }}><PrintBarcodeLabel codigo={formProd.codigo} nombre={formProd.nombre} precio={formProd.precio} /></div>
                </div>
              )}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                {[
                  { key: 'precio', label: 'Precio venta (C$) *', required: true },
                  { key: 'costo',  label: 'Costo (C$)',           required: false },
                  { key: 'stock',  label: 'Stock inicial',        required: false },
                  { key: 'stockMinimo', label: 'Stock mínimo',    required: false },
                ].map(campo => (
                  <div key={campo.key}>
                    <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                      {campo.label}
                    </label>
                    <input type="number" step="0.01" required={campo.required}
                      value={formProd[campo.key]}
                      onChange={e => setFormProd({...formProd, [campo.key]: e.target.value})}
                      placeholder="0"
                      style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                    />
                  </div>
                ))}
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Unidad</label>
                  <select value={formProd.unidad} onChange={e => setFormProd({...formProd, unidad: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                    <option value="">Seleccioná...</option>
                    {unidades.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
                  </select>
                  <button type="button" onClick={() => setMostrarGestionUnidades(true)}
                    style={{ marginTop: 4, fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
                    Gestionar unidades
                  </button>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Categoría *</label>
                  <select required value={formProd.categoriaId} onChange={e => setFormProd({...formProd, categoriaId: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                    <option value="">Seleccioná...</option>
                    {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  <input type="checkbox" checked={formProd.esGenerico}
                    onChange={e => setFormProd({...formProd, esGenerico: e.target.checked})}
                    style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
                  Producto genérico (precio variable, no afecta inventario)
                </label>
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>
                  Fecha de vencimiento <span style={{ fontWeight: 400, color: '#94a3b8' }}>(opcional)</span>
                </label>
                <input type="date" value={formProd.fechaVencimiento || ''}
                  onChange={e => setFormProd({...formProd, fechaVencimiento: e.target.value || null})}
                  style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
              </div>
              {/* Precio Mayorista */}
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}><Icons.TrendingUp size={14} /> Precio mayorista (opcional)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio mayorista (C$)</label>
                    <input type="number" step="0.01" min="0" value={formProd.precioMayor || ''}
                      onChange={e => setFormProd({...formProd, precioMayor: e.target.value})}
                      placeholder="0" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Cantidad mínima</label>
                    <input type="number" step="0.5" min="0" value={formProd.cantidadMinimaMayor || ''}
                      onChange={e => setFormProd({...formProd, cantidadMinimaMayor: e.target.value})}
                      placeholder="Ej: 12" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
                  </div>
                </div>
              </div>
              {/* Segunda presentación */}
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}><Icons.Package size={14} /> Segunda presentación (opcional)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Unidad</label>
                    <select value={formProd.unidadVenta2 || ''} onChange={e => setFormProd({...formProd, unidadVenta2: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}>
                      <option value="">Ninguna</option>
                      {unidades.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio (C$)</label>
                    <input type="number" step="0.01" value={formProd.precioVenta2 || ''}
                      onChange={e => setFormProd({...formProd, precioVenta2: e.target.value})}
                      placeholder="0"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Costo (C$)</label>
                    <input type="number" step="0.01" value={formProd.costoVenta2 || ''}
                      onChange={e => setFormProd({...formProd, costoVenta2: e.target.value})}
                      placeholder="0"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Equivale a (en unidades base)</label>
                    <input type="number" step="1" value={formProd.factorVenta2 || ''}
                      onChange={e => setFormProd({...formProd, factorVenta2: e.target.value})}
                      placeholder="100"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
                  Ejemplo: si la unidad base es &quot;libra&quot; y vendés por &quot;quintal&quot;, el factor es 100
                </div>
              </div>
              {/* Tercera presentación */}
              <div style={{ marginBottom: '20px', padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '10px' }}><Icons.Package size={14} /> Tercera presentación (opcional)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Unidad</label>
                    <select value={formProd.unidadVenta3 || ''} onChange={e => setFormProd({...formProd, unidadVenta3: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}>
                      <option value="">Ninguna</option>
                      {unidades.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio (C$)</label>
                    <input type="number" step="0.01" value={formProd.precioVenta3 || ''}
                      onChange={e => setFormProd({...formProd, precioVenta3: e.target.value})}
                      placeholder="0"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Costo (C$)</label>
                    <input type="number" step="0.01" value={formProd.costoVenta3 || ''}
                      onChange={e => setFormProd({...formProd, costoVenta3: e.target.value})}
                      placeholder="0"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Equivale a (en unidades base)</label>
                    <input type="number" step="1" value={formProd.factorVenta3 || ''}
                      onChange={e => setFormProd({...formProd, factorVenta3: e.target.value})}
                      placeholder="100"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
              {/* Cuarta presentación */}
              <div style={{ marginBottom: '20px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '10px' }}><Icons.Package size={14} /> Cuarta presentación (opcional)</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Unidad</label>
                    <select value={formProd.unidadVenta4 || ''} onChange={e => setFormProd({...formProd, unidadVenta4: e.target.value})}
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}>
                      <option value="">Ninguna</option>
                      {unidades.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio (C$)</label>
                    <input type="number" step="0.01" value={formProd.precioVenta4 || ''}
                      onChange={e => setFormProd({...formProd, precioVenta4: e.target.value})}
                      placeholder="0"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Costo (C$)</label>
                    <input type="number" step="0.01" value={formProd.costoVenta4 || ''}
                      onChange={e => setFormProd({...formProd, costoVenta4: e.target.value})}
                      placeholder="0"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Equivale a (en unidades base)</label>
                    <input type="number" step="1" value={formProd.factorVenta4 || ''}
                      onChange={e => setFormProd({...formProd, factorVenta4: e.target.value})}
                      placeholder="100"
                      style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                    />
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setMostrarFormProd(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  <Icons.Save size={16} /> Guardar Producto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal nueva categoría */}
      {mostrarFormCat && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}><Icons.Tags size={16} /> Nueva Categoría</h2>
              <button onClick={() => setMostrarFormCat(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={guardarCategoria}>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Nombre de la categoría *
                </label>
                <input required value={formCat.nombre}
                  onChange={e => setFormCat({ nombre: e.target.value })}
                  placeholder="Ej: Granos básicos, Chivería, Ropa..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setMostrarFormCat(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  <Icons.Save size={16} /> Guardar Categoría
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Modal editar producto */}
{productoEditar && (
  <div style={{
    position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
    display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
  }}>
    <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700 }}>✏️ Editar Producto</h2>
        <button onClick={() => setProductoEditar(null)}
          style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
      </div>

      <form onSubmit={guardarEdicion}>
        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Nombre *
          </label>
          <input required value={productoEditar.nombre}
            onChange={e => setProductoEditar({...productoEditar, nombre: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
          />
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
            Código
          </label>
          <input value={productoEditar.codigo || ''}
            onChange={e => setProductoEditar({...productoEditar, codigo: e.target.value})}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
          />
          {!productoEditar.codigo && (
            <button type="button" onClick={() => setProductoEditar({...productoEditar, codigo: generarCodigo(productos)})}
              style={{ marginTop: 6, padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0', background: '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#475569', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Icons.ScanBarcode size={14} /> Generar código
            </button>
          )}
          {productoEditar.codigo && (
            <div style={{ marginTop: 12, padding: 12, background: '#f8fafc', borderRadius: 8, border: '1px solid #e2e8f0', textAlign: 'center' }}>
              <BarcodeLabel codigo={productoEditar.codigo} nombre={productoEditar.nombre} precio={productoEditar.precio} tamano="chico" />
              <div style={{ marginTop: 8 }}><PrintBarcodeLabel codigo={productoEditar.codigo} nombre={productoEditar.nombre} precio={productoEditar.precio} /></div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
          {[
            { key: 'precio', label: 'Precio venta (C$)' },
            { key: 'costo',  label: 'Costo (C$)'        },
            { key: 'stock',  label: 'Stock actual'       },
            { key: 'stockMinimo', label: 'Stock mínimo'  },
          ].map(campo => (
            <div key={campo.key}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                {campo.label}
              </label>
              <input type="number" step="0.01"
                value={productoEditar[campo.key]}
                onChange={e => setProductoEditar({...productoEditar, [campo.key]: e.target.value})}
                style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
              />
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Unidad</label>
            <select value={productoEditar.unidad}
              onChange={e => setProductoEditar({...productoEditar, unidad: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
              <option value="">Seleccioná...</option>
              {unidades.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
            </select>
            <button type="button" onClick={() => setMostrarGestionUnidades(true)}
              style={{ marginTop: 4, fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', padding: 0 }}>
              Gestionar unidades
            </button>
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Categoría</label>
            <select value={productoEditar.categoriaId}
              onChange={e => setProductoEditar({...productoEditar, categoriaId: e.target.value})}
              style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
              {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
              <input type="checkbox" checked={productoEditar.esGenerico || false}
                onChange={e => setProductoEditar({...productoEditar, esGenerico: e.target.checked})}
                style={{ width: '16px', height: '16px', cursor: 'pointer' }} />
              Producto genérico (precio variable, no afecta inventario)
            </label>
          </div>

          {/* Precio Mayorista */}
          <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}><Icons.TrendingUp size={14} /> Precio mayorista (opcional)</div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio mayorista (C$)</label>
                <input type="number" step="0.01" min="0" value={productoEditar.precioMayor || ''}
                  onChange={e => setProductoEditar({...productoEditar, precioMayor: e.target.value})}
                  placeholder="0" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
              </div>
              <div>
                <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Cantidad mínima</label>
                <input type="number" step="0.5" min="0" value={productoEditar.cantidadMinimaMayor || ''}
                  onChange={e => setProductoEditar({...productoEditar, cantidadMinimaMayor: e.target.value})}
                  placeholder="Ej: 12" style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
              </div>
            </div>
          </div>

          {/* Segunda presentación */}
        <div style={{ marginBottom: '20px', padding: '12px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#475569', marginBottom: '10px' }}><Icons.Package size={14} /> Segunda presentación (opcional)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Unidad</label>
            <select value={productoEditar.unidadVenta2 || ''} onChange={e => setProductoEditar({...productoEditar, unidadVenta2: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}>
              <option value="">Ninguna</option>
              {unidades.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio (C$)</label>
            <input type="number" step="0.01" value={productoEditar.precioVenta2 || ''}
              onChange={e => setProductoEditar({...productoEditar, precioVenta2: e.target.value})}
              placeholder="0"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Costo (C$)</label>
            <input type="number" step="0.01" value={productoEditar.costoVenta2 || ''}
              onChange={e => setProductoEditar({...productoEditar, costoVenta2: e.target.value})}
              placeholder="0"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Equivale a (en unidades base)</label>
            <input type="number" step="1" value={productoEditar.factorVenta2 || ''}
              onChange={e => setProductoEditar({...productoEditar, factorVenta2: e.target.value})}
              placeholder="100"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
            />
          </div>
        </div>
        <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '6px' }}>
          Ejemplo: si la unidad base es &quot;libra&quot; y vendés por &quot;quintal&quot;, el factor es 100
        </div>
      </div>
      {/* Tercera presentación */}
      <div style={{ marginBottom: '20px', padding: '12px', background: '#fffbeb', borderRadius: '8px', border: '1px solid #fde68a' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#92400e', marginBottom: '10px' }}><Icons.Package size={14} /> Tercera presentación (opcional)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Unidad</label>
            <select value={productoEditar.unidadVenta3 || ''} onChange={e => setProductoEditar({...productoEditar, unidadVenta3: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}>
              <option value="">Ninguna</option>
              {unidades.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio (C$)</label>
            <input type="number" step="0.01" value={productoEditar.precioVenta3 || ''}
              onChange={e => setProductoEditar({...productoEditar, precioVenta3: e.target.value})}
              placeholder="0"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Costo (C$)</label>
            <input type="number" step="0.01" value={productoEditar.costoVenta3 || ''}
              onChange={e => setProductoEditar({...productoEditar, costoVenta3: e.target.value})}
              placeholder="0"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Equivale a (en unidades base)</label>
            <input type="number" step="1" value={productoEditar.factorVenta3 || ''}
              onChange={e => setProductoEditar({...productoEditar, factorVenta3: e.target.value})}
              placeholder="100"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
            />
          </div>
        </div>
      </div>
      {/* Cuarta presentación */}
      <div style={{ marginBottom: '20px', padding: '12px', background: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
        <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534', marginBottom: '10px' }}><Icons.Package size={14} /> Cuarta presentación (opcional)</div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '10px' }}>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Unidad</label>
            <select value={productoEditar.unidadVenta4 || ''} onChange={e => setProductoEditar({...productoEditar, unidadVenta4: e.target.value})}
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}>
              <option value="">Ninguna</option>
              {unidades.map(u => <option key={u.id} value={u.nombre}>{u.nombre}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Precio (C$)</label>
            <input type="number" step="0.01" value={productoEditar.precioVenta4 || ''}
              onChange={e => setProductoEditar({...productoEditar, precioVenta4: e.target.value})}
              placeholder="0"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Costo (C$)</label>
            <input type="number" step="0.01" value={productoEditar.costoVenta4 || ''}
              onChange={e => setProductoEditar({...productoEditar, costoVenta4: e.target.value})}
              placeholder="0"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', display: 'block', marginBottom: '4px' }}>Equivale a (en unidades base)</label>
            <input type="number" step="1" value={productoEditar.factorVenta4 || ''}
              onChange={e => setProductoEditar({...productoEditar, factorVenta4: e.target.value})}
              placeholder="100"
              style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
            />
          </div>
        </div>
      </div>

      <div style={{ marginTop: 8 }}>
        <label style={{ fontSize: '12px', color: 'var(--texto-secundario)', fontWeight: 600, display: 'block', marginBottom: 4 }}>
          Fecha de vencimiento
        </label>
        <input type="date" value={productoEditar.fechaVencimiento ? productoEditar.fechaVencimiento.slice(0,10) : ''}
          onChange={e => setProductoEditar({...productoEditar, fechaVencimiento: e.target.value || null})}
          style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
      </div>

      <div style={{ display: 'flex', gap: '12px', marginTop: 16 }}>
        <button type="button" onClick={() => { setProductoEditar(null) }}
          style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
          Cancelar
        </button>
        <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
          <Icons.Save size={16} /> Guardar cambios
          </button>
        </div>
      </form>
    </div>
  </div>
  )}
      {/* Modal Gestionar Unidades */}
      {mostrarGestionUnidades && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '480px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}><Icons.Ruler size={16} /> Gestionar Unidades de Medida</h2>
              <button onClick={() => { setMostrarGestionUnidades(false); setFormUnidad({ nombre: '' }); setEditandoUnidad(null) }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={guardarUnidad} style={{ marginBottom: '16px', display: 'flex', gap: '8px' }}>
              <input required value={formUnidad.nombre}
                onChange={e => setFormUnidad({ nombre: e.target.value })}
                placeholder={editandoUnidad ? 'Editar unidad...' : 'Nueva unidad (ej: docena, quintal...)'}
                style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }} />
              <button type="submit" className="btn-verde" style={{ padding: '8px 16px', fontSize: 13 }}>
                {editandoUnidad ? 'Guardar' : 'Agregar'}
              </button>
              {editandoUnidad && (
                <button type="button" onClick={() => { setEditandoUnidad(null); setFormUnidad({ nombre: '' }) }}
                  style={{ padding: '8px 12px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: 13 }}>
                  Cancelar
                </button>
              )}
            </form>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {unidades.filter(u => u.activo !== false).map(u => (
                <div key={u.id} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 12px', borderBottom: '1px solid #f1f5f9', fontSize: '14px'
                }}>
                  <span>{u.nombre.charAt(0).toUpperCase() + u.nombre.slice(1)}</span>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button type="button" onClick={() => { setEditandoUnidad(u); setFormUnidad({ nombre: u.nombre }) }}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#3b82f6', fontSize: 13 }}>
                      Editar
                    </button>
                    <button type="button" onClick={() => eliminarUnidad(u.id)}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: 13 }}>
                      Desactivar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}