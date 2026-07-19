'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import AuthGuard from '@/app/components/AuthGuard'
import { auditar } from '@/lib/auditarClient'
import * as Icons from 'lucide-react'

const DENOMINACIONES_CS = [1000, 500, 200, 100, 50, 25, 20, 10, 5]
const DENOMINACIONES_US = [100, 50, 20, 10, 5, 2, 1]

export default function CajaPage() {
  const { user } = useAuth()
  const [caja, setCaja] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState('actual')

  // Apertura
  const [montoApertura, setMontoApertura] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // Arqueo
  const [arqueo, setArqueo] = useState({ cs: {}, us: {} })
  const [observacion, setObservacion] = useState('')
  const [cerrando, setCerrando] = useState(false)

  // Movimientos
  const [movimientos, setMovimientos] = useState([])
  const [movForm, setMovForm] = useState({ tipo: 'entrada', concepto: '', moneda: 'C$', monto: '' })

  useEffect(() => { cargar() }, [])

  async function cargar() {
    setCargando(true)
    try {
      const r = await fetch('/api/caja')
      const d = await r.json()
      setCaja(d.actual)
      if (d.actual) { fetchMovimientos() }
      setHistorial(d.historial || [])
    } catch (e) { console.error('Error cargando caja:', e) }
    setCargando(false)
  }

  async function fetchMovimientos() {
    const r = await fetch('/api/caja/movimientos')
    setMovimientos(await r.json())
  }

  async function addMovimiento(e) {
    e.preventDefault()
    const r = await fetch('/api/caja/movimientos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(movForm)
    })
    if (!r.ok) { setError((await r.json()).error); return }
    auditar(user?.username, 'crear', 'caja', `Movimiento: ${movForm.tipo} ${movForm.moneda} ${movForm.monto} - ${movForm.concepto}`)
    setMovForm({ tipo: 'entrada', concepto: '', moneda: 'C$', monto: '' })
    fetchMovimientos()
    cargar() // refresh caja totals
  }

  async function deleteMovimiento(id) {
    if (!confirm('¿Eliminar este movimiento?')) return
    const r = await fetch('/api/caja/movimientos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id })
    })
    if (!r.ok) { setError((await r.json()).error); return }
    fetchMovimientos()
    cargar()
  }

  async function abrirCaja(e) {
    e.preventDefault()
    setError('')
    setMsg('')
    const r = await fetch('/api/caja', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ montoInicial: parseFloat(montoApertura || 0), usuario: user?.nombre || user?.username })
    })
    const d = await r.json()
    if (!r.ok) { setError(d.error); return }
    auditar(user?.username, 'crear', 'caja', `Caja abierta con C$ ${montoApertura}`)
    setMsg('Caja abierta exitosamente')
    cargar()
  }

  function initArqueo() {
    const cs = {}
    DENOMINACIONES_CS.forEach(d => { cs[d] = 0 })
    const us = {}
    DENOMINACIONES_US.forEach(d => { us[d] = 0 })
    setArqueo({ cs, us })
    setCerrando(true)
  }

  function setDenominacion(moneda, denom, val) {
    setArqueo(prev => ({
      ...prev,
      [moneda]: { ...prev[moneda], [denom]: Math.max(0, parseInt(val) || 0) }
    }))
  }

  function totalArqueo(moneda) {
    return Object.entries(arqueo[moneda]).reduce((sum, [den, cant]) => sum + parseFloat(den) * cant, 0)
  }

  async function cerrarCaja(e) {
    e.preventDefault()
    setError('')
    const data = {
      arqueo: [
        ...Object.entries(arqueo.cs).map(([den, cant]) => ({
          moneda: 'C$', denominacion: parseFloat(den), cantidad: cant, subtotal: parseFloat(den) * cant
        })),
        ...Object.entries(arqueo.us).map(([den, cant]) => ({
          moneda: '$', denominacion: parseFloat(den), cantidad: cant, subtotal: parseFloat(den) * cant
        }))
      ],
      observacion,
      usuario: user?.nombre || user?.username
    }
    const r = await fetch('/api/caja/cerrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const d = await r.json()
    if (!r.ok) { setError(d.error); return }
    auditar(user?.username, 'editar', 'caja', `Caja cerrada - Diferencia: C$ ${d.diferencia}`)
    setMsg('Caja cerrada exitosamente')
    setCerrando(false)
    cargar()
  }

  const IconoCaja = caja ? <Icons.Circle fill="#dc2626" color="#dc2626" size={12} /> : <Icons.Circle fill="#16a34a" color="#16a34a" size={12} />

  if (cargando) return <AuthGuard modulos={['caja']}><div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div></AuthGuard>

  return (
    <AuthGuard modulos={['caja']}>
      <div style={{ padding: '24px', maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          Caja
        </h1>
        <div style={{ color: caja ? '#dc2626' : '#16a34a', fontWeight: 600, marginBottom: '24px' }}>{IconoCaja} {caja ? 'Caja abierta' : 'Caja cerrada'}</div>

        {msg && <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, color: '#166534', marginBottom: 16 }}>{msg}</div>}
        {error && <div style={{ padding: '10px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b', marginBottom: 16 }}>{error}</div>}

        {!caja && !cerrando && (
          <form onSubmit={abrirCaja} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>Abrir Caja</h2>
            <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>Monto inicial (C$)</label>
            <input type="number" step="0.01" value={montoApertura} onChange={e => setMontoApertura(e.target.value)}
              placeholder="0.00" required
              style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: '100%', marginBottom: 16 }}
            />
            <button type="submit" style={{
              padding: '10px 24px', background: '#16a34a', color: '#fff', border: 'none',
              borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
            }}>Abrir Caja</button>
          </form>
        )}

        {caja && !cerrando && (
          <div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 20 }}>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Abierta por</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>{caja.usuarioApertura}</div>
                <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>{new Date(caja.abiertaEn).toLocaleString('es-NI')}</div>
              </div>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Monto inicial</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>C$ {caja.montoInicial.toFixed(2)}</div>
              </div>
              <div style={{ flex: 1, background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16 }}>
                <div style={{ fontSize: 12, color: '#64748b' }}>Total ingresado</div>
                <div style={{ fontSize: 16, fontWeight: 600, color: '#1e293b' }}>C$ {caja.totalVendido.toFixed(2)}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>Solo pagos reales (sin crédito)</div>
              </div>
            </div>

            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 12px' }}>Ingresos por método de pago</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[
                  { label: 'Efectivo C$ (ventas)', val: caja.ventasEfectivoCs, moneda: 'C$' },
                  { label: 'Efectivo USD', val: caja.ventasEfectivoUs, moneda: '$' },
                  { label: 'Abonos de clientes', val: caja.abonosTotal || 0, moneda: 'C$' },
                  { label: 'Tarjeta', val: caja.ventasTarjeta, moneda: 'C$' },
                  { label: 'Transferencia', val: caja.ventasTransfer, moneda: 'C$' },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                    <span style={{ color: '#475569' }}>{m.label}</span>
                    <span style={{ fontWeight: 600, color: '#1e293b' }}>{m.moneda} {m.val.toFixed(2)}</span>
                  </div>
                  ))}
                </div>
              </div>
            {/* Movimientos */}
            <div style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', margin: '0 0 12px' }}>Movimientos de Caja</h3>

              <form onSubmit={addMovimiento} style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
                <select value={movForm.tipo} onChange={e => setMovForm({ ...movForm, tipo: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}>
                  <option value="entrada">Entrada</option>
                  <option value="salida">Salida</option>
                </select>
                <select value={movForm.moneda} onChange={e => setMovForm({ ...movForm, moneda: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}>
                  <option value="C$">C$</option>
                  <option value="$">$</option>
                </select>
                <input type="number" step="0.01" min="0" value={movForm.monto} placeholder="Monto"
                  onChange={e => setMovForm({ ...movForm, monto: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, width: 100 }} required
                />
                <input type="text" value={movForm.concepto} placeholder="Concepto"
                  onChange={e => setMovForm({ ...movForm, concepto: e.target.value })}
                  style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13, flex: 1, minWidth: 150 }} required
                />
                <button type="submit" style={{
                  padding: '8px 16px', background: movForm.tipo === 'entrada' ? '#16a34a' : '#dc2626', color: '#fff',
                  border: 'none', borderRadius: 6, fontSize: 13, fontWeight: 600, cursor: 'pointer'
                }}>Agregar</button>
              </form>

              {/* Resumen */}
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13 }}>
                <span>Ingresos extra: <b style={{ color: '#16a34a' }}>C$ {caja.ingresosExtra.toFixed(2)}</b></span>
                <span>Egresos: <b style={{ color: '#dc2626' }}>C$ {caja.egresos.toFixed(2)}</b></span>
              </div>

              {movimientos.length === 0 ? (
                <div style={{ fontSize: 13, color: '#94a3b8', padding: '12px 0', textAlign: 'center' }}>Sin movimientos</div>
              ) : (
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {movimientos.map(m => (
                    <div key={m.id} style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 13
                    }}>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{
                          padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
                          background: m.tipo === 'entrada' ? '#dcfce7' : '#fef2f2',
                          color: m.tipo === 'entrada' ? '#16a34a' : '#dc2626'
                        }}>{m.tipo === 'entrada' ? '+ Entrada' : '- Salida'}</span>
                        <span style={{ color: '#475569' }}>{m.concepto}</span>
                        {m.concepto?.startsWith('Gasto #') && (
                          <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 4, background: '#fef3c7', color: '#92400e', fontWeight: 600 }}>Gasto</span>
                        )}
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, color: m.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>
                          {m.moneda} {m.monto.toFixed(2)}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>{new Date(m.creadoEn).toLocaleTimeString('es-NI', { hour: '2-digit', minute: '2-digit' })}</span>
                        <button onClick={() => deleteMovimiento(m.id)} style={{
                          background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16, padding: '0 4px'
                        }} title="Eliminar">&times;</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button onClick={initArqueo} style={{
              padding: '12px 24px', background: '#dc2626', color: '#fff', border: 'none',
              borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer', width: '100%'
            }}>Cerrar Caja y hacer Arqueo</button>
          </div>
        )}

        {cerrando && (
          <form onSubmit={cerrarCaja} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>Arqueo de Caja</h2>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Córdobas (C$)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {DENOMINACIONES_CS.map(d => (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, color: '#475569', minWidth: 40 }}>C$ {d}</span>
                    <input type="number" min="0" value={arqueo.cs[d]} onChange={e => setDenominacion('cs', d, e.target.value)}
                      style={{ width: '60px', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>= C$ {(d * (arqueo.cs[d] || 0)).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: '#166534' }}>
                Total C$: {totalArqueo('cs').toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: 20 }}>
              <h3 style={{ fontSize: 14, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>Dólares ($)</h3>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
                {DENOMINACIONES_US.map(d => (
                  <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <span style={{ fontSize: 13, color: '#475569', minWidth: 40 }}>$ {d}</span>
                    <input type="number" min="0" value={arqueo.us[d]} onChange={e => setDenominacion('us', d, e.target.value)}
                      style={{ width: '60px', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>= $ {(d * (arqueo.us[d] || 0)).toFixed(0)}</span>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 14, fontWeight: 600, color: '#166534' }}>
                Total USD: $ {totalArqueo('us').toFixed(2)}
              </div>
            </div>

            <div style={{ marginBottom: 16, background: '#f8fafc', borderRadius: 8, padding: 12, fontSize: 13 }}>
              <h4 style={{ margin: '0 0 8px', fontWeight: 600, color: '#1e293b' }}>Esperado</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <span style={{ color: '#475569' }}>C$: Inicial {caja.montoInicial.toFixed(2)} + Efectivo {caja.ventasEfectivoCs.toFixed(2)} + Abonos {caja.abonosTotal?.toFixed(2) || '0.00'} + Ingresos {caja.ingresosExtra.toFixed(2)} - Egresos {caja.egresos.toFixed(2)}</span>
                <span style={{ fontWeight: 600 }}>= C$ {(caja.montoInicial + caja.ventasEfectivoCs + (caja.abonosTotal || 0) + caja.ingresosExtra - caja.egresos).toFixed(2)}</span>
                <span style={{ color: '#475569' }}>$: Ventas {caja.ventasEfectivoUs.toFixed(2)}</span>
                <span style={{ fontWeight: 600 }}>= $ {caja.ventasEfectivoUs.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>Observación</label>
              <textarea value={observacion} onChange={e => setObservacion(e.target.value)} rows={2}
                placeholder="Opcional"
                style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8 }}>
              <button type="submit" style={{
                flex: 1, padding: '12px', background: '#dc2626', color: '#fff', border: 'none',
                borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
              }}>Cerrar Caja</button>
              <button type="button" onClick={() => setCerrando(false)} style={{
                padding: '12px 24px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                borderRadius: 8, fontSize: 14, cursor: 'pointer'
              }}>Cancelar</button>
            </div>
          </form>
        )}

        {/* Historial */}
        {historial.length > 0 && (
          <div style={{ marginTop: 32 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 12 }}>Historial de cierres</h2>
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Fecha</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Abrió</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Cerró</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Inicial</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Vendido</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Ing.Extra</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Egresos</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Efectivo C$</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Efectivo $</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Dif. C$</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Dif. $</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}>{new Date(h.cerradaEn).toLocaleDateString('es-NI')}</td>
                      <td style={{ padding: '10px 12px' }}>{h.usuarioApertura}</td>
                      <td style={{ padding: '10px 12px' }}>{h.usuarioCierre}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>C$ {h.montoInicial.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>C$ {h.totalVendido.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>C$ {h.ingresosExtra.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#dc2626' }}>C$ {h.egresos.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>C$ {h.efectivoRealCs?.toFixed(2) || '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>$ {h.efectivoRealUs?.toFixed(2) || '—'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: h.diferencia < 0 ? '#dc2626' : h.diferencia > 0 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                        C$ {h.diferencia?.toFixed(2) || '—'}
                      </td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: h.diferenciaUs < 0 ? '#dc2626' : h.diferenciaUs > 0 ? '#d97706' : '#16a34a', fontWeight: 600 }}>
                        $ {h.diferenciaUs?.toFixed(2) || '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}