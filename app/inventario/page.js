'use client'
import { useState, useEffect } from 'react'

import StockAlerta from '@/app/components/StockAlerta'
import * as Icons from 'lucide-react'

export default function Inventario() {
  const [movimientos, setMovimientos] = useState([])
  const [productos, setProductos]     = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [alertas, setAlertas]         = useState([])
  const [prodsVencer, setProdsVencer] = useState([])
  const [filtroVenc, setFiltroVenc]   = useState(15)
  const [cargando, setCargando] = useState(true)
  const [buscar, setBuscar]     = useState('')
  const [form, setForm] = useState({
    productoId: '', tipo: 'entrada', cantidad: '', motivo: ''
  })

  const filtrados = buscar
    ? movimientos.filter(m => m.producto?.nombre?.toLowerCase().includes(buscar.toLowerCase()))
    : movimientos

  const saldos = (() => {
    if (filtrados.length === 0) return []
    const ordenado = [...filtrados].sort((a, b) => new Date(a.creadoEn) - new Date(b.creadoEn))
    const balanceMap = {}
    const porProducto = {}
    for (const m of ordenado) {
      const pid = m.productoId || m.producto?.id
      if (!porProducto[pid]) porProducto[pid] = 0
      if (m.tipo === 'entrada') porProducto[pid] += m.cantidad
      else porProducto[pid] -= m.cantidad
      balanceMap[m.id] = porProducto[pid]
    }
    return filtrados.map(m => balanceMap[m.id])
  })()

  useEffect(() => {
    Promise.all([cargarMovimientos(), cargarProductos(), cargarVencer()])
      .finally(() => setCargando(false))
  }, [])

  useEffect(() => {
    cargarVencer()
  }, [filtroVenc])

  useEffect(() => {
    const bajos = productos.filter(p => p.stock <= p.stockMinimo).sort((a, b) => a.stock - b.stock)
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
    setProductos(data.data || data)
  }

  async function cargarVencer() {
    const res  = await fetch(`/api/productos?vencer=${filtroVenc}&limit=200`)
    const data = await res.json()
    setProdsVencer(data.data || [])
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

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}><Icons.ClipboardList size={24} /> Inventario</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Control de entradas y salidas de stock</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <StockAlerta />
          <button className="btn-verde" onClick={() => setMostrarForm(true)}>
            + Registrar Movimiento
          </button>
        </div>
      </div>

      {alertas.length > 0 && (
        <div style={{
          background: '#fef2f2', border: '1px solid #fecaca',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <Icons.Ban size={14} />
          <span style={{ fontWeight: 600, fontSize: '14px', color: '#dc2626' }}>
            {alertas.filter(p => p.stock === 0).length} producto(s) sin stock
          </span>
          <span style={{ color: '#d97706', fontSize: '14px' }}>
            · {alertas.filter(p => p.stock > 0).length} con stock bajo
          </span>
        </div>
      )}

      {prodsVencer.length > 0 && (
        <div style={{
          background: '#fffbeb', border: '1px solid #fde68a',
          borderRadius: '12px', padding: '12px 16px', marginBottom: '20px',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <Icons.Clock size={16} color="#d97706" />
            <span style={{ fontWeight: 700, fontSize: '14px', color: '#92400e' }}>
              {prodsVencer.length} producto(s) próximos a vencer
            </span>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 4 }}>
              {[15, 30, 60, 90].map(d => (
                <button key={d} onClick={() => setFiltroVenc(d)}
                  style={{
                    padding: '2px 8px', borderRadius: 4, border: '1px solid #fde68a',
                    background: filtroVenc === d ? '#d97706' : 'transparent',
                    color: filtroVenc === d ? 'white' : '#92400e',
                    cursor: 'pointer', fontSize: 11, fontWeight: 600
                  }}>{d}d</button>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {prodsVencer.slice(0, 10).map(p => (
              <div key={p.id} style={{
                padding: '4px 10px', borderRadius: 6, background: 'white',
                border: '1px solid #fde68a', fontSize: 12,
                display: 'flex', alignItems: 'center', gap: 6
              }}>
                <span style={{ fontWeight: 600 }}>{p.nombre}</span>
                <span style={{ color: '#d97706' }}>
                  Vence: {new Date(p.fechaVencimiento).toLocaleDateString('es-NI')}
                </span>
                <span style={{ color: '#64748b' }}>Stock: {p.stock}</span>
              </div>
            ))}
            {prodsVencer.length > 10 && (
              <span style={{ fontSize: 11, color: '#64748b', padding: '4px 8px' }}>
                +{prodsVencer.length - 10} más
              </span>
            )}
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

      {/* Buscador de producto para kardex */}
      <div className="card" style={{ marginBottom: '16px', padding: '12px 16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icons.Search size={18} color="#94a3b8" />
          <input type="text" placeholder="Buscá un producto para ver su kardex (movimientos)..." value={buscar}
            onChange={e => setBuscar(e.target.value)}
            style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }} />
          {buscar && <button onClick={() => setBuscar('')}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', fontSize: '18px' }}>✕</button>}
        </div>
      </div>

      {/* Tabla de movimientos (kardex) */}
      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontWeight: 700, fontSize: '16px' }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.ClipboardList size={16} /> {buscar ? `Kardex: ${buscar}` : 'Historial de movimientos'}</span></h2>
          {buscar && <span style={{ fontSize: '13px', color: '#64748b' }}>Filtrando por: <strong>{buscar}</strong></span>}
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Fecha', 'Producto', 'Tipo', 'Cantidad', 'Saldo', 'Motivo'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {filtrados.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  {buscar ? `No hay movimientos para "${buscar}"` : 'No hay movimientos aún'}
                </td>
              </tr>
            ) : (
              filtrados.map((m, i) => {
                const saldo = saldos[i]
                return (
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{m.tipo === 'entrada' ? <><Icons.Download size={14} /> Entrada</> : <><Icons.Upload size={14} /> Salida</>}</span>
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '15px', color: m.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>
                    {m.tipo === 'entrada' ? '+' : '-'}{m.cantidad}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, fontSize: '15px' }}>
                    {saldo}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {m.motivo || '—'}
                  </td>
                </tr>
                )
              })
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
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Package size={16} /> Registrar Movimiento</span></h2>
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
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>{tipo === 'entrada' ? <><Icons.Download size={14} /> Entrada</> : <><Icons.Upload size={14} /> Salida</>}</span>
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
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Save size={16} /> Guardar</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}