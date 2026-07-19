'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import Toast from '@/app/components/Toast'
import { useToast } from '@/app/hooks/useToast'
import * as Icons from 'lucide-react'

export default function Gastos() {
  const { toast, mostrar, cerrar } = useToast()
  const [gastos, setGastos] = useState([])
  const [totalGastos, setTotalGastos] = useState(0)
  const [cajaAbierta, setCajaAbierta] = useState(false)
  const [filtroMes, setFiltroMes] = useState(new Date().toISOString().slice(0, 7))
  const [mostrarForm, setMostrarForm] = useState(false)
  const [form, setForm] = useState({ concepto: '', categoria: 'Operativos', monto: '', fecha: new Date().toISOString().slice(0, 10), metodoPago: 'efectivo', nota: '' })

  const categorias = ['Operativos', 'Salarios', 'Servicios', 'Alquiler', 'Impuestos', 'Mantenimiento', 'Publicidad', 'Transporte', 'Otros']
  const metodosPago = [{ valor: 'efectivo', label: 'Efectivo (descalfa de caja)' }, { valor: 'transferencia', label: 'Transferencia' }, { valor: 'tarjeta', label: 'Tarjeta' }, { valor: 'otro', label: 'Otro' }]

  useEffect(() => {
    cargarGastos()
    fetch('/api/caja').then(r => r.json()).then(d => setCajaAbierta(!!d.actual)).catch(() => {})
  }, [filtroMes])

  async function cargarGastos() {
    const desde = filtroMes + '-01'
    const h = new Date(filtroMes + '-01')
    h.setMonth(h.getMonth() + 1)
    h.setDate(0)
    const hasta = filtroMes + '-' + String(h.getDate()).padStart(2, '0')
    const res = await fetch(`/api/gastos?desde=${desde}&hasta=${hasta}&limit=9999`)
    const data = await res.json()
    setGastos(data.data || [])
    setTotalGastos((data.data || []).reduce((s, g) => s + g.monto, 0))
  }

  async function guardar(e) {
    e.preventDefault()
    if (!form.concepto.trim() || !form.monto) return mostrar('Completá los campos requeridos', 'alerta')
    const res = await fetch('/api/gastos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setMostrarForm(false)
      setForm({ concepto: '', categoria: 'Operativos', monto: '', fecha: new Date().toISOString().slice(0, 10), metodoPago: 'efectivo', nota: '' })
      cargarGastos()
    } else {
      mostrar('Error al guardar gasto', 'error')
    }
  }

  async function eliminar(id) {
    if (!confirm('¿Eliminar este gasto?')) return
    await fetch(`/api/gastos?id=${id}`, { method: 'DELETE' })
    cargarGastos()
  }

  return (
    <div style={{ padding: '24px', maxWidth: 900, margin: '0 auto' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: 22, fontWeight: 700, margin: 0 }}><Icons.Wallet size={20} /> Gastos</h1>
          <p style={{ fontSize: 13, color: '#64748b', margin: 0 }}>Registrá y controlá los gastos del negocio</p>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <input type="month" value={filtroMes} onChange={e => setFiltroMes(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 13, outline: 'none' }} />
          <button onClick={() => setMostrarForm(true)} className="btn-verde" style={{ padding: '10px 18px', fontSize: 13, fontWeight: 600 }}>
            <Icons.Plus size={16} /> Nuevo gasto
          </button>
        </div>
      </div>

      <div style={{ padding: 16, borderRadius: 10, background: '#fef2f2', marginBottom: 20, border: '1px solid #fecaca' }}>
        <div style={{ fontSize: 13, color: '#991b1b', fontWeight: 600 }}>Total mes: C$ {totalGastos.toFixed(2)}</div>
        <div style={{ fontSize: 12, color: '#dc2626' }}>{gastos.length} gasto(s) registrado(s)</div>
      </div>

      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100 }}>
          <div className="card" style={{ width: 400, padding: 24 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Nuevo gasto</h2>
              <button onClick={() => setMostrarForm(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}><Icons.XCircle size={20} /></button>
            </div>
            <form onSubmit={guardar} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <input required placeholder="Concepto *" value={form.concepto} onChange={e => setForm({...form, concepto: e.target.value})}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
              <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}>
                {categorias.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select value={form.metodoPago} onChange={e => setForm({...form, metodoPago: e.target.value})}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }}>
                {metodosPago.map(m => <option key={m.valor} value={m.valor}>{m.label}</option>)}
              </select>
              {cajaAbierta && form.metodoPago === 'efectivo' && (
                <div style={{ padding: '6px 10px', background: '#fef3c7', borderRadius: 6, fontSize: 11, color: '#92400e', border: '1px solid #fde68a' }}>
                  Se descontará de la caja abierta automáticamente
                </div>
              )}
              <div style={{ display: 'flex', gap: 8 }}>
                <input required type="number" step="0.01" min="0.01" placeholder="Monto (C$) *" value={form.monto} onChange={e => setForm({...form, monto: e.target.value})}
                  style={{ flex: 1, padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
                <input required type="date" value={form.fecha} onChange={e => setForm({...form, fecha: e.target.value})}
                  style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
              </div>
              <input placeholder="Nota (opcional)" value={form.nota} onChange={e => setForm({...form, nota: e.target.value})}
                style={{ padding: 10, borderRadius: 8, border: '1px solid #e2e8f0', fontSize: 14, outline: 'none' }} />
              <button type="submit" className="btn-verde" style={{ padding: 12, fontSize: 15, fontWeight: 700 }}>
                <Icons.Save size={16} /> Guardar gasto
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Fecha', 'Concepto', 'Categoría', 'Método', 'Monto', 'Nota', ''].map(h => (
                <th key={h} style={{ padding: '12px 16px', fontSize: 12, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', textAlign: 'left' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
                <tr><td colSpan={7} style={{ padding: 40, textAlign: 'center', color: '#94a3b8' }}>No hay gastos registrados este mes</td></tr>
            ) : (
              gastos.map((g, i) => (
                <tr key={g.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px' }}>{new Date(g.fecha).toLocaleDateString('es-NI')}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{g.concepto}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ background: '#f1f5f9', padding: '4px 10px', borderRadius: 20, fontSize: 12, fontWeight: 600, color: '#475569' }}>{g.categoria}</span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                      background: g.metodoPago === 'efectivo' ? '#fef3c7' : '#f1f5f9',
                      color: g.metodoPago === 'efectivo' ? '#92400e' : '#475569'
                    }}>{g.metodoPago || 'efectivo'}</span>
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#dc2626' }}>C$ {g.monto.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>{g.nota || '—'}</td>
                  <td style={{ padding: '12px 16px' }}>
                    <button onClick={() => eliminar(g.id)}
                      style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid #fee2e2', background: '#fee2e2', cursor: 'pointer', color: '#dc2626' }}>
                      <Icons.Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}
