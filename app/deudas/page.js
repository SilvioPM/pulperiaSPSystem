'use client'
import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import Toast from '../components/Toast'
import AbonoRecibo from '../components/AbonoRecibo'
import { useToast } from '../hooks/useToast'
import * as Icons from 'lucide-react'
import { useTecladoVirtual } from '@/app/context/TecladoVirtualContext'

export default function Deudas() {
  const { visible: tecladoVisible, keyboardHeight: tecladoAlturaRaw } = useTecladoVirtual()
  const tecladoAltura = tecladoVisible && tecladoAlturaRaw === 0 ? 240 : tecladoAlturaRaw
  const [compras, setCompras]       = useState([])
  const [compraSeleccionada, setCompraSeleccionada] = useState(null)
  const [mostrarAbono, setMostrarAbono] = useState(false)
  const [formAbono, setFormAbono]     = useState({ monto: '', nota: '', fuente: 'caja' })
  const [guardando, setGuardando]     = useState(false)
  const [cargando, setCargando]       = useState(true)
  const [filtro, setFiltro]           = useState('pendientes')
  const [config, setConfig]           = useState({})
  const [reciboAbono, setReciboAbono] = useState(null)
  const { toast, mostrar, cerrar } = useToast()
  const reciboRef = useRef(null)
  const ultimoAbonoRef = useRef(null)
  const imprimirAbono = useReactToPrint({ contentRef: reciboRef, documentTitle: 'Abono' })

  useEffect(() => {
    cargarCompras().finally(() => setCargando(false))
    fetch('/api/config').then(r => r.json()).then(setConfig).catch(() => {})
  }, [])

  async function cargarCompras() {
    try {
      const [resCompras, resProveedores] = await Promise.all([
        fetch('/api/compras?limit=10000'),
        fetch('/api/proveedores')
      ])
      const dataCompras = await resCompras.json()
      const dataProv = await resProveedores.json()
      const comprasArr = Array.isArray(dataCompras) ? dataCompras : (dataCompras.data || [])
      const creditos = comprasArr.filter(f => f.esCredito && f.estado !== 'anulada')

      const provArr = Array.isArray(dataProv) ? dataProv : []
      const saldoInicialArr = provArr
        .filter(p => (p.saldoInicialCxp || 0) > (p.saldoInicialCxpPagado || 0))
        .map(p => ({
          id: `saldo-${p.id}`,
          tipo: 'saldo_inicial',
          proveedor: p,
          numero: 'Saldo anterior',
          total: p.saldoInicialCxp || 0,
          saldoPendiente: (p.saldoInicialCxp || 0) - (p.saldoInicialCxpPagado || 0),
          abonos: [],
          creadoEn: null,
          esCredito: true,
          fechaVencimiento: null
        }))

      setCompras([...creditos, ...saldoInicialArr])
    } catch {
      setCompras([])
    }
  }

  async function registrarAbono(e) {
    e.preventDefault()
    if (!compraSeleccionada) return
    setGuardando(true)
    try {
      const esSaldoInicial = compraSeleccionada.tipo === 'saldo_inicial'
      const monto = parseFloat(formAbono.monto.replace(',', '.'))
      let res
      if (esSaldoInicial) {
        res = await fetch(`/api/proveedores/${compraSeleccionada.proveedor.id}/abonar-inicial`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ monto, nota: formAbono.nota, fuente: formAbono.fuente })
        })
      } else {
        res = await fetch('/api/abonos-compra', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ compraId: compraSeleccionada.id, monto, nota: formAbono.nota, fuente: formAbono.fuente })
        })
      }

      if (res.ok) {
        const nuevoSaldoPendiente = esSaldoInicial
          ? 0
          : (compraSeleccionada.saldoPendiente - monto)
        setReciboAbono({
          tipo: 'cxp',
          numero: compraSeleccionada.numero,
          entidad: compraSeleccionada.proveedor?.nombre || 'Proveedor',
          montoOriginal: compraSeleccionada.total,
          abonoMonto: monto,
          saldoPendiente: Math.max(0, nuevoSaldoPendiente),
          nota: formAbono.nota
        })
        ultimoAbonoRef.current = {
          tipo: 'cxp',
          numero: compraSeleccionada.numero,
          entidad: compraSeleccionada.proveedor?.nombre || 'Proveedor',
          montoOriginal: compraSeleccionada.total,
          abonoMonto: monto,
          saldoPendiente: Math.max(0, nuevoSaldoPendiente),
          nota: formAbono.nota
        }
        setMostrarAbono(false)
        setFormAbono({ monto: '', nota: '', fuente: 'caja' })
        setCompraSeleccionada(null)
        cargarCompras()
        setTimeout(() => imprimirAbono(), 300)
      } else {
        const data = await res.json()
        mostrar(data.error || 'Error al registrar abono', 'error')
      }
    } catch {
      mostrar('Error de red al registrar abono', 'error')
    }
    setGuardando(false)
  }

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const pendientes = compras.filter(f => f.saldoPendiente > 0)
  const pagadas    = compras.filter(f => f.saldoPendiente <= 0)
  const mostradas  = filtro === 'pendientes' ? pendientes : pagadas

  const totalPendiente = pendientes.reduce((sum, f) => sum + f.saldoPendiente, 0)

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>

  function reimprimirUltimoAbono() {
    if (!ultimoAbonoRef.current) return
    setReciboAbono(ultimoAbonoRef.current)
    setTimeout(() => imprimirAbono(), 300)
  }

  function reimprimirAbono(a) {
    if (!compraSeleccionada) return
    const abonosOrdenados = [...(compraSeleccionada.abonos || [])].sort((x, y) => new Date(x.creadoEn) - new Date(y.creadoEn))
    const hastaAqui = abonosOrdenados.filter(x => new Date(x.creadoEn) <= new Date(a.creadoEn))
    const totalAbonado = hastaAqui.reduce((s, x) => s + x.monto, 0)
    setReciboAbono({
      tipo: 'cxp',
      numero: compraSeleccionada.numero,
      entidad: compraSeleccionada.proveedor?.nombre || 'Proveedor',
      montoOriginal: compraSeleccionada.total,
      abonoMonto: a.monto,
      saldoPendiente: Math.max(0, compraSeleccionada.total - totalAbonado),
      nota: a.nota
    })
    setTimeout(() => imprimirAbono(), 300)
  }

  return (
    <div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
      {/* Encabezado */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.CreditCard size={24} /> Cuentas por Pagar (CXP)
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Deudas con proveedores y historial de pagos
        </p>
      </div>

      {/* Tarjeta resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Deuda Total con Proveedores</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#dc2626' }}>
            C$ {totalPendiente.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{pendientes.length} facturas por pagar</div>
        </div>
      </div>

      {ultimoAbonoRef.current && (
        <div style={{ marginBottom: '16px' }}>
          <button onClick={reimprimirUltimoAbono}
            style={{
              padding: '10px 18px', borderRadius: '8px', border: '2px dashed #6b7280',
              background: '#f3f4f6', cursor: 'pointer', fontSize: '14px', fontWeight: 600,
              color: '#374151', display: 'inline-flex', alignItems: 'center', gap: 8
            }}>
            <Icons.Printer size={16} /> Reimprimir último abono
          </button>
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { key: 'pendientes', label: `Pendientes (${pendientes.length})` },
          { key: 'pagadas',    label: `Pagadas (${pagadas.length})`      },
        ].map(t => (
          <button key={t.key} onClick={() => setFiltro(t.key)}
            style={{
              padding: '8px 20px', borderRadius: '8px', border: 'none',
              cursor: 'pointer', fontWeight: 600, fontSize: '14px',
              background: filtro === t.key ? 'white' : 'transparent',
              color: filtro === t.key ? '#1e293b' : '#64748b',
              boxShadow: filtro === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.2s'
            }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              {t.key === 'pendientes' ? <Icons.ClipboardList size={16} /> : <Icons.CheckCircle size={16} />}
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {/* Lista de deudas */}
      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Factura #', 'Proveedor', 'Fecha', 'Vencimiento', 'Total', 'Abonado', 'Pendiente', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mostradas.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  No hay deudas {filtro === 'pendientes' ? 'pendientes' : 'pagadas'}
                </td>
              </tr>
            ) : (
              mostradas.map((f, i) => {
                const abonado = f.abonos?.reduce((sum, a) => sum + a.monto, 0) || 0
                const esSaldoInicial = f.tipo === 'saldo_inicial'
                return (
                <tr key={f.id} style={{
                  borderBottom: '1px solid #f1f5f9',
                  background: i % 2 === 0 ? 'white' : '#fafafa',
                  opacity: esSaldoInicial ? 0.85 : 1
                }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: esSaldoInicial ? '#ca8a04' : '#2563eb', fontSize: '14px' }}>
                    {esSaldoInicial ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icons.ClipboardList size={14} /> Saldo anterior</span> : f.numero}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: '14px' }}>
                    {f.proveedor?.nombre}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {esSaldoInicial ? '—' : formatearFecha(f.creadoEn)}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {f.fechaVencimiento ? formatearFecha(f.fechaVencimiento) : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                    C$ {f.total.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 600 }}>
                    C$ {abonado.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{ fontWeight: 700, color: f.saldoPendiente > 0 ? '#dc2626' : '#16a34a' }}>
                      C$ {f.saldoPendiente.toFixed(2)}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    {f.saldoPendiente > 0 && (
                      <button
                        onClick={() => { setCompraSeleccionada(f); setMostrarAbono(true) }}
                        style={{
                          padding: '6px 12px', borderRadius: '6px', border: 'none',
                          background: '#16a34a', color: 'white',
                          cursor: 'pointer', fontSize: '13px', fontWeight: 600
                        }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.ArrowUpRight size={16} /> Abonar</span>
                      </button>
                    )}
                  </td>
                </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal registrar abono */}
      {mostrarAbono && compraSeleccionada && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: tecladoVisible ? 'flex-start' : 'center', justifyContent: 'center',
          paddingTop: tecladoVisible ? 20 : 0, paddingBottom: tecladoVisible ? tecladoAltura + 20 : 0,
          overflow: tecladoVisible ? 'auto' : 'hidden', boxSizing: 'border-box', zIndex: 50
        }}>
          <div className="card" style={{ width: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.ArrowUpRight size={16} /> Abonar a Proveedor</span></h2>
              <button onClick={() => { setMostrarAbono(false); setFormAbono({ monto: '', nota: '', fuente: 'caja' }) }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px' }}>
              <div style={{ marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Proveedor: </span>
                <span style={{ fontWeight: 700 }}>{compraSeleccionada.proveedor?.nombre}</span>
              </div>
              {compraSeleccionada.tipo === 'saldo_inicial' && (
                <div style={{ marginBottom: '8px' }}>
                  <span style={{ fontSize: '13px', color: '#64748b' }}>Concepto: </span>
                  <span style={{ fontWeight: 700, color: '#ca8a04' }}>Saldo anterior</span>
                </div>
              )}
              <div>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Pendiente: </span>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>C$ {compraSeleccionada.saldoPendiente.toFixed(2)}</span>
              </div>
            </div>

            {compraSeleccionada.abonos?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Pagos anteriores:
                </div>
                {compraSeleccionada.abonos.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px'
                  }}>
                    <span style={{ color: '#64748b' }}>
                      {new Date(a.creadoEn).toLocaleDateString('es-NI')}
                      {a.nota && ` — ${a.nota}`}
                    </span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontWeight: 600, color: '#dc2626' }}>
                        C$ {a.monto.toFixed(2)}
                      </span>
                      <button type="button" onClick={() => reimprimirAbono(a)}
                        title="Reimprimir recibo"
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', padding: 2, display: 'inline-flex' }}>
                        <Icons.Printer size={14} />
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={registrarAbono}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Monto a pagar (C$)</label>
                <input required type="text" inputMode="text" step="0.01" max={compraSeleccionada.saldoPendiente}
                  value={formAbono.monto} onChange={e => { const v = e.target.value; if (/^\d*[.,]?\d*$/.test(v) || v === '') setFormAbono({...formAbono, monto: v}) }}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '4px' }}>Nota</label>
                <input value={formAbono.nota} onChange={e => setFormAbono({...formAbono, nota: e.target.value})}
                  placeholder="Ej: Pago con transferencia"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }} />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, display: 'block', marginBottom: '8px' }}>Fuente del pago</label>
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 14px', borderRadius: 8, border: formAbono.fuente === 'caja' ? '2px solid #16a34a' : '1px solid #e2e8f0', background: formAbono.fuente === 'caja' ? '#f0fdf4' : 'white', flex: 1 }}>
                    <input type="radio" name="fuente" value="caja" checked={formAbono.fuente === 'caja'} onChange={e => setFormAbono({...formAbono, fuente: e.target.value})} style={{ accentColor: '#16a34a' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}><Icons.Wallet size={14} /> Desde caja</span>
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', padding: '8px 14px', borderRadius: 8, border: formAbono.fuente === 'otro' ? '2px solid #ca8a04' : '1px solid #e2e8f0', background: formAbono.fuente === 'otro' ? '#fef9c3' : 'white', flex: 1 }}>
                    <input type="radio" name="fuente" value="otro" checked={formAbono.fuente === 'otro'} onChange={e => setFormAbono({...formAbono, fuente: e.target.value})} style={{ accentColor: '#ca8a04' }} />
                    <span style={{ fontSize: 13, fontWeight: 600 }}><Icons.Banknote size={14} /> Otra fuente</span>
                  </label>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button type="button" onClick={() => setMostrarAbono(false)} style={{ flex: 1, padding: '12px', border: '1px solid #e2e8f0', background: 'white', borderRadius: '8px', cursor: 'pointer' }}>Cancelar</button>
                <button type="submit" disabled={guardando} className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  {guardando ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Loader size={16} /> Guardando...</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.DollarSign size={16} /> Registrar Pago</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {reciboAbono && (
        <div style={{ display: 'none' }}>
          <AbonoRecibo ref={reciboRef} config={config} {...reciboAbono} />
        </div>
      )}
    </div>
  )
}
