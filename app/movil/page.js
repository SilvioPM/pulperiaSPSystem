'use client'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'
import * as Icons from 'lucide-react'
import { ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const TABS = [
  { id: 'hoy', label: 'Hoy', icono: 'Home' },
  { id: 'graficas', label: 'Gráficas', icono: 'BarChart3' },
  { id: 'gastos', label: 'Gastos', icono: 'Wallet' },
  { id: 'clientes', label: 'Clientes', icono: 'Users' },
  { id: 'stock', label: 'Stock', icono: 'Package' },
]

const fmt = n => (n || 0).toLocaleString('es-NI', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const fmtCorto = iso => { try { return new Date(iso).toLocaleDateString('es-NI', { day: '2-digit', month: '2-digit' }) } catch { return '' } }
const etiquetaMes = p => p.length >= 7 ? p.slice(5) + '/' + p.slice(2, 4) : p

function fechaLocal(offsetDias) {
  const d = new Date(Date.now() - 6 * 3600 * 1000 - offsetDias * 86400000)
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
}

const CARD = { background: '#fff', borderRadius: 14, border: '1px solid #e2e8f0', padding: 14, boxShadow: '0 1px 3px rgba(15,23,42,0.06)' }
const TITULO = { fontSize: 13, fontWeight: 700, color: '#1e293b', margin: '18px 2px 10px', display: 'flex', alignItems: 'center', gap: 6 }

export default function MovilPage() {
  const router = useRouter()
  const { user, logout } = useAuth()
  const [tab, setTab] = useState('hoy')
  const [hoy, setHoy] = useState(null)
  const [resumen, setResumen] = useState(null)
  const [ganancias, setGanancias] = useState(null)
  const [abonos, setAbonos] = useState(null)
  const [morosos, setMorosos] = useState(null)
  const [gastos, setGastos] = useState([])
  const [compras, setCompras] = useState([])
  const [cargando, setCargando] = useState(true)
  const [sinConexion, setSinConexion] = useState(false)
  const [ultima, setUltima] = useState(null)
  const [vistaGraf, setVistaGraf] = useState('7d')
  const [installPrompt, setInstallPrompt] = useState(null)
  const [mostrarInstrucciones, setMostrarInstrucciones] = useState(false)
  const [esStandalone, setEsStandalone] = useState(false)

  useEffect(() => {
    function onPrompt(e) {
      e.preventDefault()
      setInstallPrompt(e)
    }
    window.addEventListener('beforeinstallprompt', onPrompt)
    setEsStandalone(window.matchMedia('(display-mode: standalone)').matches)
    return () => window.removeEventListener('beforeinstallprompt', onPrompt)
  }, [])

  async function instalarApp() {
    if (installPrompt) {
      installPrompt.prompt()
      try {
        const { outcome } = await installPrompt.userChoice
        if (outcome === 'accepted') setInstallPrompt(null)
      } catch {}
    } else {
      setMostrarInstrucciones(true)
    }
  }

  async function refrescar() {
    const desde = fechaLocal(29)
    const hasta = fechaLocal(0)
    const urls = [
      ['hoy', '/api/reportes?tipo=hoy'],
      ['resumen', '/api/reportes'],
      ['ganancias', `/api/reportes?tipo=ganancias&desde=${desde}&hasta=${hasta}`],
      ['abonos', `/api/reportes?tipo=abonos&desde=${desde}&hasta=${hasta}`],
      ['morosos', '/api/reportes?tipo=morosos'],
      ['gastos', `/api/gastos?desde=${desde}&hasta=${hasta}&limit=10000`],
      ['compras', `/api/compras?desde=${desde}&hasta=${hasta}&limit=10000`],
    ]
    const resultados = await Promise.all(urls.map(async ([key, url]) => {
      try { const r = await fetch(url); return [key, r.ok ? await r.json() : null] } catch { return [key, null] }
    }))
    const d = Object.fromEntries(resultados)
    const ok = Object.values(d).some(v => v)
    setSinConexion(!ok)
    setHoy(d.hoy)
    setResumen(d.resumen)
    setGanancias(d.ganancias)
    setAbonos(d.abonos)
    setMorosos(d.morosos)
    setGastos(d.gastos?.data || [])
    setCompras(d.compras?.data || [])
    setUltima(new Date())
    setCargando(false)
  }

  useEffect(() => { refrescar(); const t = setInterval(refrescar, 60000); return () => clearInterval(t) }, [])

  async function salir() {
    if (!confirm('¿Cerrar sesión?')) return
    await logout()
    router.push('/login')
  }

  const caja = hoy?.caja
  const metodosHoy = hoy?.hoy ? [
    { label: 'Efectivo C$', val: hoy.hoy.efectivoCs, color: '#16a34a' },
    { label: 'Efectivo USD', val: hoy.hoy.efectivoUs, color: '#2563eb' },
    { label: 'Tarjeta', val: hoy.hoy.tarjeta, color: '#7c3aed' },
    { label: 'Transferencia', val: hoy.hoy.transfer, color: '#db2777' },
  ] : []
  const maxMetodo = Math.max(...metodosHoy.map(m => m.val), 1)

  return (
    <div style={{ minHeight: '100vh', background: '#f1f5f9', maxWidth: 520, margin: '0 auto' }}>
      {/* Header */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 20, background: '#1e293b', color: 'white',
        padding: '12px 16px', paddingTop: 'calc(12px + env(safe-area-inset-top))',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between'
      }}>
        <div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.5px' }}>SP<span style={{ color: '#16a34a' }}>System</span></div>
          <div style={{ fontSize: 11, color: '#94a3b8', textTransform: 'capitalize' }}>
            {new Date().toLocaleDateString('es-NI', { weekday: 'long', day: 'numeric', month: 'long' })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {!esStandalone && (
            <button onClick={instalarApp} style={{ background: '#16a34a', border: 'none', color: '#fff', cursor: 'pointer', padding: '8px 12px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }} title="Descargar app">
              <Icons.Download size={16} /> Descargar
            </button>
          )}
          <button onClick={refrescar} style={{ background: 'none', border: 'none', color: '#e2e8f0', cursor: 'pointer', padding: 8 }} title="Actualizar">
            <Icons.RefreshCw size={19} />
          </button>
          <button onClick={salir} style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', padding: 8 }} title="Cerrar sesión">
            <Icons.LogOut size={19} />
          </button>
        </div>
      </div>

      {/* Contenido */}
      <div style={{ padding: '14px 14px 110px' }}>
        {cargando ? (
          <div style={{ textAlign: 'center', padding: 60, color: '#64748b', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Icons.Loader size={18} /> Cargando...
          </div>
        ) : (
          <>
            {sinConexion && (
              <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: 10, padding: '10px 14px', fontSize: 13, marginBottom: 12 }}>
                Sin conexión con el servidor. Revisá que la PC esté encendida y en la misma red WiFi.
              </div>
            )}

            {tab === 'hoy' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ ...CARD, borderLeft: '4px solid #16a34a' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Ventas hoy</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#16a34a' }}>C$ {fmt(hoy?.hoy?.ventas)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{hoy?.hoy?.numFacturas || 0} facturas</div>
                  </div>
                  <div style={{ ...CARD, borderLeft: '4px solid #2563eb' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Ganancia hoy</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#2563eb' }}>C$ {fmt(hoy?.hoy?.ganancia)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Ticket: C$ {fmt(hoy?.hoy?.ticketPromedio)}</div>
                  </div>
                  <div style={{ ...CARD, borderLeft: '4px solid #7c3aed' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Neto (gan - gastos)</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: (hoy?.hoy?.neto || 0) >= 0 ? '#7c3aed' : '#dc2626' }}>C$ {fmt(hoy?.hoy?.neto)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Gastos: C$ {fmt(hoy?.hoy?.gastos)}</div>
                  </div>
                  <div style={{ ...CARD, borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Abonos recibidos</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>C$ {fmt(hoy?.hoy?.abonos)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>Pagado a proveedores: C$ {fmt(hoy?.hoy?.abonosProveedores)}</div>
                  </div>
                </div>

                <div style={{ ...CARD, marginTop: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: '#475569' }}>Comparado con ayer</span>
                  {(hoy?.comparacion || 0) >= 0 ? (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: '#16a34a' }}>
                      <Icons.TrendingUp size={16} /> +{hoy?.comparacion || 0}%
                    </span>
                  ) : (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 14, fontWeight: 700, color: '#dc2626' }}>
                      <Icons.TrendingDown size={16} /> {hoy?.comparacion}%
                    </span>
                  )}
                </div>

                <div style={TITULO}><Icons.DollarSign size={15} /> Métodos de pago (hoy)</div>
                <div style={CARD}>
                  {metodosHoy.map(m => (
                    <div key={m.label} style={{ marginBottom: 8 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 3 }}>
                        <span style={{ color: '#475569' }}>{m.label}</span>
                        <span style={{ fontWeight: 700, color: m.color }}>C$ {fmt(m.val)}</span>
                      </div>
                      <div style={{ background: '#f1f5f9', borderRadius: 6, height: 8 }}>
                        <div style={{ width: `${(m.val / maxMetodo) * 100}%`, background: m.color, height: 8, borderRadius: 6 }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div style={TITULO}><Icons.DollarSign size={15} /> Caja</div>
                <div style={CARD}>
                  {caja ? (
                    <>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                        <Icons.Circle size={12} fill="#dc2626" color="#dc2626" />
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#1e293b' }}>Caja abierta</span>
                        <span style={{ fontSize: 12, color: '#94a3b8' }}>desde {fmtCorto(caja.abiertaEn)}</span>
                      </div>
                      {[
                        { label: 'Ingresado a caja (ventas + abonos)', val: `C$ ${fmt(caja.totalVendido)}` },
                        { label: 'Abonos de clientes', val: `C$ ${fmt(caja.abonosTotal)}` },
                        { label: 'Ventas efectivo USD', val: `$ ${fmt(caja.ventasEfectivoUs)}` },
                        { label: 'Ingresos extra', val: `C$ ${fmt(caja.ingresosExtra)}` },
                        { label: 'Egresos', val: `C$ ${fmt(caja.egresos)}` },
                      ].map(f => (
                        <div key={f.label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                          <span style={{ color: '#475569' }}>{f.label}</span>
                          <span style={{ fontWeight: 600, color: '#1e293b' }}>{f.val}</span>
                        </div>
                      ))}
                    </>
                  ) : (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <Icons.Circle size={12} fill="#16a34a" color="#16a34a" />
                      <span style={{ fontSize: 14, fontWeight: 700, color: '#166534' }}>Caja cerrada</span>
                      <span style={{ fontSize: 12, color: '#94a3b8' }}>— no hay caja abierta ahora</span>
                    </div>
                  )}
                </div>

                {(resumen?.topProductos?.length > 0) && (
                  <>
                    <div style={TITULO}><Icons.TrendingUp size={15} /> Top productos (30 días)</div>
                    <div style={CARD}>
                      {resumen.topProductos.slice(0, 5).map((p, i) => (
                        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '6px 0', borderBottom: i < 4 ? '1px solid #f1f5f9' : 'none' }}>
                          <span style={{ color: '#475569' }}>{i + 1}. {p.nombre}</span>
                          <span style={{ fontWeight: 700, color: '#16a34a' }}>C$ {fmt(p.ventas)}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}

            {tab === 'graficas' && (
              <div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 12 }}>
                  {[['7d', '7 días'], ['30d', '30 días'], ['mes', 'Por mes']].map(([key, label]) => (
                    <button key={key} onClick={() => setVistaGraf(key)}
                      style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid #e2e8f0', cursor: 'pointer', fontSize: 13, fontWeight: 600, background: vistaGraf === key ? '#16a34a' : '#fff', color: vistaGraf === key ? '#fff' : '#64748b' }}>
                      {label}
                    </button>
                  ))}
                </div>

                {(() => {
                  let series = []
                  if (vistaGraf === 'mes') series = (ganancias?.porMes || []).map(s => ({ ...s, etiqueta: etiquetaMes(s.periodo) }))
                  else {
                    const porDia = (ganancias?.porDia || []).slice(-30)
                    series = vistaGraf === '7d' ? porDia.slice(-7) : porDia
                    series = series.map(s => ({ ...s, etiqueta: fmtCorto(s.periodo) }))
                  }
                  return (
                    <div style={CARD}>
                      <div style={{ fontSize: 12, color: '#64748b', marginBottom: 8 }}>
                        Ventas (verde) · Ganancia (azul) · Gastos (naranja)
                      </div>
                      {series.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: 40, color: '#94a3b8', fontSize: 13 }}>Sin datos para este período</div>
                      ) : (
                        <ResponsiveContainer width="100%" height={260}>
                          <ComposedChart data={series} margin={{ top: 5, right: 5, bottom: 0, left: -15 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                            <XAxis dataKey="etiqueta" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} />
                            <YAxis tick={{ fontSize: 10, fill: '#94a3b8' }} tickLine={false} />
                            <Tooltip formatter={(v) => `C$ ${fmt(v)}`} labelStyle={{ fontSize: 12 }} />
                            <Bar dataKey="ventas" fill="#16a34a" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="gastos" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                            <Line type="monotone" dataKey="ganancia" stroke="#2563eb" strokeWidth={2} dot={{ r: 2 }} />
                          </ComposedChart>
                        </ResponsiveContainer>
                      )}
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 10, fontSize: 12, textAlign: 'center' }}>
                        <div style={{ background: '#f0fdf4', borderRadius: 8, padding: 8 }}>
                          <div style={{ color: '#64748b' }}>Ventas</div>
                          <div style={{ fontWeight: 800, color: '#16a34a' }}>C$ {fmt(series.reduce((s, x) => s + (x.ventas || 0), 0))}</div>
                        </div>
                        <div style={{ background: '#eff6ff', borderRadius: 8, padding: 8 }}>
                          <div style={{ color: '#64748b' }}>Ganancia</div>
                          <div style={{ fontWeight: 800, color: '#2563eb' }}>C$ {fmt(series.reduce((s, x) => s + (x.ganancia || 0), 0))}</div>
                        </div>
                        <div style={{ background: '#fffbeb', borderRadius: 8, padding: 8 }}>
                          <div style={{ color: '#64748b' }}>Gastos</div>
                          <div style={{ fontWeight: 800, color: '#d97706' }}>C$ {fmt(series.reduce((s, x) => s + (x.gastos || 0), 0))}</div>
                        </div>
                      </div>
                    </div>
                  )
                })()}

                <div style={{ ...CARD, marginTop: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>Últimos 7 días</span>
                  </div>
                  {(ganancias?.porDia || []).slice(-7).map(s => (
                    <div key={s.periodo} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '5px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <span style={{ color: '#475569' }}>{fmtCorto(s.periodo)}</span>
                      <span style={{ fontWeight: 600, color: s.ganancia >= 0 ? '#16a34a' : '#dc2626' }}>C$ {fmt(s.ganancia)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'gastos' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ ...CARD, borderLeft: '4px solid #dc2626' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Gastos (30 días)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>C$ {fmt(gastos.reduce((s, g) => s + g.monto, 0))}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{gastos.length} registros</div>
                  </div>
                  <div style={{ ...CARD, borderLeft: '4px solid #d97706' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Compras (30 días)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#d97706' }}>C$ {fmt(compras.reduce((s, c) => s + (c.total || 0), 0))}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{compras.filter(c => c.estado !== 'anulada').length} compras</div>
                  </div>
                </div>

                <div style={TITULO}><Icons.Wallet size={15} /> Últimos gastos</div>
                <div style={CARD}>
                  {gastos.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>Sin gastos registrados</div>
                  ) : gastos.slice(0, 15).map(g => (
                    <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{g.concepto}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>
                          <span style={{ background: '#f1f5f9', padding: '1px 6px', borderRadius: 4, marginRight: 6 }}>{g.categoria}</span>
                          {fmtCorto(g.fecha)}
                        </div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>C$ {fmt(g.monto)}</span>
                    </div>
                  ))}
                </div>

                <div style={TITULO}><Icons.Package size={15} /> Últimas compras</div>
                <div style={CARD}>
                  {compras.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>Sin compras en el período</div>
                  ) : compras.slice(0, 10).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.proveedor?.nombre || 'Proveedor'}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{c.numero} · {fmtCorto(c.creadoEn)} {c.estado === 'anulada' ? '· Anulada' : ''}</div>
                      </div>
                      <span style={{ fontWeight: 700, color: '#d97706' }}>C$ {fmt(c.total)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'clientes' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ ...CARD, borderLeft: '4px solid #dc2626' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Por cobrar (deuda)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#dc2626' }}>C$ {fmt(morosos?.total)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{morosos?.cantidad || 0} clientes deben</div>
                  </div>
                  <div style={{ ...CARD, borderLeft: '4px solid #16a34a' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Abonos recibidos (30 d)</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: '#16a34a' }}>C$ {fmt(abonos?.resumen?.clientes)}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>{abonos?.items?.length || 0} abonos</div>
                  </div>
                </div>

                <div style={TITULO}><Icons.AlertTriangle size={15} /> Clientes morosos</div>
                <div style={CARD}>
                  {!morosos?.clientes?.length ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>¡Nadie debe!</div>
                  ) : morosos.clientes.slice(0, 15).map(c => (
                    <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{c.cliente}</div>
                        <span style={{
                          fontSize: 11, padding: '1px 6px', borderRadius: 4, fontWeight: 600,
                          background: c.diasDeuda > 60 ? '#fee2e2' : c.diasDeuda > 30 ? '#fef3c7' : '#dcfce7',
                          color: c.diasDeuda > 60 ? '#dc2626' : c.diasDeuda > 30 ? '#d97706' : '#16a34a'
                        }}>{c.diasDeuda} días</span>
                      </div>
                      <span style={{ fontWeight: 700, color: '#dc2626' }}>C$ {fmt(c.saldoPendiente)}</span>
                    </div>
                  ))}
                </div>

                <div style={TITULO}><Icons.HandCoins size={15} /> Últimos abonos</div>
                <div style={CARD}>
                  {!abonos?.items?.length ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>Sin abonos en los últimos 30 días</div>
                  ) : abonos.items.slice(-15).reverse().map(it => (
                    <div key={it.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{it.nombre}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{it.documento} · {fmtCorto(it.fecha)}</div>
                      </div>
                      <span style={{ fontWeight: 700, color: it.tipo === 'Cliente' ? '#16a34a' : '#d97706' }}>C$ {fmt(it.monto)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === 'stock' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  <div style={{ ...CARD, borderLeft: '4px solid #dc2626' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Agotados</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#dc2626' }}>{resumen?.agotados?.length || 0}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>productos sin stock</div>
                  </div>
                  <div style={{ ...CARD, borderLeft: '4px solid #f59e0b' }}>
                    <div style={{ fontSize: 12, color: '#64748b' }}>Stock bajo</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: '#d97706' }}>{resumen?.stockBajo?.length || 0}</div>
                    <div style={{ fontSize: 11, color: '#94a3b8' }}>por debajo del mínimo</div>
                  </div>
                </div>

                <div style={TITULO}><Icons.XCircle size={15} /> Agotados</div>
                <div style={CARD}>
                  {!resumen?.agotados?.length ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>Sin productos agotados</div>
                  ) : resumen.agotados.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.nombre}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.categoria}</div>
                      </div>
                      <span style={{ background: '#fee2e2', color: '#dc2626', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>0 en stock</span>
                    </div>
                  ))}
                </div>

                <div style={TITULO}><Icons.AlertTriangle size={15} /> Stock bajo</div>
                <div style={CARD}>
                  {!resumen?.stockBajo?.length ? (
                    <div style={{ textAlign: 'center', padding: 24, color: '#94a3b8', fontSize: 13 }}>Todo el inventario está bien</div>
                  ) : resumen.stockBajo.map(p => (
                    <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 13, padding: '7px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div>
                        <div style={{ fontWeight: 600, color: '#1e293b' }}>{p.nombre}</div>
                        <div style={{ fontSize: 11, color: '#94a3b8' }}>{p.categoria}</div>
                      </div>
                      <span style={{ background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 6, fontWeight: 700, fontSize: 12 }}>
                        {p.stock} / mín {p.stockMinimo}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {ultima && (
              <div style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16 }}>
                Última actualización: {ultima.toLocaleTimeString('es-NI')} · se actualiza solo cada minuto
              </div>
            )}
          </>
        )}
      </div>

      {/* Navegación inferior */}
      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 30,
        background: '#1e293b', borderTop: '1px solid #334155',
        paddingBottom: 'env(safe-area-inset-bottom)', maxWidth: 520, margin: '0 auto',
        display: 'flex'
      }}>
        {TABS.map(t => {
          const activo = tab === t.id
          const IconComp = Icons[t.icono]
          return (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              padding: '9px 2px', background: 'none', border: 'none', cursor: 'pointer',
              color: activo ? '#16a34a' : '#94a3b8',
              borderTop: activo ? '2px solid #16a34a' : '2px solid transparent',
              fontSize: 10, fontWeight: activo ? 700 : 400, gap: 2
            }}>
              {IconComp && <IconComp size={21} />}
              {t.label}
            </button>
          )
        })}
      </nav>

      {/* Modal de instrucciones de instalación */}
      {mostrarInstrucciones && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15,23,42,0.55)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: 20
        }} onClick={() => setMostrarInstrucciones(false)}>
          <div onClick={e => e.stopPropagation()} style={{
            background: '#fff', borderRadius: 14, width: '100%', maxWidth: 420,
            padding: 20, maxHeight: '90vh', overflowY: 'auto'
          }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', marginBottom: 12 }}>Instalar la app</div>
            <div style={{ fontSize: 13, color: '#475569', marginBottom: 12, background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 8, padding: 10, wordBreak: 'break-all' }}>
              Dirección: <b>{typeof window !== 'undefined' ? window.location.origin : ''}/movil</b>
            </div>
            <div style={{ fontSize: 13, color: '#475569', lineHeight: 1.6 }}>
              <b style={{ color: '#1e293b' }}>En Android (Chrome):</b>
              <ol style={{ margin: '6px 0 14px', paddingLeft: 20 }}>
                <li>Entrá a la dirección de arriba e iniciá sesión.</li>
                <li>Tocá los tres puntos ⋮ (arriba a la derecha).</li>
                <li>Elegí «Instalar aplicación» o «Agregar a pantalla de inicio».</li>
                <li>Confirmá y el ícono quedará en tu pantalla de inicio.</li>
              </ol>
              <b style={{ color: '#1e293b' }}>En iPhone (Safari):</b>
              <ol style={{ margin: '6px 0 14px', paddingLeft: 20 }}>
                <li>Entrá a la dirección de arriba e iniciá sesión.</li>
                <li>Tocá el botón Compartir (la flecha hacia arriba, abajo).</li>
                <li>Elegí «Agregar a pantalla de inicio».</li>
              </ol>
              <div style={{ background: '#fef9c3', border: '1px solid #fde68a', borderRadius: 8, padding: 10, fontSize: 12.5, color: '#92400e' }}>
                Si ya tenés la app vieja instalada (la que abre el sistema completo del POS), eliminála del teléfono e
                instalá de nuevo desde <b>/movil</b> para que abra solo la vista de reportes.
              </div>
            </div>
            <button onClick={() => setMostrarInstrucciones(false)} style={{
              marginTop: 16, width: '100%', padding: 12, background: '#16a34a', color: '#fff',
              border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: 'pointer'
            }}>Entendido</button>
          </div>
        </div>
      )}
    </div>
  )
}
