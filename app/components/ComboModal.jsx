'use client'
import { useState, useEffect, useRef } from 'react'
import { Search, XCircle, Package, CheckCircle, DollarSign, Plus } from 'lucide-react'

export default function ComboModal({ onCerrar, onAgregarCombo, mostrar }) {
  const [productos, setProductos] = useState([])
  const [buscar, setBuscar] = useState('')
  const [items, setItems] = useState([])

  useEffect(() => {
    if (mostrar) {
      setItems([])
      setBuscar('')
      cargarProductos('')
    }
  }, [mostrar])

  async function cargarProductos(q) {
    const res = await fetch(`/api/productos?limit=10000&buscar=${encodeURIComponent(q)}`)
    const data = await res.json()
    setProductos(data.data || data || [])
  }

  function handleBuscar(e) {
    const v = e.target.value
    setBuscar(v)
    cargarProductos(v)
  }

  function agregarItem(producto) {
    setItems(prev => {
      const existe = prev.find(i => i.productoId === producto.id)
      if (existe) {
        return prev.map(i =>
          i.productoId === producto.id ? { ...i, cantidad: i.cantidad + 1 } : i
        )
      }
      return [...prev, {
        productoId: producto.id,
        nombre: producto.nombre,
        unidad: producto.unidad,
        cantidad: 1,
        precio: 0,
      }]
    })
  }

  function actualizarCantidad(id, val) {
    const cant = parseFloat(val)
    if (isNaN(cant) || cant <= 0) return
    setItems(prev => prev.map(i => i.productoId === id ? { ...i, cantidad: cant } : i))
  }

  function actualizarPrecio(id, val) {
    const p = parseFloat(val)
    if (isNaN(p) || p < 0) return
    setItems(prev => prev.map(i => i.productoId === id ? { ...i, precio: p } : i))
  }

  function quitarItem(id) {
    setItems(prev => prev.filter(i => i.productoId !== id))
  }

  const totalCombo = items.reduce((s, i) => s + i.cantidad * i.precio, 0)
  const hayItems = items.length > 0
  const totalValido = totalCombo > 0

  function agregarAlCarrito() {
    if (!hayItems) return
    if (!totalValido) return

    const comboId = 'combo_' + Date.now() + '_' + Math.random().toString(36).slice(2, 6)

    const comboItem = {
      _esCombo: true,
      _comboId: comboId,
      id: 'combo-' + Date.now(),
      nombre: 'COMBO (' + items.map(i => i.nombre + ' x' + i.cantidad).join(', ') + ')',
      cantidad: 1,
      precio: totalCombo,
      subtotal: totalCombo,
      _comboDetalles: items.map(i => ({
        productoId: i.productoId,
        nombre: i.nombre,
        cantidad: i.cantidad,
        precioUnitario: i.precio,
        subtotal: i.cantidad * i.precio,
        unidad: i.unidad,
      })),
    }

    onAgregarCombo(comboItem)
    onCerrar()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
    }}>
      <div className="card" style={{ width: '520px', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Package size={18} /> Crear Combo
          </h2>
          <button onClick={onCerrar}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 4 }}><XCircle size={20} /></button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f1f5f9', borderRadius: '8px', padding: '8px 12px' }}>
            <Search size={16} color="#94a3b8" />
            <input autoFocus type="text" placeholder="Buscar producto para agregar al combo..." value={buscar} onChange={handleBuscar}
              style={{ flex: 1, border: 'none', background: 'transparent', fontSize: '14px', outline: 'none' }} />
          </div>
        </div>

        {/* Product list (left side) */}
        <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden' }}>
          <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid #e2e8f0' }}>
            {productos.filter(p => p.activo !== false && !p.esGenerico).map(p => {
              const enCombo = items.some(i => i.productoId === p.id)
              return (
                <div key={p.id} onClick={() => !enCombo && agregarItem(p)}
                  style={{
                    padding: '10px 16px', cursor: enCombo ? 'not-allowed' : 'pointer', fontSize: '13px',
                    borderBottom: '1px solid #f1f5f9', opacity: enCombo ? 0.4 : 1,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    background: enCombo ? '#f1f5f9' : 'white',
                  }}>
                  <div>
                    <div style={{ fontWeight: 600 }}>{p.nombre}</div>
                    <div style={{ fontSize: '11px', color: '#94a3b8' }}>Stock: {p.stock} {p.unidad}</div>
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b', fontWeight: 600 }}>
                    C$ {p.precio.toFixed(2)}
                  </div>
                </div>
              )
            })}
            {productos.filter(p => p.activo !== false && !p.esGenerico).length === 0 && (
              <div style={{ padding: '30px', textAlign: 'center', color: '#94a3b8', fontSize: '13px' }}>
                No se encontraron productos
              </div>
            )}
          </div>

          {/* Combo items (right side) */}
          <div style={{ width: '240px', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '10px 14px', fontSize: '13px', fontWeight: 700, borderBottom: '1px solid #e2e8f0', background: '#f8fafc' }}>
              Productos en combo
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '8px' }}>
              {items.length === 0 ? (
                <div style={{ padding: '20px 8px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                  Seleccioná productos de la lista
                </div>
              ) : (
                items.map(item => (
                  <div key={item.productoId} style={{
                    padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', marginBottom: '6px',
                    background: 'white', fontSize: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: '12px' }}>{item.nombre}</span>
                      <button onClick={() => quitarItem(item.productoId)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: 2 }}>
                        <XCircle size={14} />
                      </button>
                    </div>
                    <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Cant</label>
                        <input type="text" inputMode="decimal" value={item.cantidad}
                          onChange={e => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v) || v === '') actualizarCantidad(item.productoId, v || '0') }}
                          style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <label style={{ fontSize: '10px', color: '#94a3b8', display: 'block' }}>Precio C$</label>
                        <input type="text" inputMode="decimal" value={item.precio || ''}
                          onChange={e => { const v = e.target.value; if (/^\d*\.?\d*$/.test(v) || v === '') actualizarPrecio(item.productoId, v || '0') }}
                          style={{ width: '100%', padding: '4px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '12px', outline: 'none' }} />
                      </div>
                    </div>
                    {item.precio > 0 && (
                      <div style={{ fontSize: '11px', fontWeight: 700, color: '#16a34a', textAlign: 'right', marginTop: 2 }}>
                        = C$ {(item.cantidad * item.precio).toFixed(2)}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>

            {/* Total + Add button */}
            {hayItems && (
              <div style={{ padding: '10px 14px', borderTop: '1px solid #e2e8f0', background: '#f8fafc' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, textAlign: 'right', color: totalValido ? '#16a34a' : '#dc2626', marginBottom: '8px' }}>
                  Total combo: C$ {totalCombo.toFixed(2)}
                </div>
                <button onClick={agregarAlCarrito} disabled={!totalValido}
                  style={{
                    width: '100%', padding: '12px', borderRadius: '8px', border: 'none',
                    background: totalValido ? '#16a34a' : '#e2e8f0', color: totalValido ? 'white' : '#94a3b8',
                    fontWeight: 700, fontSize: '14px', cursor: totalValido ? 'pointer' : 'not-allowed',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4
                  }}>
                  <Plus size={16} /> Agregar combo al carrito
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
