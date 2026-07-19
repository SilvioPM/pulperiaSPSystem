'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import TarjetaAcceso from '@/app/components/dashboard/TarjetaAcceso'
import TarjetaKPI from '@/app/components/dashboard/TarjetaKPI'
import GraficoFlujoCaja from '@/app/components/dashboard/GraficoFlujoCaja'
import PieMetodosPago from '@/app/components/dashboard/PieMetodosPago'
import PieCxcCxp from '@/app/components/dashboard/PieCxcCxp'
import PanelOnboarding from '@/app/components/dashboard/PanelOnboarding'
import PanelTareasPendientes from '@/app/components/dashboard/PanelTareasPendientes'
import ListaProductos from '@/app/components/dashboard/ListaProductos'
import * as Icons from 'lucide-react'

const accesos = [
  { href: '/pos', label: 'POS', desc: 'Nueva venta', icon: 'ShoppingCart', gradient: 'linear-gradient(135deg, #16a34a, #15803d)', shadow: 'rgba(22,163,74,0.3)' },
  { href: '/facturas', label: 'Facturas', desc: 'Historial de ventas', icon: 'FileText', gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)', shadow: 'rgba(37,99,235,0.3)' },
  { href: '/compras', label: 'Compras', desc: 'Gestión de compras', icon: 'Package', gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', shadow: 'rgba(124,58,237,0.3)' },
  { href: '/inventario', label: 'Inventario', desc: 'Stock y kardex', icon: 'Archive', gradient: 'linear-gradient(135deg, #0891b2, #0e7490)', shadow: 'rgba(8,145,178,0.3)' },
  { href: '/cuentas-cobrar', label: 'CxC', desc: 'Cuentas por cobrar', icon: 'DollarSign', gradient: 'linear-gradient(135deg, #d97706, #b45309)', shadow: 'rgba(217,119,6,0.3)' },
  { href: '/caja', label: 'Caja', desc: 'Abrir / cerrar turno', icon: 'Wallet', gradient: 'linear-gradient(135deg, #64748b, #475569)', shadow: 'rgba(100,116,139,0.3)' },
]

const kpis = [
  { key: 'efectivoCaja', label: 'Efectivo en caja', icon: 'Banknote', color: '#0d9488', bg: 'linear-gradient(135deg, #ccfbf1, #a7f3d0)', formato: 'money' },
  { key: 'ventasMes', label: 'Ventas del mes', icon: 'TrendingUp', color: '#16a34a', bg: 'linear-gradient(135deg, #dcfce7, #bbf7d0)', formato: 'money' },
  { key: 'comprasMes', label: 'Compras del mes', icon: 'TrendingDown', color: '#7c3aed', bg: 'linear-gradient(135deg, #f3e8ff, #e9d5ff)', formato: 'money' },
  { key: 'totalCXC', label: 'Saldo por cobrar', icon: 'Clock', color: '#d97706', bg: 'linear-gradient(135deg, #fef3c7, #fde68a)', formato: 'money' },
]

function primerDiaMes() {
  const d = new Date()
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10)
}

