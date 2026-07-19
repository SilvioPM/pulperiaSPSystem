'use client'
import { useState, useEffect, useRef } from 'react'
import { useReactToPrint } from 'react-to-print'
import Toast from '../components/Toast'
import AbonoRecibo from '../components/AbonoRecibo'
import { useToast } from '../hooks/useToast'
import * as Icons from 'lucide-react'

export default function CuentasCobrar() {
  const [facturas, setFacturas]       = useState([])
  const [facturaSeleccionada, setFacturaSeleccionada] = useState(null)
  const [mostrarAbono, setMostrarAbono] = useState(false)
  const [formAbono, setFormAbono]     = useState({ monto: '', nota: '' })
  const [guardando, setGuardando]     = useState(false)
  const [filtro, setFiltro]           = useState('pendientes')
  const [cargando, setCargando]       = useState(true)
  const [config, setConfig]           = useState({})
  const [reciboAbono, setReciboAbono] = useState(null)
  const { toast, mostrar, cerrar } = useToast()
  const reciboRef = useRef(null)
  const imprimirAbono = useReactToPrint({ contentRef: reciboRef, documentTitle: 'Abono' })

  useEffect(() => {
    cargarFacturas()
    fetch('/api/config').then(r => r.json()).then(setConfig).catch(() => {})
    .finally(() => setCargando(false))
  }, [])

  async function cargarFacturas() {
    try {
      const [resFacturas, resClientes] = await Promise.all([
        fetch('/api/facturas'),
        fetch('/api/clientes')
      ])
      const dataFacturas = await resFacturas.json()
      const dataClientes = await resClientes.json()
      const facturasArr = Array.isArray(dataFacturas) ? dataFacturas : (dataFacturas.data || [])
      const creditos = facturasArr.filter(f => f.esCredito && f.estado !== 'anulada')

      const clientesArr = Array.isArray(dataClientes) ? dataClientes : (dataClientes.data || [])
      const saldoInicialArr = clientesArr
        .filter(c => (c.saldoInicial || 0) > (c.saldoInicialPagado || 0))
        .map(c => ({
          id: `saldo-${c.id}`,
          tipo: 'saldo_inicial',
          cliente: c,
          numero: 'Saldo anterior',
          total: c.saldoInicial || 0,
          saldoPendiente: (c.saldoInicial || 0) - (c.saldoInicialPagado || 0),
          abonos: [],
          creadoEn: null,
          esCredito: true
        }))

      setFacturas([...creditos, ...saldoInicialArr])
    } catch {
      setFacturas([])
    }
  }

  async function registrarAbono(e) {
    e.preventDefault()
    if (!facturaSeleccionada) return
    setGuardando(true)
    try {
      const esSaldoInicial = facturaSeleccionada.tipo === 'saldo_inicial'
      const monto = parseFloat(formAbono.monto)
      const url = esSaldoInicial
        ? `/api/clientes/${facturaSeleccionada.cliente.id}/abonar-inicial`
        : '/api/abonos'
      const body = esSaldoInicial
        ? JSON.stringify({ monto, nota: formAbono.nota })
        : JSON.stringify({ facturaId: facturaSeleccionada.id, monto, nota: formAbono.nota })
      const res = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body })
      const data = await res.json()
      if (!res.ok) {
        mostrar(data.error, 'error')
      } else {
        const saldoPendiente = esSaldoInicial
          ? 0
          : data.nuevoSaldo
        setReciboAbono({
          tipo: 'cxc',
          numero: facturaSeleccionada.numero,
          entidad: facturaSeleccionada.cliente?.nombre || 'General',
          montoOriginal: facturaSeleccionada.total,
          abonoMonto: monto,
          saldoPendiente,
          nota: formAbono.nota
        })
        setMostrarAbono(false)
        setFormAbono({ monto: '', nota: '' })
        setFacturaSeleccionada(null)
        cargarFacturas()
        setTimeout(() => imprimirAbono(), 300)
      }
    } catch {
      mostrar('Error al registrar abono', 'error')
    }
    setGuardando(false)
  }

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  function diasDeudor(fecha) {
    const hoy  = new Date()
    const desd = new Date(fecha)
    return Math.floor((hoy - desd) / (1000 * 60 * 60 * 24))
  }

  const pendientes = facturas.filter(f => f.saldoPendiente > 0)
  const pagadas    = facturas.filter(f => f.saldoPendiente <= 0)
  const mostradas  = filtro === 'pendientes' ? pendientes : pagadas

  const totalPendiente = pendientes.reduce((sum, f) => sum + f.saldoPendiente, 0)
  const totalCreditos  = facturas.reduce((sum, f) => sum + f.total, 0)

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>

  return (
    <div>
      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}>
          <Icons.Wallet size={24} /> Cuentas por Cobrar
        </h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>
          Control de ventas al crédito y abonos
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total pendiente</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#dc2626' }}>
            C$ {totalPendiente.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{pendientes.length} clientes deben</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Créditos activos</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#f59e0b' }}>
            {pendientes.length}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>facturas sin saldar</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total en créditos</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#16a34a' }}>
            C$ {totalCreditos.toFixed(2)}
          </div>
          <div style={{ fontSize: '12px', color: '#94a3b8' }}>{facturas.length} ventas al crédito</div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { key: 'pendientes', label: `Pendientes (${pendientes.length})` },
          { key: 'pagadas',    label: `Saldadas (${pagadas.length})`      },
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

      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Factura', 'Cliente', 'Fecha', 'Vencimiento', 'Días', 'Total', 'Abonado', 'Pendiente', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {mostradas.length === 0 ? (
              <tr>
                <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                    <div style={{ marginBottom: '8px' }}>
                      {filtro === 'pendientes' ? <Icons.Star size={48} /> : <Icons.ClipboardList size={48} />}
                    </div>
                  {filtro === 'pendientes'
                    ? '¡No hay deudas pendientes!'
                    : 'No hay créditos saldados aún'}
                </td>
              </tr>
            ) : (
              mostradas.map((f, i) => {
                const abonado = f.abonos?.reduce((sum, a) => sum + a.monto, 0) || 0
                const refFecha = f.fechaVencimiento || f.creadoEn
                const dias    = refFecha ? diasDeudor(refFecha) : 0
                const urgente = dias > 30 && f.saldoPendiente > 0
                const esSaldoInicial = f.tipo === 'saldo_inicial'

                return (
                  <tr key={f.id} style={{
                    borderBottom: '1px solid #f1f5f9',
                    background: urgente ? '#fff5f5' : i % 2 === 0 ? 'white' : '#fafafa',
                    opacity: esSaldoInicial ? 0.85 : 1
                  }}>
                    <td style={{ padding: '12px 16px', fontWeight: 700, color: esSaldoInicial ? '#ca8a04' : '#2563eb', fontSize: '14px' }}>
                      {esSaldoInicial ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}><Icons.ClipboardList size={14} /> Saldo anterior</span> : f.numero}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>
                        {f.cliente?.nombre || 'Sin cliente'}
                      </div>
                      {f.cliente?.telefono && (
                        <div style={{ fontSize: '12px', color: '#64748b' }}>
                          <Icons.Phone size={14} /> {f.cliente.telefono}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                      {esSaldoInicial ? '—' : formatearFecha(f.creadoEn)}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: '13px', color: f.fechaVencimiento ? '#64748b' : '#94a3b8' }}>
                      {f.fechaVencimiento ? formatearFecha(f.fechaVencimiento) : esSaldoInicial ? '—' : '—'}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      {esSaldoInicial ? (
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>—</span>
                      ) : (
                      <span style={{
                        padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                        background: dias > 30 ? '#fee2e2' : dias > 15 ? '#fef9c3' : '#dcfce7',
                        color: dias > 30 ? '#dc2626' : dias > 15 ? '#ca8a04' : '#16a34a'
                      }}>
                        {dias} días
                      </span>
                      )}
                    </td>
                    <td style={{ padding: '12px 16px', fontWeight: 700 }}>
                      C$ {f.total.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px', color: '#16a34a', fontWeight: 600 }}>
                      C$ {abonado.toFixed(2)}
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <span style={{
                        fontWeight: 700, fontSize: '15px',
                        color: f.saldoPendiente > 0 ? '#dc2626' : '#16a34a'
                      }}>
                        C$ {f.saldoPendiente.toFixed(2)}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        {f.saldoPendiente > 0 && (
                          <button
                            onClick={() => { setFacturaSeleccionada(f); setMostrarAbono(true) }}
                            style={{
                              padding: '6px 12px', borderRadius: '6px', border: 'none',
                              background: '#16a34a', color: 'white',
                              cursor: 'pointer', fontSize: '13px', fontWeight: 600
                            }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.DollarSign size={16} /> Abonar</span>
                          </button>
                        )}
                        <button
                          onClick={() => setFacturaSeleccionada(f)}
                          style={{
                            padding: '6px 10px', borderRadius: '6px',
                            border: '1px solid #e2e8f0', background: 'white',
                            cursor: 'pointer', fontSize: '13px'
                          }}>
                          <Icons.Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {mostrarAbono && facturaSeleccionada && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '420px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.DollarSign size={16} /> Registrar Abono</span></h2>
              <button onClick={() => { setMostrarAbono(false); setFormAbono({ monto: '', nota: '' }) }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{
              background: '#f8fafc', borderRadius: '10px', padding: '16px', marginBottom: '20px'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Cliente</span>
                <span style={{ fontWeight: 700 }}>{facturaSeleccionada.cliente?.nombre}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>{facturaSeleccionada.tipo === 'saldo_inicial' ? 'Concepto' : 'Factura'}</span>
                <span style={{ fontWeight: 700, color: facturaSeleccionada.tipo === 'saldo_inicial' ? '#ca8a04' : '#2563eb' }}>{facturaSeleccionada.numero}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Total original</span>
                <span>C$ {facturaSeleccionada.total.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>Saldo pendiente</span>
                <span style={{ fontWeight: 700, color: '#dc2626', fontSize: '18px' }}>
                  C$ {facturaSeleccionada.saldoPendiente.toFixed(2)}
                </span>
              </div>
            </div>

            {facturaSeleccionada.abonos?.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Abonos anteriores:
                </div>
                {facturaSeleccionada.abonos.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px'
                  }}>
                    <span style={{ color: '#64748b' }}>
                      {new Date(a.creadoEn).toLocaleDateString('es-NI')}
                      {a.nota && ` — ${a.nota}`}
                    </span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>
                      C$ {a.monto.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={registrarAbono}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Monto del abono (C$) *
                </label>
                <input required type="number" step="0.01" min="0.01"
                  max={facturaSeleccionada.saldoPendiente}
                  value={formAbono.monto}
                  onChange={e => setFormAbono({...formAbono, monto: e.target.value})}
                  placeholder={`Máx: C$ ${facturaSeleccionada.saldoPendiente.toFixed(2)}`}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
                <button type="button"
                  onClick={() => setFormAbono({...formAbono, monto: facturaSeleccionada.saldoPendiente.toString()})}
                  style={{
                    marginTop: '8px', padding: '6px 12px', borderRadius: '6px',
                    border: '1px solid #16a34a', background: '#dcfce7',
                    color: '#16a34a', cursor: 'pointer', fontSize: '12px', fontWeight: 600
                  }}>
                  ✅ Pagar todo (C$ {facturaSeleccionada.saldoPendiente.toFixed(2)})
                </button>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Nota (opcional)
                </label>
                <input value={formAbono.nota}
                  onChange={e => setFormAbono({...formAbono, nota: e.target.value})}
                  placeholder="Ej: Pago parcial, pago en especie..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button"
                  onClick={() => { setMostrarAbono(false); setFormAbono({ monto: '', nota: '' }) }}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" disabled={guardando}
                  className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  {guardando ? <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.Loader size={16} /> Guardando...</span> : <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.DollarSign size={16} /> Registrar Abono</span>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {facturaSeleccionada && !mostrarAbono && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '480px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.ClipboardList size={16} /> {facturaSeleccionada.numero}</span>
              </h2>
              <button onClick={() => setFacturaSeleccionada(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '14px' }}>
              <strong>Cliente:</strong> {facturaSeleccionada.cliente?.nombre}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Producto', 'Cant', 'Precio', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {facturaSeleccionada.detalles?.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontSize: '13px' }}>{d.producto?.nombre}</td>
                    <td style={{ padding: '8px', fontSize: '13px' }}>{d.cantidad}</td>
                    <td style={{ padding: '8px', fontSize: '13px' }}>C$ {d.precio.toFixed(2)}</td>
                    <td style={{ padding: '8px', fontSize: '13px', fontWeight: 600 }}>C$ {d.subtotal.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {facturaSeleccionada.abonos?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 600, color: '#475569', marginBottom: '8px' }}>
                  Abonos registrados:
                </div>
                {facturaSeleccionada.abonos.map(a => (
                  <div key={a.id} style={{
                    display: 'flex', justifyContent: 'space-between',
                    padding: '6px 0', borderBottom: '1px solid #f1f5f9', fontSize: '13px'
                  }}>
                    <span style={{ color: '#64748b' }}>
                      {new Date(a.creadoEn).toLocaleDateString('es-NI')}
                      {a.nota && ` — ${a.nota}`}
                    </span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>
                      C$ {a.monto.toFixed(2)}
                    </span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontSize: '13px', fontWeight: 700, borderTop: '2px solid #e2e8f0', marginTop: '4px' }}>
                  <span>Total abonado</span>
                  <span style={{ color: '#16a34a' }}>C$ {facturaSeleccionada.abonos.reduce((s, a) => s + a.monto, 0).toFixed(2)}</span>
                </div>
              </div>
            )}

            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: '#dc2626' }}>
                <span>Saldo pendiente</span>
                <span>C$ {facturaSeleccionada.saldoPendiente.toFixed(2)}</span>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px' }}>
              {facturaSeleccionada.saldoPendiente > 0 && (
                <button
                  onClick={() => setMostrarAbono(true)}
                  className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><Icons.DollarSign size={16} /> Registrar Abono</span>
                </button>
              )}
              <button onClick={() => setFacturaSeleccionada(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Cerrar
              </button>
            </div>
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
