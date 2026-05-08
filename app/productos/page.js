'use client'
import { useState, useEffect, useRef } from 'react'

export default function Productos() {
  const [tab, setTab]               = useState('productos') // 'productos' o 'categorias'
  const [productos, setProductos]   = useState([])
  const [categorias, setCategorias] = useState([])
  const [mostrarFormProd, setMostrarFormProd] = useState(false)
  const [mostrarFormCat, setMostrarFormCat]   = useState(false)
  const [buscando, setBuscando]     = useState('')
  const [formProd, setFormProd]     = useState({
    nombre: '', codigo: '', precio: '', costo: '',
    stock: '', stockMinimo: '5', unidad: 'unidad', categoriaId: ''
  })
  const [productoEditar, setProductoEditar] = useState(null)
  const [formCat, setFormCat]       = useState({ nombre: '' })
  const [mostrarImport, setMostrarImport] = useState(false)
  const [importando, setImportando]       = useState(false)
  const [resultImport, setResultImport]   = useState(null)
  const inputExcel                        = useRef(null) 

  useEffect(() => {
    cargarProductos()
    cargarCategorias()
  }, [])

  async function cargarProductos() {
    const res  = await fetch('/api/productos')
    const data = await res.json()
    setProductos(data)
  }

  async function cargarCategorias() {
    const res  = await fetch('/api/categorias')
    const data = await res.json()
    setCategorias(data)
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
                    stock: '', stockMinimo: '5', unidad: 'unidad', categoriaId: '' })
      cargarProductos()
    } else {
      alert('Error al guardar producto')
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
      alert('Error al guardar categoría')
    }
  }

