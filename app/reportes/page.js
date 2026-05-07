'use client'
import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts'

export default function Reportes() {
  const [facturas, setFacturas]   = useState([])
  const [productos, setProductos] = useState([])
  const [periodo, setPeriodo]     = useState('semana')

  useEffect(() => {
    cargarDatos()
  }, [])

  async function cargarDatos() {
    const [fRes, pRes] = await Promise.all([
      fetch('/api/facturas'),
      fetch('/api/productos')
    ])
    const [f, p] = await Promise.all([fRes.json(), pRes.json()])
    setFacturas(f)
    setProductos(p)
  }

  // ── Calcular ventas por día ──────────────────────────────────
  function ventasPorDia() {
    const dias = {}
    const hoy  = new Date()

    // Creamos los últimos 7 días vacíos
    for (let i = 6; i >= 0; i--) {
      const d = new Date(hoy)
      d.setDate(d.getDate() - i)
      const key = d.toLocaleDateString('es-NI', { weekday: 'short', day: '2-digit' })
      dias[key] = { dia: key, ventas: 0, total: 0 }
    }

    // Llenamos con las facturas reales
    facturas.forEach(f => {
      const fecha = new Date(f.creadoEn)
      const key   = fecha.toLocaleDateString('es-NI', { weekday: 'short', day: '2-digit' })
      if (dias[key]) {
        dias[key].ventas++
        dias[key].total += f.total
      }
    })

    return Object.values(dias)
  }

  // ── Productos más vendidos ───────────────────────────────────
  function productosMasVendidos() {
    const conteo = {}
    facturas.forEach(f => {
      f.detalles?.forEach(d => {
        if (!conteo[d.producto?.nombre]) {
          conteo[d.producto?.nombre] = { nombre: d.producto?.nombre, cantidad: 0, total: 0 }
        }
        conteo[d.producto?.nombre].cantidad += d.cantidad
        conteo[d.producto?.nombre].total    += d.subtotal
      })
    })
    return Object.values(conteo)
      .sort((a, b) => b.cantidad - a.cantidad)
      .slice(0, 5)
  }

  // ── Métricas generales ───────────────────────────────────────
  const hoy         = new Date().toDateString()
  const ventasHoy   = facturas.filter(f => new Date(f.creadoEn).toDateString() === hoy)
  const totalHoy    = ventasHoy.reduce((sum, f) => sum + f.total, 0)
  const totalGeneral = facturas.reduce((sum, f) => sum + f.total, 0)
  const ticketProm  = facturas.length > 0 ? totalGeneral / facturas.length : 0
  const stockBajo   = productos.filter(p => p.stock <= p.stockMinimo).length

  const datosGrafica       = ventasPorDia()
  const topProductos       = productosMasVendidos()

  return (
    <div>
      {/* Encabezado */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>📊 Reportes</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Resumen del rendimiento del negocio</p>
      </div>

      {/* Métricas principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Ventas hoy</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#16a34a' }}>C$ {totalHoy.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{ventasHoy.length} facturas</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Total acumulado</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#2563eb' }}>C$ {totalGeneral.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{facturas.length} facturas totales</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #7c3aed' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Ticket promedio</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#7c3aed' }}>C$ {ticketProm.toFixed(2)}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>por factura</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px' }}>Stock bajo</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#f59e0b' }}>{stockBajo}</div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>productos por reabastecer</div>
        </div>
      </div>

      {/* Gráfica de ventas */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>
          📈 Ventas últimos 7 días
        </h2>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={datosGrafica} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="dia" tick={{ fontSize: 12, fill: '#64748b' }} />
            <YAxis tick={{ fontSize: 12, fill: '#64748b' }} />
            <Tooltip
              formatter={(value) => [`C$ ${value.toFixed(2)}`, 'Total']}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }}
            />
            <Bar dataKey="total" fill="#16a34a" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>

        {/* Productos más vendidos */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            🏆 Top 5 productos más vendidos
          </h2>
          {topProductos.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
              No hay ventas aún
            </div>
          ) : (
            topProductos.map((p, i) => (
              <div key={p.nombre} style={{
                display: 'flex', alignItems: 'center', gap: '12px',
                padding: '10px 0', borderBottom: i < topProductos.length - 1 ? '1px solid #f1f5f9' : 'none'
              }}>
                <div style={{
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: i === 0 ? '#fef9c3' : i === 1 ? '#f1f5f9' : '#fff7ed',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '14px', fontWeight: 700,
                  color: i === 0 ? '#ca8a04' : i === 1 ? '#475569' : '#c2410c'
                }}>
                  {i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '14px', fontWeight: 600 }}>{p.nombre}</div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>{p.cantidad} unidades vendidas</div>
                </div>
                <div style={{ fontWeight: 700, color: '#16a34a', fontSize: '14px' }}>
                  C$ {p.total.toFixed(2)}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Métodos de pago */}
        <div className="card">
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>
            💳 Métodos de pago
          </h2>
          {['efectivo', 'tarjeta', 'transferencia'].map(metodo => {
            const cantidad = facturas.filter(f => f.metodoPago === metodo).length
            const total    = facturas.filter(f => f.metodoPago === metodo).reduce((sum, f) => sum + f.total, 0)
            const pct      = facturas.length > 0 ? (cantidad / facturas.length) * 100 : 0

            return (
              <div key={metodo} style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '14px', fontWeight: 600 }}>
                    {metodo === 'efectivo' ? '💵' : metodo === 'tarjeta' ? '💳' : '📱'} {metodo}
                  </span>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>
                    {cantidad} ventas · C$ {total.toFixed(2)}
                  </span>
                </div>
                {/* Barra de progreso */}
                <div style={{ background: '#f1f5f9', borderRadius: '10px', height: '8px' }}>
                  <div style={{
                    width: `${pct}%`, height: '8px', borderRadius: '10px',
                    background: metodo === 'efectivo' ? '#16a34a' : metodo === 'tarjeta' ? '#2563eb' : '#7c3aed',
                    transition: 'width 0.5s'
                  }} />
                </div>
                <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '3px' }}>
                  {pct.toFixed(1)}% de las ventas
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}