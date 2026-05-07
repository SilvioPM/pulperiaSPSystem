'use client'
import { useState, useEffect } from 'react'

export default function Productos() {
  const [productos, setProductos]   = useState([])
  const [categorias, setCategorias] = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [buscando, setBuscando]     = useState('')
  const [form, setForm] = useState({
    nombre: '', codigo: '', precio: '', costo: '',
    stock: '', stockMinimo: '5', unidad: 'unidad', categoriaId: ''
  })

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
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setMostrarForm(false)
      setForm({ nombre: '', codigo: '', precio: '', costo: '',
                stock: '', stockMinimo: '5', unidad: 'unidad', categoriaId: '' })
      cargarProductos()
    } else {
      alert('Error al guardar producto')
    }
  }

  const productosFiltrados = productos.filter(p =>
    p.nombre.toLowerCase().includes(buscando.toLowerCase())
  )

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>📦 Productos</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{productos.length} productos registrados</p>
        </div>
        <button className="btn-verde" onClick={() => setMostrarForm(true)}>
          + Nuevo Producto
        </button>
      </div>

      {/* Buscador */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <input
          type="text"
          placeholder="🔍 Buscar producto..."
          value={buscando}
          onChange={e => setBuscando(e.target.value)}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none'
          }}
        />
      </div>

      {/* Tabla de productos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Producto', 'Categoría', 'Precio', 'Costo', 'Stock', 'Stock Mín.', 'Estado'].map(h => (
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
                  No hay productos aún. ¡Agregá el primero!
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
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      fontWeight: 700,
                      color: p.stock <= p.stockMinimo ? '#dc2626' : '#1e293b'
                    }}>
                      {p.stock}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', color: '#64748b' }}>{p.stockMinimo}</td>
                  <td style={{ padding: '12px 16px' }}>
                    {p.stock === 0 ? (
                      <span style={{ background: '#fee2e2', color: '#dc2626', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        Agotado
                      </span>
                    ) : p.stock <= p.stockMinimo ? (
                      <span style={{ background: '#fef9c3', color: '#ca8a04', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        ⚠️ Stock bajo
                      </span>
                    ) : (
                      <span style={{ background: '#dcfce7', color: '#16a34a', padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 600 }}>
                        ✓ Disponible
                      </span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para agregar producto */}
      {mostrarForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>➕ Nuevo Producto</h2>
              <button onClick={() => setMostrarForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>
                ✕
              </button>
            </div>

            <form onSubmit={guardarProducto}>
              {/* Nombre */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Nombre del producto *
                </label>
                <input required value={form.nombre} onChange={e => setForm({...form, nombre: e.target.value})}
                  placeholder="Ej: Arroz Diana 1lb"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Código */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Código (opcional)
                </label>
                <input value={form.codigo} onChange={e => setForm({...form, codigo: e.target.value})}
                  placeholder="Ej: 001 o código de barra"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Precio y Costo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Precio de venta (C$) *
                  </label>
                  <input required type="number" step="0.01" value={form.precio}
                    onChange={e => setForm({...form, precio: e.target.value})}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Costo (C$)
                  </label>
                  <input type="number" step="0.01" value={form.costo}
                    onChange={e => setForm({...form, costo: e.target.value})}
                    placeholder="0.00"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Stock y Stock mínimo */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Stock inicial
                  </label>
                  <input type="number" value={form.stock}
                    onChange={e => setForm({...form, stock: e.target.value})}
                    placeholder="0"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Stock mínimo
                  </label>
                  <input type="number" value={form.stockMinimo}
                    onChange={e => setForm({...form, stockMinimo: e.target.value})}
                    placeholder="5"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              {/* Unidad y Categoría */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Unidad
                  </label>
                  <select value={form.unidad} onChange={e => setForm({...form, unidad: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                    <option value="unidad">Unidad</option>
                    <option value="libra">Libra</option>
                    <option value="kilo">Kilo</option>
                    <option value="litro">Litro</option>
                    <option value="docena">Docena</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Categoría *
                  </label>
                  <select required value={form.categoriaId} onChange={e => setForm({...form, categoriaId: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                    <option value="">Seleccioná...</option>
                    {categorias.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Botones */}
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setMostrarForm(false)}
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
    </div>
  )
}