export default function Inicio() {
  const { user } = useAuth()
  const [datos, setDatos] = useState({ config: null, stats: null, cargando: true })

  useEffect(() => {
    if (user && !user.esAdmin) window.location.replace('/pos')
  }, [user])

  useEffect(() => {
    async function cargar() {
      try {
        const hoy = new Date()
        const hoyStr = hoy.toISOString().slice(0, 10)
        const desdeMes = primerDiaMes()
        const desde30 = new Date(hoy); desde30.setDate(desde30.getDate() - 30); const desde30Str = desde30.toISOString().slice(0, 10)
        const desde12m = new Date(hoy); desde12m.setMonth(desde12m.getMonth() - 12); const desde12mStr = desde12m.toISOString().slice(0, 10)

        const [resConfig, resFactMes, resReportes, resCompras, resProds, resClientes, resCaja, resGanancias, resVencer] = await Promise.all([
          fetch('/api/config'),
          fetch(`/api/facturas?desde=${desdeMes}&hasta=${hoyStr}&limit=9999`),
          fetch(`/api/reportes?desde=${desde30Str}&hasta=${hoyStr}`),
          fetch(`/api/compras?desde=${desdeMes}&hasta=${hoyStr}&limit=100`),
          fetch('/api/productos?limit=1'),
          fetch('/api/clientes?limit=1'),
          fetch('/api/caja'),
          fetch(`/api/reportes?tipo=ganancias&desde=${desde12mStr}&hasta=${hoyStr}`),
          fetch('/api/productos?vencer=30&limit=100'),
        ])

        const cfg = await resConfig.json()
        const facturasMes = (await resFactMes.json()).data || []
        const r = await resReportes.json()
        const comprasData = await resCompras.json()
        const prodsRes = await resProds.json()
        const clientesRes = await resClientes.json()
        const caja = await resCaja.json()
        const ganancias = await resGanancias.json()
        const prodsVencer = (await resVencer.json()).data || []

        // Derived stats
        const ventasMes = facturasMes.reduce((s, f) => s + (f.total || 0), 0)
        const ventasHoy = facturasMes.filter(f => f.creadoEn?.slice(0, 10) === hoyStr).reduce((s, f) => s + (f.total || 0), 0)
        const ayerStr = new Date(hoy); ayerStr.setDate(ayerStr.getDate() - 1); const ayerStr2 = ayerStr.toISOString().slice(0, 10)
        const ventasAyer = facturasMes.filter(f => f.creadoEn?.slice(0, 10) === ayerStr2).reduce((s, f) => s + (f.total || 0), 0)
        const pctCambio = ventasAyer > 0 ? ((ventasHoy - ventasAyer) / ventasAyer * 100) : 0

        const comprasMes = (comprasData.data || []).reduce((s, c) => s + (c.total || 0), 0)
        const totalProds = prodsRes.total || 0
        const totalClientes = clientesRes.total || 0
        const cajaHistorico = caja.historial || []
        const sinCaja = !caja.actual && cajaHistorico.length === 0

        const efectivoCaja = caja.actual?.estado === 'abierta'
          ? (caja.actual.montoInicial || 0) + (caja.actual.ventasEfectivoCs || 0) + (caja.actual.ingresosExtra || 0) - (caja.actual.egresos || 0)
          : 0

        // Ganancia del mes actual from ganancias data
        const mesActual = ganancias.porMes?.find(m => m.periodo === hoyStr.slice(0, 7))
        const gananciaMesActual = mesActual ? (mesActual.ventas - mesActual.costo - mesActual.gastos) : 0

        setDatos({
          config: cfg,
          stats: {
            ventasHoy, ventasMes, comprasMes, pctCambio,
            efectivoCaja, totalCXC: r.resumen?.totalCXC || 0, totalCXP: r.resumen?.totalCXP || 0,
            gananciasPorMes: ganancias.porMes || [],
            gananciaMesActual,
            topProductos: r.topProductos || [],
            metodosPago: r.metodosPago || [],
            stockBajo: r.stockBajo || [],
            cxc: r.cxc || [],
            prodsPorVencer: prodsVencer,
            cajaAbierta: caja.actual?.estado === 'abierta',
            sinProductos: totalProds === 0,
            sinClientes: totalClientes === 0,
            sinCaja,
          },
          cargando: false,
        })
      } catch { setDatos(p => ({ ...p, cargando: false })) }
    }
    cargar()
  }, [])

  const { config, stats, cargando } = datos
  const negocio = config?.nombre || 'SP System'
  const logo = config?.logo || ''

  const accesosConIconos = accesos.map(a => ({ ...a, icon: Icons[a.icon] }))
  const ic = (name) => Icons[name]

  return (
    <div style={{ width: '100%' }}>
      {/* ── Skeleton loading ── */}
      {cargando ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} style={{ height: 80, borderRadius: 14, background: 'linear-gradient(90deg, #e2e8f0 25%, #f1f5f9 50%, #e2e8f0 75%)', backgroundSize: '200% 100%', animation: 'skeleton 1.5s infinite' }} />
          ))}
        </div>
      ) : (
        <>
          {/* ── Top bar: logo + saludo ── */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              {logo && <img src={logo} alt="" style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'contain' }} />}
              <div>
                <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--texto)' }}>Hola, {user?.nombre || 'Usuario'}</div>
                <div style={{ fontSize: 13, color: 'var(--texto-secundario)' }}>{negocio} &middot; {new Date().toLocaleDateString('es-NI', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
            </div>
          </div>

          {/* ── FILA 1: Accesos rápidos ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 24 }}>
            {accesosConIconos.map(a => (
              <TarjetaAcceso key={a.href} {...a} />
            ))}
          </div>

          {/* ── FILA 2: KPIs numéricos ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 14, marginBottom: 24 }}>
            {kpis.map(k => (
              <TarjetaKPI key={k.key} label={k.label} valor={stats[k.key]} icon={ic(k.icon)} color={k.color} bg={k.bg} formato={k.formato} />
            ))}
          </div>

          {/* ── FILA 3: Chart (70%) + Pie Métodos Pago (30%) ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: '7fr 5fr', gap: 16, marginBottom: 24,
            minHeight: 320,
          }}>
            <GraficoFlujoCaja data={stats.gananciasPorMes} gananciaMesActual={stats.gananciaMesActual} />
            <PieMetodosPago data={stats.metodosPago} />
          </div>

          {/* ── FILA 4: Tareas pendientes (65%) + Pie CxC/CxP (35%) ── */}
          <div style={{
            display: 'grid', gridTemplateColumns: stats.sinProductos || stats.sinClientes || stats.sinCaja ? '7fr 5fr' : '7fr 5fr',
            gap: 16, marginBottom: 24, minHeight: 280,
          }}>
            {stats.sinProductos || stats.sinClientes || stats.sinCaja ? (
              <PanelOnboarding sinProductos={stats.sinProductos} sinClientes={stats.sinClientes} sinCaja={stats.sinCaja} />
            ) : (
              <PanelTareasPendientes
                stockBajo={stats.stockBajo}
                cxc={stats.cxc}
                prodsPorVencer={stats.prodsPorVencer}
                cajaAbierta={stats.cajaAbierta}
              />
            )}
            <PieCxcCxp totalCXC={stats.totalCXC} totalCXP={stats.totalCXP} />
          </div>

          {/* ── FILA 5: Productos (4 columnas) ── */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 14, marginBottom: 24 }}>
            <ListaProductos titulo="Más vendidos" icon={ic('Award')} color="#16a34a" gradient="linear-gradient(90deg, #dcfce7, #bbf7d0)"
              data={stats.topProductos} dataKey="cantidad" />
            <ListaProductos titulo="Menos consumo" icon={ic('TrendingDown')} color="#be185d" gradient="linear-gradient(90deg, #fce7f3, #fbcfe8)"
              data={[...(stats.topProductos || [])].sort((a, b) => a.cantidad - b.cantidad)} dataKey="cantidad" />
            <ListaProductos titulo="Más rentables" icon={ic('DollarSign')} color="#d97706" gradient="linear-gradient(90deg, #fef3c7, #fde68a)"
              data={[...(stats.topProductos || [])].sort((a, b) => b.ganancia - a.ganancia)} dataKey="ganancia" format="money" />
            <ListaProductos titulo="Menos ganancia" icon={ic('TrendingDown')} color="#991b1b" gradient="linear-gradient(90deg, #fef2f2, #fee2e2)"
              data={[...(stats.topProductos || [])].sort((a, b) => a.ganancia - b.ganancia)} dataKey="ganancia" format="money" />
          </div>
        </>
      )}

      <style>{`@keyframes skeleton { 0%{background-position:200% 0} 100%{background-position:-200% 0} }`}</style>
    </div>
  )
}
