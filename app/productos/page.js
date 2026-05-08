'use client'
import { useState, useEffect } from 'react'

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
  const [formCat, setFormCat]       = useState({ nombre: '' })

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
        <button
          className="btn-verde"
          onClick={() => tab === 'productos' ? setMostrarFormProd(true) : setMostrarFormCat(true)}>
          {tab === 'productos' ? '+ Nuevo Producto' : '+ Nueva Categoría'}
        </button>
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
                  {['Producto', 'Categoría', 'Precio', 'Costo', 'Stock', 'Mín.', 'Estado'].map(h => (
                    <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {productosFiltrados.length === 0 ? (
                  <tr>
                    <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
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
    </div>
  )
}