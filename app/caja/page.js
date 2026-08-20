'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import AuthGuard from '@/app/components/AuthGuard'
import { auditar } from '@/lib/auditarClient'
import * as Icons from 'lucide-react'

const DENOMINACIONES_CS = [1000, 500, 200, 100, 50, 20, 10, 5, 1, 0.5]
const DENOMINACIONES_US = [100, 50, 20, 10, 5, 2, 1]

export default function CajaPage() {
  const { user } = useAuth()
  const [caja, setCaja] = useState(null)
  const [historial, setHistorial] = useState([])
  const [cargando, setCargando] = useState(true)
  const [tab, setTab] = useState('actual')

  // Apertura
  const [montoApertura, setMontoApertura] = useState('')
  const [montoAperturaUs, setMontoAperturaUs] = useState('')
  const [error, setError] = useState('')
  const [msg, setMsg] = useState('')

  // Arqueo
  const [arqueo, setArqueo] = useState({ cs: {}, us: {} })
  const [observacion, setObservacion] = useState('')
  const [cerrando, setCerrando] = useState(false)

  // Detalle / edición de cierre
  const [detalleCaja, setDetalleCaja] = useState(null)
  const [editandoArqueo, setEditandoArqueo] = useState(false)
  const [arqueoEditar, setArqueoEditar] = useState({ cs: {}, us: {} })
  const [obsEditar, setObsEditar] = useState('')

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
      body: JSON.stringify({ montoInicial: parseFloat((montoApertura || '0').replace(',', '.')), montoInicialUs: parseFloat((montoAperturaUs || '0').replace(',', '.')), usuario: user?.nombre || user?.username })
    })
    const d = await r.json()
    if (!r.ok) { setError(d.error); return }
    auditar(user?.username, 'crear', 'caja', `Caja abierta con C$ ${montoApertura}${montoAperturaUs ? ', $ ' + montoAperturaUs : ''}`)
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

  function verDetalle(h) {
    setDetalleCaja(h)
    setEditandoArqueo(false)
  }

  function initEditarArqueo() {
    const cs = {}
    DENOMINACIONES_CS.forEach(d => { cs[d] = 0 })
    const us = {}
    DENOMINACIONES_US.forEach(d => { us[d] = 0 })
    ;(detalleCaja.arqueo || []).forEach(a => {
      if (a.moneda === 'C$') cs[a.denominacion] = a.cantidad
      else us[a.denominacion] = a.cantidad
    })
    setArqueoEditar({ cs, us })
    setObsEditar(detalleCaja.observacion || '')
    setEditandoArqueo(true)
  }

  function setDenomEditar(moneda, denom, val) {
    setArqueoEditar(prev => ({
      ...prev,
      [moneda]: { ...prev[moneda], [denom]: Math.max(0, parseInt(val) || 0) }
    }))
  }

  function totalArqueoEditar(moneda) {
    return Object.entries(arqueoEditar[moneda]).reduce((sum, [den, cant]) => sum + parseFloat(den) * cant, 0)
  }

  async function guardarArqueo(e) {
    e.preventDefault()
    setError('')
    const data = {
      arqueo: [
        ...Object.entries(arqueoEditar.cs).map(([den, cant]) => ({
          moneda: 'C$', denominacion: parseFloat(den), cantidad: cant, subtotal: parseFloat(den) * cant
        })),
        ...Object.entries(arqueoEditar.us).map(([den, cant]) => ({
          moneda: '$', denominacion: parseFloat(den), cantidad: cant, subtotal: parseFloat(den) * cant
        }))
      ],
      observacion: obsEditar
    }
    const r = await fetch(`/api/caja/${detalleCaja.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    })
    const d = await r.json()
    if (!r.ok) { setError(d.error); return }
    auditar(user?.username, 'editar', 'caja', `Arqueo editado caja #${detalleCaja.id} - Diferencia: C$ ${d.diferencia}`)
    setMsg('Arqueo actualizado exitosamente')
    setEditandoArqueo(false)
    setDetalleCaja(null)
    cargar()
  }

  const IconoCaja = caja ? <Icons.Circle fill="#dc2626" color="#dc2626" size={12} /> : <Icons.Circle fill="#16a34a" color="#16a34a" size={12} />

  if (cargando) return <AuthGuard modulos={['caja']}><div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div></AuthGuard>

  return (
    <AuthGuard modulos={['caja']}>
      <div style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '8px' }}>
          Caja
        </h1>
        <div style={{ color: caja ? '#dc2626' : '#16a34a', fontWeight: 600, marginBottom: '24px' }}>{IconoCaja} {caja ? 'Caja abierta' : 'Caja cerrada'}</div>

        {msg && <div style={{ padding: '10px 16px', background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8, color: '#166534', marginBottom: 16 }}>{msg}</div>}
        {error && <div style={{ padding: '10px 16px', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8, color: '#991b1b', marginBottom: 16 }}>{error}</div>}

        {!caja && !cerrando && (
          <form onSubmit={abrirCaja} style={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12, padding: 24 }}>
            <h2 style={{ fontSize: 16, fontWeight: 600, color: '#1e293b', marginBottom: 16 }}>Abrir Caja</h2>
            <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>Monto inicial C$</label>
                <input type="text" inputMode="text" step="0.01" value={montoApertura} onChange={e => { const v = e.target.value; if (/^\d*[.,]?\d*$/.test(v) || v === '') setMontoApertura(v.replace(',', '.')) }}
                  placeholder="0.00" required
                  style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: '100%' }}
                />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>Monto inicial $</label>
                <input type="text" inputMode="text" step="0.01" value={montoAperturaUs} onChange={e => { const v = e.target.value; if (/^\d*[.,]?\d*$/.test(v) || v === '') setMontoAperturaUs(v.replace(',', '.')) }}
                  placeholder="0.00"
                  style={{ padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, width: '100%' }}
                />
              </div>
            </div>
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
                <div style={{ fontSize: 14, fontWeight: 600, color: '#ca8a04', marginTop: 2 }}>$ {caja.montoInicialUs?.toFixed(2) || '0.00'}</div>
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
                  { label: 'Efectivo USD (ventas)', val: caja.ventasEfectivoUs, moneda: '$' },
                  { label: 'Abonos en efectivo C$', val: caja.abonosEfectivoCs || 0, moneda: 'C$' },
                  { label: 'Abonos en efectivo USD', val: caja.abonosEfectivoUs || 0, moneda: '$' },
                  { label: 'Tarjeta (al banco)', val: (caja.ventasTarjeta || 0) + (caja.abonosTarjeta || 0), moneda: 'C$', banco: true },
                  { label: 'Transferencia (al banco)', val: (caja.ventasTransfer || 0) + (caja.abonosTransfer || 0), moneda: 'C$', banco: true },
                ].map(m => (
                  <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: 14 }}>
                    <span style={{ color: '#475569' }}>{m.label}</span>
                    <span style={{ fontWeight: 600, color: m.banco ? '#7c3aed' : '#1e293b' }}>{m.moneda} {m.val.toFixed(2)}</span>
                  </div>
                  ))}
                </div>
                <div style={{ marginTop: 8, fontSize: 12, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 6, padding: '6px 10px' }}>
                  <b>Importante:</b> Tarjeta y transferencia NO entran a la caja física — van a una cuenta de banco. Solo el efectivo se cuenta en el arqueo.
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
                <input type="text" inputMode="text" step="0.01" min="0" value={movForm.monto} placeholder="Monto"
                  onChange={e => { const v = e.target.value; if (/^\d*[.,]?\d*$/.test(v) || v === '') setMovForm({ ...movForm, monto: v.replace(',', '.') }) }}
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
              <div style={{ display: 'flex', gap: 16, marginBottom: 12, fontSize: 13, flexWrap: 'wrap' }}>
                <span>Ingresos extra C$: <b style={{ color: '#16a34a' }}>C$ {caja.ingresosExtra.toFixed(2)}</b></span>
                {caja.ingresosExtraUs > 0 && <span>Ingresos extra USD: <b style={{ color: '#16a34a' }}>$ {caja.ingresosExtraUs.toFixed(2)}</b></span>}
                <span>Egresos C$: <b style={{ color: '#dc2626' }}>C$ {caja.egresos.toFixed(2)}</b></span>
                {caja.egresosUs > 0 && <span>Egresos USD: <b style={{ color: '#dc2626' }}>$ {caja.egresosUs.toFixed(2)}</b></span>}
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
                    <input type="text" inputMode="numeric" min="0" value={arqueo.cs[d]} onChange={e => { const v = e.target.value; if (/^\d*$/.test(v) || v === '') setDenominacion('cs', d, v) }}
                      style={{ width: '60px', padding: '6px 8px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 13 }}
                    />
                    <span style={{ fontSize: 12, color: '#94a3b8' }}>= C$ {(d * (arqueo.cs[d] || 0)).toFixed(2)}</span>
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
                    <input type="text" inputMode="numeric" min="0" value={arqueo.us[d]} onChange={e => { const v = e.target.value; if (/^\d*$/.test(v) || v === '') setDenominacion('us', d, v) }}
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
              <h4 style={{ margin: '0 0 8px', fontWeight: 600, color: '#1e293b' }}>Esperado en el cajón (solo efectivo)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                <span style={{ color: '#475569' }}>C$: Inicial {caja.montoInicial.toFixed(2)} + Efectivo {caja.ventasEfectivoCs.toFixed(2)} + Abonos efectivo {(caja.abonosEfectivoCs || 0).toFixed(2)} + Ingresos {caja.ingresosExtra.toFixed(2)} - Egresos {caja.egresos.toFixed(2)}</span>
                <span style={{ fontWeight: 600 }}>= C$ {(caja.montoInicial + caja.ventasEfectivoCs + (caja.abonosEfectivoCs || 0) + caja.ingresosExtra - caja.egresos).toFixed(2)}</span>
                <span style={{ color: '#475569' }}>$: Inicial {caja.montoInicialUs?.toFixed(2) || '0.00'} + Efectivo {(caja.ventasEfectivoUs + (caja.abonosEfectivoUs || 0)).toFixed(2)} {caja.ingresosExtraUs > 0 ? `+ Ingresos $${caja.ingresosExtraUs.toFixed(2)}` : ''} {caja.egresosUs > 0 ? `- Egresos $${caja.egresosUs.toFixed(2)}` : ''}</span>
                <span style={{ fontWeight: 600 }}>= $ {((caja.montoInicialUs || 0) + caja.ventasEfectivoUs + (caja.abonosEfectivoUs || 0) + (caja.ingresosExtraUs || 0) - (caja.egresosUs || 0)).toFixed(2)}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#7c3aed', background: '#f5f3ff', border: '1px solid #ddd6fe', borderRadius: 6, padding: '6px 10px' }}>
                A depositar al banco: Tarjeta <b>C$ {((caja.ventasTarjeta || 0) + (caja.abonosTarjeta || 0)).toFixed(2)}</b> + Transferencia <b>C$ {((caja.ventasTransfer || 0) + (caja.abonosTransfer || 0)).toFixed(2)}</b>. Estas no se cuentan en el arqueo físico.
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
            <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #e2e8f0', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13, minWidth: 1150 }}>
                <thead>
                  <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Fecha</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Abrió</th>
                    <th style={{ padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569' }}>Cerró</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Inic. C$</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Inic. $</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Ventas C$</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Abonos C$</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Tarjeta</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Transf.</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Ing.Extra</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Egresos</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Efectivo C$</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Efectivo $</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Dif. C$</th>
                    <th style={{ padding: '10px 12px', textAlign: 'right', fontWeight: 600, color: '#475569' }}>Dif. $</th>
                    <th style={{ padding: '10px 12px', textAlign: 'center', fontWeight: 600, color: '#475569' }}>Detalle</th>
                  </tr>
                </thead>
                <tbody>
                  {historial.map(h => (
                    <tr key={h.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                      <td style={{ padding: '10px 12px' }}>{new Date(h.cerradaEn).toLocaleDateString('es-NI')}</td>
                      <td style={{ padding: '10px 12px' }}>{h.usuarioApertura}</td>
                      <td style={{ padding: '10px 12px' }}>{h.usuarioCierre}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>C$ {h.montoInicial.toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>$ {h.montoInicialUs?.toFixed(2) || '0.00'}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>C$ {(h.ventasEfectivoCs || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right' }}>C$ {(h.abonosEfectivoCs || 0).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed' }}>C$ {((h.ventasTarjeta || 0) + (h.abonosTarjeta || 0)).toFixed(2)}</td>
                      <td style={{ padding: '10px 12px', textAlign: 'right', color: '#7c3aed' }}>C$ {((h.ventasTransfer || 0) + (h.abonosTransfer || 0)).toFixed(2)}</td>
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
                      <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                        <button onClick={() => verDetalle(h)} style={{
                          padding: '4px 10px', background: '#f3e8ff', color: '#7c3aed', border: '1px solid #d8b4fe',
                          borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer'
                        }}>Ver / Editar</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
        {/* Detalle / edición de arqueo */}
        {detalleCaja && (
          <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.5)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 20
          }} onClick={() => { setDetalleCaja(null); setEditandoArqueo(false) }}>
            <div onClick={e => e.stopPropagation()} style={{
              background: '#fff', borderRadius: 12, width: '100%', maxWidth: 860,
              maxHeight: '90vh', overflowY: 'auto', padding: 24, boxShadow: '0 20px 60px rgba(0,0,0,0.25)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: '#1e293b', margin: 0 }}>Detalle de cierre</h2>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    {new Date(detalleCaja.abiertaEn).toLocaleString('es-NI')} → {new Date(detalleCaja.cerradaEn).toLocaleString('es-NI')}
                  </div>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 2 }}>
                    Abrió: {detalleCaja.usuarioApertura} · Cerró: {detalleCaja.usuarioCierre}
                  </div>
                </div>
                <button onClick={() => { setDetalleCaja(null); setEditandoArqueo(false) }} style={{
                  background: 'none', border: 'none', fontSize: 24, cursor: 'pointer', color: '#64748b', lineHeight: 1
                }}>&times;</button>
              </div>

              {!editandoArqueo ? (
                <>
                  {/* Desglose de ingresos */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Desglose C$ (ingresado)</h4>
                      {[
                        { label: 'Ventas en efectivo', val: detalleCaja.ventasEfectivoCs || 0 },
                        { label: 'Abonos en efectivo', val: detalleCaja.abonosEfectivoCs || 0 },
                        { label: 'Ingresos extra', val: detalleCaja.ingresosExtra },
                        { label: 'Egresos', val: -detalleCaja.egresos },
                        { label: 'Monto inicial', val: detalleCaja.montoInicial },
                      ].map(f => (
                        <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                          <span style={{ color: '#475569' }}>{f.label}</span>
                          <span style={{ fontWeight: 600, color: f.val < 0 ? '#dc2626' : '#1e293b' }}>
                            {f.val < 0 ? '-C$ ' : 'C$ '}{Math.abs(f.val).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 6, marginTop: 4, borderTop: '2px solid #e2e8f0', fontWeight: 700, color: '#1e293b' }}>
                        <span>Esperado en caja</span>
                        <span>C$ {(detalleCaja.montoInicial + (detalleCaja.ventasEfectivoCs || 0) + (detalleCaja.abonosEfectivoCs || 0) + detalleCaja.ingresosExtra - detalleCaja.egresos).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 4 }}>
                        <span style={{ color: '#475569' }}>Arqueo real</span>
                        <span style={{ fontWeight: 700, color: '#166534' }}>C$ {(detalleCaja.efectivoRealCs || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 4, fontWeight: 700, color: detalleCaja.diferencia < 0 ? '#dc2626' : detalleCaja.diferencia > 0 ? '#d97706' : '#16a34a' }}>
                        <span>Diferencia</span>
                        <span>C$ {(detalleCaja.diferencia || 0).toFixed(2)}</span>
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Banco y crédito (fuera del cajón)</h4>
                      {[
                        { label: 'Tarjeta (ventas + abonos)', val: (detalleCaja.ventasTarjeta || 0) + (detalleCaja.abonosTarjeta || 0) },
                        { label: 'Transferencia (ventas + abonos)', val: (detalleCaja.ventasTransfer || 0) + (detalleCaja.abonosTransfer || 0) },
                        { label: 'Crédito por cobrar', val: detalleCaja.ventasCredito || 0 },
                      ].map(f => (
                        <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                          <span style={{ color: '#475569' }}>{f.label}</span>
                          <span style={{ fontWeight: 600, color: '#7c3aed' }}>C$ {f.val.toFixed(2)}</span>
                        </div>
                      ))}
                      <div style={{ marginTop: 6, fontSize: 11, color: '#64748b' }}>
                        Estos montos NO van al cajón: se depositan al banco o quedan por cobrar.
                      </div>
                    </div>
                    <div style={{ background: '#f8fafc', borderRadius: 8, padding: 12 }}>
                      <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Desglose USD (ingresado)</h4>
                      {[
                        { label: 'Ventas en efectivo USD', val: detalleCaja.ventasEfectivoUs || 0 },
                        { label: 'Abonos en efectivo USD', val: detalleCaja.abonosEfectivoUs || 0 },
                        { label: 'Ingresos extra USD', val: detalleCaja.ingresosExtraUs },
                        { label: 'Egresos USD', val: -detalleCaja.egresosUs },
                        { label: 'Monto inicial USD', val: detalleCaja.montoInicialUs || 0 },
                      ].map(f => (
                        <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0' }}>
                          <span style={{ color: '#475569' }}>{f.label}</span>
                          <span style={{ fontWeight: 600, color: f.val < 0 ? '#dc2626' : '#1e293b' }}>
                            {f.val < 0 ? '-$ ' : '$ '}{Math.abs(f.val).toFixed(2)}
                          </span>
                        </div>
                      ))}
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 6, marginTop: 4, borderTop: '2px solid #e2e8f0', fontWeight: 700, color: '#1e293b' }}>
                        <span>Esperado en caja</span>
                        <span>$ {((detalleCaja.montoInicialUs || 0) + (detalleCaja.ventasEfectivoUs || 0) + (detalleCaja.abonosEfectivoUs || 0) + (detalleCaja.ingresosExtraUs || 0) - (detalleCaja.egresosUs || 0)).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, paddingTop: 4 }}>
                        <span style={{ color: '#475569' }}>Arqueo real</span>
                        <span style={{ fontWeight: 700, color: '#166534' }}>$ {(detalleCaja.efectivoRealUs || 0).toFixed(2)}</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14, paddingTop: 4, fontWeight: 700, color: detalleCaja.diferenciaUs < 0 ? '#dc2626' : detalleCaja.diferenciaUs > 0 ? '#d97706' : '#16a34a' }}>
                        <span>Diferencia</span>
                        <span>$ {(detalleCaja.diferenciaUs || 0).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>

                  {/* Denominaciones contadas */}
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Arqueo contado (denominaciones)</h4>
                  {(detalleCaja.arqueo || []).length === 0 ? (
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 12 }}>Sin detalle de denominaciones registrado.</div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 16 }}>
                      <div>
                        {detalleCaja.arqueo.filter(a => a.moneda === 'C$').map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                            <span style={{ color: '#475569' }}>C$ {a.denominacion} × {a.cantidad}</span>
                            <span style={{ fontWeight: 600 }}>C$ {a.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        {detalleCaja.arqueo.filter(a => a.moneda === '$').map(a => (
                          <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '2px 0' }}>
                            <span style={{ color: '#475569' }}>$ {a.denominacion} × {a.cantidad}</span>
                            <span style={{ fontWeight: 600 }}>$ {a.subtotal.toFixed(2)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Movimientos */}
                  <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Movimientos de caja</h4>
                  {(detalleCaja.movimientos || []).length === 0 ? (
                    <div style={{ fontSize: 13, color: '#94a3b8', marginBottom: 16 }}>Sin movimientos registrados.</div>
                  ) : (
                    <div style={{ maxHeight: 160, overflowY: 'auto', marginBottom: 16 }}>
                      {detalleCaja.movimientos.map(m => (
                        <div key={m.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '4px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#475569' }}>{m.tipo === 'entrada' ? '+ ' : '- '}{m.concepto}</span>
                          <span style={{ fontWeight: 600, color: m.tipo === 'entrada' ? '#16a34a' : '#dc2626' }}>
                            {m.moneda} {m.monto.toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {detalleCaja.observacion && (
                    <div style={{ fontSize: 13, color: '#475569', background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '8px 12px', marginBottom: 16 }}>
                      <b>Observación:</b> {detalleCaja.observacion}
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button onClick={initEditarArqueo} style={{
                      padding: '10px 20px', background: '#7c3aed', color: '#fff', border: 'none',
                      borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                    }}>Editar Arqueo</button>
                    <button onClick={() => { setDetalleCaja(null); setEditandoArqueo(false) }} style={{
                      padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                      borderRadius: 8, fontSize: 14, cursor: 'pointer'
                    }}>Cerrar</button>
                  </div>
                </>
              ) : (
                <form onSubmit={guardarArqueo}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Córdobas (C$)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                        {DENOMINACIONES_CS.map(d => (
                          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 12, color: '#475569', minWidth: 38 }}>C$ {d}</span>
                            <input type="text" inputMode="numeric" min="0" value={arqueoEditar.cs[d]}
                              onChange={e => { const v = e.target.value; if (/^\d*$/.test(v) || v === '') setDenomEditar('cs', d, v) }}
                              style={{ width: '52px', padding: '5px 6px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#166534' }}>
                        Total: C$ {totalArqueoEditar('cs').toFixed(2)}
                      </div>
                    </div>
                    <div>
                      <h4 style={{ margin: '0 0 8px', fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Dólares ($)</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
                        {DENOMINACIONES_US.map(d => (
                          <div key={d} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <span style={{ fontSize: 12, color: '#475569', minWidth: 38 }}>$ {d}</span>
                            <input type="text" inputMode="numeric" min="0" value={arqueoEditar.us[d]}
                              onChange={e => { const v = e.target.value; if (/^\d*$/.test(v) || v === '') setDenomEditar('us', d, v) }}
                              style={{ width: '52px', padding: '5px 6px', border: '1px solid #e2e8f0', borderRadius: 6, fontSize: 12 }}
                            />
                          </div>
                        ))}
                      </div>
                      <div style={{ marginTop: 8, fontSize: 13, fontWeight: 700, color: '#166534' }}>
                        Total: $ {totalArqueoEditar('us').toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div style={{ marginBottom: 16 }}>
                    <label style={{ display: 'block', fontSize: 13, color: '#64748b', marginBottom: 4 }}>Observación</label>
                    <textarea value={obsEditar} onChange={e => setObsEditar(e.target.value)} rows={2}
                      placeholder="Opcional"
                      style={{ width: '100%', padding: '10px 14px', border: '1px solid #e2e8f0', borderRadius: 8, fontSize: 14, resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button type="submit" style={{
                      padding: '10px 20px', background: '#16a34a', color: '#fff', border: 'none',
                      borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer'
                    }}>Guardar cambios</button>
                    <button type="button" onClick={() => setEditandoArqueo(false)} style={{
                      padding: '10px 20px', background: '#f1f5f9', color: '#475569', border: '1px solid #e2e8f0',
                      borderRadius: 8, fontSize: 14, cursor: 'pointer'
                    }}>Cancelar</button>
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </div>
    </AuthGuard>
  )
}