'use client'
import { useState, useEffect } from 'react'

export default function Inventario() {
  const [movimientos, setMovimientos] = useState([])
  const [productos, setProductos]     = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [alertas, setAlertas]         = useState([])
  const [form, setForm] = useState({
    productoId: '', tipo: 'entrada', cantidad: '', motivo: ''
  })

  useEffect(() => {
    cargarMovimientos()
    cargarProductos()
  }, [])

  // Cada vez que cargan los productos, filtramos los de stock bajo
  useEffect(() => {
    const bajos = productos.filter(p => p.stock <= p.stockMinimo)
    setAlertas(bajos)
  }, [productos])

  async function cargarMovimientos() {
    const res  = await fetch('/api/inventario')
    const data = await res.json()
    setMovimientos(data)
  }

  async function cargarProductos() {
    const res  = await fetch('/api/productos')
    const data = await res.json()
    setProductos(data)
  }

  async function guardarMovimiento(e) {
    e.preventDefault()
    const res = await fetch('/api/inventario', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setMostrarForm(false)
      setForm({ productoId: '', tipo: 'entrada', cantidad: '', motivo: '' })
      cargarMovimientos()
      cargarProductos() // Recargamos para actualizar alertas
    } else {
      alert('Error al registrar movimiento')
    }
  }

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>🏬 Inventario</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Control de entradas y salidas de stock</p>
        </div>
        <button className="btn-verde" onClick={() => setMostrarForm(true)}>
          + Registrar Movimiento
        </button>
      </div>

      {/* Alertas de stock bajo */}
      {alertas.length > 0 && (
        <div style={{
          background: '#fef9c3', border: '1px solid #fde047',
          borderRadius: '12px', padding: '16px', marginBottom: '20px'
        }}>
          <div style={{ fontWeight: 700, color: '#854d0e', marginBottom: '10px', fontSize: '15px' }}>
            ⚠️ {alertas.length} producto(s) con stock bajo
          </div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            {alertas.map(p => (
              <span key={p.id} style={{
                background: 'white', border: '1px solid #fde047',
                borderRadius: '8px', padding: '6px 12px', fontSize: '13px'
              }}>
                <strong>{p.nombre}</strong> — quedan {p.stock} {p.unidad}(s)
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Total Entradas</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>
            {movimientos.filter(m => m.tipo === 'entrada').length}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>movimientos registrados</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Total Salidas</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#dc2626' }}>
            {movimientos.filter(m => m.tipo === 'salida').length}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>movimientos registrados</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '6px' }}>Alertas activas</div>
          <div style={{ fontSize: '28px', fontWeight: 700, color: '#f59e0b' }}>
            {alertas.length}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>productos con stock bajo</div>
        </div>
      </div>

      {/* Tabla de movimientos */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0' }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px' }}>📋 Historial de movimientos</h2>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Motivo'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {movimientos.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No hay movimientos aún
                </td>
              </tr>
            ) : (
              movimientos.map((m, i) => (
                <tr key={m.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {formatearFecha(m.creadoEn)}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px' }}>
                    {m.producto?.nombre}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 12px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                      background: m.tipo === 'entrada' ? '#dcfce7' : '#fee2e2',
                      color: m.tipo === 'entrada' ? '#16a34a' : '#dc2626'
                    }}>
                      {m.tipo === 'entrada' ? '📥 Entrada' : '📤 Salida'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '15px' }}>
                    {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {m.motivo || '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal registrar movimiento */}
      {mostrarForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '440px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>📦 Registrar Movimiento</h2>
              <button onClick={() => setMostrarForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>
                ✕
              </button>
            </div>

            <form onSubmit={guardarMovimiento}>
              {/* Tipo */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '8px' }}>
                  Tipo de movimiento
                </label>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {['entrada', 'salida'].map(tipo => (
                    <button key={tipo} type="button"
                      onClick={() => setForm({...form, tipo})}
                      style={{
                        flex: 1, padding: '12px', borderRadius: '8px', border: '2px solid',
                        borderColor: form.tipo === tipo ? (tipo === 'entrada' ? '#16a34a' : '#dc2626') : '#e2e8f0',
                        background: form.tipo === tipo ? (tipo === 'entrada' ? '#dcfce7' : '#fee2e2') : 'white',
                        color: form.tipo === tipo ? (tipo === 'entrada' ? '#16a34a' : '#dc2626') : '#64748b',
                        cursor: 'pointer', fontWeight: 700, fontSize: '14px'
                      }}>
                      {tipo === 'entrada' ? '📥 Entrada' : '📤 Salida'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Producto */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Producto *
                </label>
                <select required value={form.productoId}
                  onChange={e => setForm({...form, productoId: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                  <option value="">Seleccioná un producto...</option>
                  {productos.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} — Stock actual: {p.stock}
                    </option>
                  ))}
                </select>
              </div>

              {/* Cantidad */}
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Cantidad *
                </label>
                <input required type="number" min="1" value={form.cantidad}
                  onChange={e => setForm({...form, cantidad: e.target.value})}
                  placeholder="0"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>

              {/* Motivo */}
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Motivo (opcional)
                </label>
                <input value={form.motivo}
                  onChange={e => setForm({...form, motivo: e.target.value})}
                  placeholder="Ej: Compra a proveedor, ajuste de inventario..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setMostrarForm(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  💾 Guardar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}