async function eliminarCategoria(id) {
  if (!confirm('¿Seguro que querés eliminar esta categoría?')) return
  try {
    const res  = await fetch(`/api/categorias?id=${id}`, { method: 'DELETE' })
    const text = await res.text() // Leemos como texto primero
    const data = text ? JSON.parse(text) : {}  // Solo parseamos si hay contenido

    if (!res.ok) {
      alert(data.error || 'Error al eliminar')
    } else {
      cargarCategorias()
    }
  } catch (error) {
    alert('Error al eliminar categoría')
  }
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
    cargarProductos()
  } else {
    alert('Error al editar producto')
  }
}
async function eliminarProducto(id) {
  if (!confirm('¿Seguro que querés eliminar este producto?')) return
  try {
    const res  = await fetch(`/api/productos/${id}`, { method: 'DELETE' })
    const text = await res.text()
    const data = text ? JSON.parse(text) : {}
    if (!res.ok) {
      alert(data.error || 'Error al eliminar')
    } else {
      cargarProductos()
    }
  } catch (error) {
    alert('Error al eliminar producto')
  }
}
// Descargar plantilla Excel de ejemplo
function descargarPlantilla() {
  const XLSX = require('xlsx')
  const datos = [
    {
      Nombre: 'Arroz Diana 1lb',
      Codigo: '001',
      Precio: 28,
      Costo: 22,
      Stock: 50,
      StockMinimo: 10,
      Unidad: 'libra',
      Categoria: 'Granos básicos'
    },
    {
      Nombre: 'Coca Cola 500ml',
      Codigo: '002',
      Precio: 25,
      Costo: 18,
      Stock: 24,
      StockMinimo: 6,
      Unidad: 'unidad',
      Categoria: 'Bebidas'
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
    alert('Error al importar archivo')
  }

  setImportando(false)
  // Limpiamos el input para permitir subir el mismo archivo de nuevo
  e.target.value = ''
}

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(buscando.toLowerCase())
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

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>
            {tab === 'productos' ? '📦 Productos' : '🏷️ Categorías'}
          </h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>
            {tab === 'productos'
              ? `${productos.length} productos registrados`
              : `${categorias.length} categorías registradas`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
                {tab === 'productos' && (
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
                📥 Plantilla Excel
            </button>
            <button
                onClick={() => inputExcel.current.click()}
                disabled={importando}
                style={{
                    padding: '10px 16px', borderRadius: '8px',
                    border: '1px solid #2563eb', background: '#dbeafe',
                    cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#2563eb'
                }}>
                {importando ? '⏳ Importando...' : '📤 Importar Excel'}
            </button>
        </>
    )}
  <button
    className="btn-verde"
    onClick={() => tab === 'productos' ? setMostrarFormProd(true) : setMostrarFormCat(true)}>
    {tab === 'productos' ? '+ Nuevo Producto' : '+ Nueva Categoría'}
  </button>
</div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { key: 'productos',  label: '📦 Productos'  },
          { key: 'categorias', label: '🏷️ Categorías' },
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
            <input type="text"
              placeholder="🔍 Buscar producto..."
              value={buscando}
              onChange={e => setBuscando(e.target.value)}
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '8px',
                border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none'
              }}
            />
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                  {['Producto', 'Categoría', 'Precio', 'Costo', 'Stock', 'Mín.', 'Estado', 'Acciones'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                      No hay productos aún
                    </td>
                  </tr>
                ) : (
                  productosFiltrados.map((p, i) => (
                    <tr key={p.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ fontWeight: 600, fontSize: '14px' }}>{p.nombre}</div>
                        {p.codigo && <div style={{ fontSize: '12px', color: '#94a3b8' }}>#{p.codigo}</div>}
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
                        C$ {p.precio.toFixed(2)}
                      </td>
                      <td style={{ padding: '12px 16px', color: '#64748b' }}>
                        C$ {p.costo.toFixed(2)}
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
                      <td style={{ padding: '12px 16px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => setProductoEditar({
                              ...p,
                              categoriaId: p.categoriaId,
                              precio: p.precio,
                              costo: p.costo,
                              stock: p.stock,
                              stockMinimo: p.stockMinimo
                            })}
                            style={{
                              padding: '6px 10px', borderRadius: '6px',
                              border: '1px solid #dbeafe', background: '#dbeafe',
                              cursor: 'pointer', fontSize: '13px', color: '#2563eb', fontWeight: 600
                            }}>
                            ✏️
                          </button>
                          <button
                            onClick={() => eliminarProducto(p.id)}
                            style={{
                              padding: '6px 10px', borderRadius: '6px',
                              border: '1px solid #fee2e2', background: '#fee2e2',
                              cursor: 'pointer', fontSize: '13px', color: '#dc2626', fontWeight: 600
                            }}>
                            🗑️
                          </button>
                        </div>
                      </td>
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
              <div style={{ fontSize: '48px', marginBottom: '12px' }}>🏷️</div>
              <p style={{ color: '#94a3b8', marginBottom: '16px' }}>No hay categorías aún</p>
              <button className="btn-verde" onClick={() => setMostrarFormCat(true)}>
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
                      justifyContent: 'center', fontSize: '24px', marginBottom: '12px'
                    }}>
                      🏷️
                    </div>
                    <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '4px' }}>
                      {cat.nombre}
                    </div>
                    <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                      {prodsCat} producto{prodsCat !== 1 ? 's' : ''}
                    </div>
                    <button
                      onClick={() => eliminarCategoria(cat.id)}
                      style={{
                        width: '100%', padding: '8px', borderRadius: '8px',
                        border: '1px solid #fee2e2', background: '#fff5f5',
                        color: '#dc2626', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                      }}>
                      🗑️ Eliminar
                    </button>
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
                </div>
              ))}
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
                    <option value="unidad">Unidad</option>
                    <option value="libra">Libra</option>
                    <option value="kilo">Kilo</option>
                    <option value="litro">Litro</option>
                    <option value="docena">Docena</option>
                  </select>
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
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setMostrarFormProd(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  💾 Guardar Producto
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
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>🏷️ Nueva Categoría</h2>
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
                  💾 Guardar Categoría
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
              <option value="unidad">Unidad</option>
              <option value="libra">Libra</option>
              <option value="kilo">Kilo</option>
              <option value="litro">Litro</option>
              <option value="docena">Docena</option>
            </select>
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

        <div style={{ display: 'flex', gap: '12px' }}>
          <button type="button" onClick={() => setProductoEditar(null)}
            style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
            Cancelar
          </button>
          <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
            💾 Guardar cambios
          </button>
        </div>
      </form>
    </div>
  </div>
  )}
    </div>
  )
}