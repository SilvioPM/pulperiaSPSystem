import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

function parseFechas(searchParams) {
  let desde = searchParams.get('desde')
  let hasta = searchParams.get('hasta')
  if (!desde || !hasta) {
    const hoy = new Date()
    if (!hasta) hasta = hoy.toISOString().split('T')[0]
    if (!desde) {
      const treinta = new Date(hoy)
      treinta.setDate(treinta.getDate() - 30)
      desde = treinta.toISOString().split('T')[0]
    }
  }
  return { desde, hasta, where: { estado: { not: 'anulada' }, creadoEn: { gte: new Date(desde), lte: new Date(hasta + 'T23:59:59.999Z') } } }
}

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const tipo = searchParams.get('tipo') || 'resumen'

    if (tipo === 'rentabilidad') return rentabilidad(req)
    if (tipo === 'morosos') return morosos()
    if (tipo === 'rotacion') return rotacion(req)
    if (tipo === 'comparativo') return comparativo(req)
    if (tipo === 'flujo-caja') return flujoCaja(searchParams)
    if (tipo === 'mermas') return mermas(req)
    if (tipo === 'fiscal') return fiscal(req)
    if (tipo === 'ganancias') return ganancias(req)

    // ── Resumen original ─────────────────────────────────────────
    const { desde, hasta, where } = parseFechas(searchParams)

    const [facturas, compras, productos] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: { cliente: true, detalles: { include: { producto: true } }, abonos: true },
        orderBy: { creadoEn: 'desc' }
      }),
      prisma.compra.findMany({
        where: { estado: { not: 'anulada' }, creadoEn: where.creadoEn },
        include: { proveedor: true, abonos: true },
        orderBy: { creadoEn: 'desc' }
      }),
      prisma.producto.findMany({ where: { activo: true }, include: { categoria: true } })
    ])

    const totalVentas = facturas.reduce((s, f) => s + f.total, 0)
    const totalDescuentos = facturas.reduce((s, f) => s + (f.descuento || 0), 0)
    const totalIva = facturas.reduce((s, f) => s + (f.iva || 0), 0)

    let costoTotal = 0
    facturas.forEach(f => f.detalles.forEach(d => { costoTotal += (d.costo > 0 ? d.costo : (d.producto?.costo || 0)) * d.cantidad }))
    const gananciaTotal = totalVentas - costoTotal

    const ventasPorDia = {}
    facturas.forEach(f => {
      const dia = new Date(f.creadoEn).toISOString().split('T')[0]
      if (!ventasPorDia[dia]) ventasPorDia[dia] = { dia, ventas: 0, total: 0 }
      ventasPorDia[dia].ventas++; ventasPorDia[dia].total += f.total
    })

    const ventasPorMes = {}
    facturas.forEach(f => {
      const d = new Date(f.creadoEn)
      const mes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
      if (!ventasPorMes[mes]) ventasPorMes[mes] = { mes, ventas: 0, total: 0 }
      ventasPorMes[mes].ventas++; ventasPorMes[mes].total += f.total
    })

    const conteoProductos = {}
    facturas.forEach(f => f.detalles.forEach(d => {
      const nombre = d.producto?.nombre || 'Desconocido'
      if (!conteoProductos[nombre]) conteoProductos[nombre] = { nombre, cantidad: 0, ventas: 0, ganancia: 0, costoTotal: 0 }
      conteoProductos[nombre].cantidad += d.cantidad
      conteoProductos[nombre].ventas += d.subtotal
      const costo = d.costo > 0 ? d.costo : (d.producto?.costo || 0)
      conteoProductos[nombre].ganancia += (d.precio - costo) * d.cantidad
      conteoProductos[nombre].costoTotal += costo * d.cantidad
    }))
    const topProductos = Object.values(conteoProductos).sort((a, b) => b.ventas - a.ventas).slice(0, 10)

    const metodosPago = {}
    facturas.forEach(f => {
      const m = f.metodoPago
      if (!metodosPago[m]) metodosPago[m] = { metodo: m, cantidad: 0, total: 0 }
      metodosPago[m].cantidad++; metodosPago[m].total += f.total
    })

    const inventario = productos.map(p => ({
      id: p.id, nombre: p.nombre, categoria: p.categoria?.nombre,
      stock: p.stock, stockMinimo: p.stockMinimo, costo: p.costo, precio: p.precio,
      valorCosto: p.stock * p.costo, valorVenta: p.stock * p.precio,
      margen: p.precio > 0 ? ((p.precio - p.costo) / p.precio * 100) : 0
    }))
    const totalValorInventario = inventario.reduce((s, p) => s + p.valorCosto, 0)
    const stockBajo = inventario.filter(p => p.stock <= p.stockMinimo && p.stock > 0)
    const agotados = inventario.filter(p => p.stock <= 0)

    const cxc = facturas.filter(f => f.esCredito).map(f => ({
      id: f.id, numero: f.numero, cliente: f.cliente?.nombre || 'Sin cliente',
      total: f.total, saldoPendiente: f.saldoPendiente,
      diasDeuda: Math.floor((new Date() - new Date(f.creadoEn)) / (1000 * 60 * 60 * 24)),
      creadoEn: f.creadoEn
    }))
    const totalCXC = cxc.reduce((s, f) => s + f.saldoPendiente, 0)

    const cxp = compras.filter(c => c.esCredito).map(c => ({
      id: c.id, numero: c.numero, proveedor: c.proveedor?.nombre,
      total: c.total, saldoPendiente: c.saldoPendiente, creadoEn: c.creadoEn
    }))
    const totalCXP = cxp.reduce((s, c) => s + c.saldoPendiente, 0)

    return NextResponse.json({
      resumen: { totalVentas, totalDescuentos, totalIva, costoTotal, gananciaTotal,
        margenPct: totalVentas > 0 ? (gananciaTotal / totalVentas * 100) : 0,
        numFacturas: facturas.length,
        ticketPromedio: facturas.length > 0 ? totalVentas / facturas.length : 0,
        totalValorInventario, totalCXC, totalCXP },
      ventasPorDia: Object.values(ventasPorDia).sort((a, b) => a.dia.localeCompare(b.dia)),
      ventasPorMes: Object.values(ventasPorMes).sort((a, b) => a.mes.localeCompare(b.mes)),
      topProductos, metodosPago: Object.values(metodosPago), inventario, stockBajo, agotados, cxc, cxp
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}

async function rentabilidad(req) {
  const { searchParams } = new URL(req.url)
  const { desde, hasta, where } = parseFechas(searchParams)

  const [facturas, productos] = await Promise.all([
    prisma.factura.findMany({
      where,
      include: { detalles: { include: { producto: { include: { categoria: true } } } } },
    }),
    prisma.producto.findMany({ where: { activo: true }, include: { categoria: true } })
  ])

  const prodMap = {}  // productoId -> { nombre, categoria, cantidad, ventas, costoTotal, ganancia }
  const catMap = {}   // categoria -> { nombre, cantidad, ventas, costoTotal, ganancia }

  facturas.forEach(f => f.detalles.forEach(d => {
    const pid = d.productoId
    const cat = d.producto?.categoria?.nombre || 'Sin categoría'
    const costo = d.costo > 0 ? d.costo : (d.producto?.costo || 0)
    const ganancia = (d.precio - costo) * d.cantidad

    if (!prodMap[pid]) prodMap[pid] = {
      nombre: d.producto?.nombre || 'Desconocido', categoria: cat,
      cantidad: 0, ventas: 0, costoTotal: 0, ganancia: 0, precio: d.producto?.precio || 0
    }
    prodMap[pid].cantidad += d.cantidad
    prodMap[pid].ventas += d.subtotal
    prodMap[pid].costoTotal += costo * d.cantidad
    prodMap[pid].ganancia += ganancia

    if (!catMap[cat]) catMap[cat] = { nombre: cat, cantidad: 0, ventas: 0, costoTotal: 0, ganancia: 0 }
    catMap[cat].cantidad += d.cantidad
    catMap[cat].ventas += d.subtotal
    catMap[cat].costoTotal += costo * d.cantidad
    catMap[cat].ganancia += ganancia
  }))

  const productosConMargen = Object.values(prodMap)
    .map(p => ({ ...p, margen: p.ventas > 0 ? (p.ganancia / p.ventas * 100) : 0 }))
    .sort((a, b) => b.ganancia - a.ganancia)

  const categoriasConMargen = Object.values(catMap)
    .map(c => ({ ...c, margen: c.ventas > 0 ? (c.ganancia / c.ventas * 100) : 0 }))
    .sort((a, b) => b.ganancia - a.ganancia)

  return NextResponse.json({
    productos: productosConMargen,
    categorias: categoriasConMargen,
    resumen: {
      totalVentas: productosConMargen.reduce((s, p) => s + p.ventas, 0),
      totalCosto: productosConMargen.reduce((s, p) => s + p.costoTotal, 0),
      totalGanancia: productosConMargen.reduce((s, p) => s + p.ganancia, 0),
      margenGeneral: productosConMargen.reduce((s, p) => s + p.ventas, 0) > 0
        ? (productosConMargen.reduce((s, p) => s + p.ganancia, 0) / productosConMargen.reduce((s, p) => s + p.ventas, 0) * 100) : 0
    }
  })
}

async function morosos() {
  const facturas = await prisma.factura.findMany({
    where: { esCredito: true, estado: { not: 'anulada' } },
    include: { cliente: true, abonos: true },
    orderBy: { creadoEn: 'asc' }
  })

  const clientes = facturas.filter(f => (f.saldoPendiente || 0) > 0).map(f => ({
    id: f.id, numero: f.numero,
    cliente: f.cliente?.nombre || 'Sin cliente',
    telefono: f.cliente?.telefono || '',
    total: f.total, saldoPendiente: f.saldoPendiente,
    diasDeuda: Math.floor((new Date() - new Date(f.creadoEn)) / (1000 * 60 * 60 * 24)),
    fechaEmision: f.creadoEn,
    fechaVencimiento: f.fechaVencimiento,
    vencida: f.fechaVencimiento ? new Date(f.fechaVencimiento) < new Date() : false,
  })).sort((a, b) => b.diasDeuda - a.diasDeuda)

  const agrupado = { '0-30 días': 0, '31-60 días': 0, '61-90 días': 0, 'Más de 90 días': 0 }
  clientes.forEach(c => {
    if (c.diasDeuda <= 30) agrupado['0-30 días'] += c.saldoPendiente
    else if (c.diasDeuda <= 60) agrupado['31-60 días'] += c.saldoPendiente
    else if (c.diasDeuda <= 90) agrupado['61-90 días'] += c.saldoPendiente
    else agrupado['Más de 90 días'] += c.saldoPendiente
  })

  const totalMorosos = clientes.reduce((s, c) => s + c.saldoPendiente, 0)

  return NextResponse.json({ clientes, total: totalMorosos, agrupado, cantidad: clientes.length })
}

async function rotacion(req) {
  const { searchParams } = new URL(req.url)
  const { desde, hasta, where } = parseFechas(searchParams)

  const [facturas, productos, movimientos] = await Promise.all([
    prisma.factura.findMany({
      where,
      include: { detalles: { include: { producto: true } } },
    }),
    prisma.producto.findMany({ where: { activo: true }, include: { categoria: true } }),
    prisma.movInventario.findMany({
      where: { creadoEn: where.creadoEn },
      include: { producto: true },
      orderBy: { creadoEn: 'desc' }
    })
  ])

  const ventasPorProducto = {}
  facturas.forEach(f => f.detalles.forEach(d => {
    const pid = d.productoId
    if (!ventasPorProducto[pid]) ventasPorProducto[pid] = 0
    ventasPorProducto[pid] += d.cantidad
  }))

  const diasPeriodo = Math.max(1, Math.round((new Date(hasta) - new Date(desde)) / (1000 * 60 * 60 * 24)))
  const mesesPeriodo = diasPeriodo / 30

  const conRotacion = productos.map(p => {
    const vendido = ventasPorProducto[p.id] || 0
    const rotacion = p.stock > 0 ? (vendido / p.stock) * (12 / mesesPeriodo) : 0 // anualizada
    return {
      id: p.id, nombre: p.nombre, codigo: p.codigo || '',
      categoria: p.categoria?.nombre || '',
      stock: p.stock, vendido, rotacion: Math.round(rotacion * 100) / 100,
      valorInventario: p.stock * p.costo,
      estado: vendido === 0 ? 'sin_movimiento' : rotacion < 1 ? 'lenta' : 'normal'
    }
  })

  const sinMovimiento = conRotacion.filter(p => p.vendido === 0 && p.stock > 0)
    .sort((a, b) => b.valorInventario - a.valorInventario)
  const lenta = conRotacion.filter(p => p.vendido > 0 && p.rotacion < 1)
    .sort((a, b) => a.rotacion - b.rotacion)
  const normal = conRotacion.filter(p => p.vendido > 0 && p.rotacion >= 1)
    .sort((a, b) => b.rotacion - a.rotacion)

  return NextResponse.json({
    conRotacion: [...sinMovimiento, ...lenta, ...normal],
    sinMovimiento,
    lenta,
    normal,
    resumen: {
      totalProductos: productos.length,
      sinMovimiento: sinMovimiento.length,
      valorEstancado: sinMovimiento.reduce((s, p) => s + p.valorInventario, 0),
      rotacionPromedio: conRotacion.length > 0
        ? conRotacion.reduce((s, p) => s + p.rotacion, 0) / conRotacion.length : 0
    }
  })
}

async function comparativo(req) {
  const { searchParams } = new URL(req.url)
  const { desde, hasta } = parseFechas(searchParams)
  const compararDesde = searchParams.get('compararDesde') || ''
  const compararHasta = searchParams.get('compararHasta') || ''

  async function periodoData(d, h) {
    if (!d || !h) return null
    const where = { estado: { not: 'anulada' }, creadoEn: { gte: new Date(d), lte: new Date(h + 'T23:59:59.999Z') } }
    const facturas = await prisma.factura.findMany({ where, include: { detalles: true } })
    const compras = await prisma.compra.findMany({ where: { estado: { not: 'anulada' }, creadoEn: where.creadoEn } })
    const ventas = facturas.reduce((s, f) => s + f.total, 0)
    let costos = 0
    facturas.forEach(f => f.detalles.forEach(det => { costos += (det.costo > 0 ? det.costo : 0) * det.cantidad }))
    const ganancia = ventas - costos
    const gastos = compras.reduce((s, c) => s + c.total, 0)
    return { ventas, costos, ganancia, gastos, numFacturas: facturas.length, numCompras: compras.length,
      margen: ventas > 0 ? (ganancia / ventas * 100) : 0 }
  }

  const actual = await periodoData(desde, hasta)
  const anterior = await periodoData(compararDesde, compararHasta)

  const diferencia = actual && anterior ? {
    ventas: actual.ventas - anterior.ventas,
    ventasPct: anterior.ventas > 0 ? ((actual.ventas - anterior.ventas) / anterior.ventas * 100) : 0,
    ganancia: actual.ganancia - anterior.ganancia,
    gananciaPct: anterior.ganancia > 0 ? ((actual.ganancia - anterior.ganancia) / anterior.ganancia * 100) : 0,
    facturas: actual.numFacturas - anterior.numFacturas,
  } : null

  return NextResponse.json({ actual, anterior, diferencia })
}

async function flujoCaja(searchParams) {
  const dias = parseInt(searchParams.get('dias') || '30')
  const hoy = new Date()
  const futuro = new Date(hoy)
  futuro.setDate(futuro.getDate() + dias)

  const [facturas, compras] = await Promise.all([
    prisma.factura.findMany({
      where: { esCredito: true, estado: { not: 'anulada' }, saldoPendiente: { gt: 0 } },
      include: { cliente: true }
    }),
    prisma.compra.findMany({
      where: { esCredito: true, estado: { not: 'anulada' }, saldoPendiente: { gt: 0 } },
      include: { proveedor: true }
    })
  ])

  const porCobrar = facturas.map(f => {
    const venc = f.fechaVencimiento ? new Date(f.fechaVencimiento) : null
    const venceEn = venc ? Math.round((venc - hoy) / (1000 * 60 * 60 * 24)) : null
    return {
      id: f.id, numero: f.numero, cliente: f.cliente?.nombre || 'Sin cliente',
      saldoPendiente: f.saldoPendiente, venceEn, fechaVencimiento: f.fechaVencimiento,
      venceEnPeriodo: venceEn !== null && venceEn <= dias && venceEn >= 0
    }
  }).filter(c => c.venceEnPeriodo)

  const porPagar = compras.map(c => {
    const venc = c.fechaVencimiento ? new Date(c.fechaVencimiento) : null
    const venceEn = venc ? Math.round((venc - hoy) / (1000 * 60 * 60 * 24)) : null
    return {
      id: c.id, numero: c.numero, proveedor: c.proveedor?.nombre || 'Sin proveedor',
      saldoPendiente: c.saldoPendiente, venceEn, fechaVencimiento: c.fechaVencimiento,
      venceEnPeriodo: venceEn !== null && venceEn <= dias && venceEn >= 0
    }
  }).filter(c => c.venceEnPeriodo)

  return NextResponse.json({
    dias, porCobrar, porPagar,
    totalCobrar: porCobrar.reduce((s, c) => s + c.saldoPendiente, 0),
    totalPagar: porPagar.reduce((s, c) => s + c.saldoPendiente, 0),
    saldoNeto: porCobrar.reduce((s, c) => s + c.saldoPendiente, 0) - porPagar.reduce((s, c) => s + c.saldoPendiente, 0)
  })
}

async function mermas(req) {
  const { searchParams } = new URL(req.url)
  const { desde, hasta, where } = parseFechas(searchParams)

  const movimientos = await prisma.movInventario.findMany({
    where: {
      creadoEn: where.creadoEn,
      OR: [
        { tipo: 'salida', motivo: { contains: 'merma', mode: 'insensitive' } },
        { tipo: 'salida', motivo: { contains: 'venc', mode: 'insensitive' } },
        { tipo: 'salida', motivo: { contains: 'robo', mode: 'insensitive' } },
        { tipo: 'salida', motivo: { contains: 'pérdida', mode: 'insensitive' } },
        { tipo: 'salida', motivo: { contains: 'perdida', mode: 'insensitive' } },
        { tipo: 'salida', motivo: { contains: 'daño', mode: 'insensitive' } },
        { tipo: 'salida', motivo: { contains: 'dano', mode: 'insensitive' } },
        { tipo: 'ajuste' },
      ]
    },
    include: { producto: true },
    orderBy: { creadoEn: 'desc' }
  })

  // También incluir salidas de inventario sin motivo específico que no sean ventas
  // (se registran manualmente en el módulo de inventario)
  const adicionales = await prisma.movInventario.findMany({
    where: {
      creadoEn: where.creadoEn,
      tipo: 'salida',
      motivo: null,
      entradaVentaId: null  // no asociado a una venta
    },
    include: { producto: true },
    orderBy: { creadoEn: 'desc' }
  })

  const todos = [...movimientos, ...adicionales]
  const unicos = todos.filter((m, i, arr) => arr.findIndex(x => x.id === m.id) === i)

  const porProducto = {}
  unicos.forEach(m => {
    const nombre = m.producto?.nombre || 'Desconocido'
    if (!porProducto[nombre]) porProducto[nombre] = { nombre, cantidad: 0, motivo: '' }
    porProducto[nombre].cantidad += m.cantidad
  })

  return NextResponse.json({
    movimientos: unicos,
    porProducto: Object.values(porProducto).sort((a, b) => b.cantidad - a.cantidad),
    totalMermas: unicos.reduce((s, m) => s + m.cantidad, 0),
    cantidadMovimientos: unicos.length
  })
}

async function fiscal(req) {
  const { searchParams } = new URL(req.url)
  const { desde, hasta, where } = parseFechas(searchParams)

  const facturas = await prisma.factura.findMany({
    where,
    include: { cliente: true, detalles: { include: { producto: true } } },
    orderBy: { creadoEn: 'asc' }
  })

  const porMes = {}
  facturas.forEach(f => {
    const d = new Date(f.creadoEn)
    const mes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    if (!porMes[mes]) porMes[mes] = { mes, facturas: 0, ventas: 0, iva: 0, exentas: 0, descuentos: 0, contado: 0, credito: 0 }
    porMes[mes].facturas++
    porMes[mes].ventas += f.total
    porMes[mes].iva += f.iva || 0
    porMes[mes].descuentos += f.descuento || 0
    if (f.esCredito) porMes[mes].credito += f.total
    else porMes[mes].contado += f.total
  })

  const resumen = {
    totalVentas: facturas.reduce((s, f) => s + f.total, 0),
    totalIva: facturas.reduce((s, f) => s + (f.iva || 0), 0),
    totalDescuentos: facturas.reduce((s, f) => s + (f.descuento || 0), 0),
    numFacturas: facturas.length,
    numClientes: new Set(facturas.filter(f => f.clienteId).map(f => f.clienteId)).size,
    contado: facturas.filter(f => !f.esCredito).reduce((s, f) => s + f.total, 0),
    credito: facturas.filter(f => f.esCredito).reduce((s, f) => s + f.total, 0),
    desde, hasta
  }

  return NextResponse.json({
    resumen,
    porMes: Object.values(porMes).sort((a, b) => a.mes.localeCompare(b.mes))
  })
}

async function ganancias(req) {
  const { searchParams } = new URL(req.url)
  const { desde, hasta, where } = parseFechas(searchParams)

  const [facturas, gastos] = await Promise.all([
    prisma.factura.findMany({
      where,
      include: { detalles: { include: { producto: true } } },
      orderBy: { creadoEn: 'asc' }
    }),
    prisma.gasto.findMany({
      where: { fecha: where.creadoEn },
      orderBy: { fecha: 'asc' }
    })
  ])

  // Por día
  const porDia = {}
  facturas.forEach(f => {
    const d = new Date(f.creadoEn).toISOString().split('T')[0]
    if (!porDia[d]) porDia[d] = { periodo: d, ventas: 0, costo: 0, ganancia: 0, gastos: 0 }
    porDia[d].ventas += f.total
    f.detalles.forEach(det => {
      const costo = det.costo > 0 ? det.costo : (det.producto?.costo || 0)
      porDia[d].costo += costo * det.cantidad
    })
    porDia[d].ganancia = porDia[d].ventas - porDia[d].costo
  })

  gastos.forEach(g => {
    const d = new Date(g.fecha).toISOString().split('T')[0]
    if (!porDia[d]) porDia[d] = { periodo: d, ventas: 0, costo: 0, ganancia: 0, gastos: 0 }
    porDia[d].gastos += g.monto
  })

  // Por quincena (1-15, 16-fin)
  const porQuincena = {}
  function quincenaKey(fecha) {
    const d = new Date(fecha)
    const m = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    return d.getDate() <= 15 ? m + '-01' : m + '-16'
  }
  facturas.forEach(f => {
    const q = quincenaKey(f.creadoEn)
    if (!porQuincena[q]) porQuincena[q] = { periodo: q, ventas: 0, costo: 0, ganancia: 0, gastos: 0 }
    porQuincena[q].ventas += f.total
    f.detalles.forEach(det => {
      const costo = det.costo > 0 ? det.costo : (det.producto?.costo || 0)
      porQuincena[q].costo += costo * det.cantidad
    })
    porQuincena[q].ganancia = porQuincena[q].ventas - porQuincena[q].costo
  })
  gastos.forEach(g => {
    const q = quincenaKey(g.fecha)
    if (!porQuincena[q]) porQuincena[q] = { periodo: q, ventas: 0, costo: 0, ganancia: 0, gastos: 0 }
    porQuincena[q].gastos += g.monto
  })

  // Por mes
  const porMes = {}
  facturas.forEach(f => {
    const d = new Date(f.creadoEn)
    const mes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    if (!porMes[mes]) porMes[mes] = { periodo: mes, ventas: 0, costo: 0, ganancia: 0, gastos: 0 }
    porMes[mes].ventas += f.total
    f.detalles.forEach(det => {
      const costo = det.costo > 0 ? det.costo : (det.producto?.costo || 0)
      porMes[mes].costo += costo * det.cantidad
    })
    porMes[mes].ganancia = porMes[mes].ventas - porMes[mes].costo
  })
  gastos.forEach(g => {
    const d = new Date(g.fecha)
    const mes = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0')
    if (!porMes[mes]) porMes[mes] = { periodo: mes, ventas: 0, costo: 0, ganancia: 0, gastos: 0 }
    porMes[mes].gastos += g.monto
  })

  const totalVentas = facturas.reduce((s, f) => s + f.total, 0)
  let totalCosto = 0
  facturas.forEach(f => f.detalles.forEach(det => {
    totalCosto += (det.costo > 0 ? det.costo : (det.producto?.costo || 0)) * det.cantidad
  }))
  const totalGastos = gastos.reduce((s, g) => s + g.monto, 0)
  const totalGanancia = totalVentas - totalCosto
  const totalNeto = totalGanancia - totalGastos

  return NextResponse.json({
    porDia: Object.values(porDia).sort((a, b) => a.periodo.localeCompare(b.periodo)),
    porQuincena: Object.values(porQuincena).sort((a, b) => a.periodo.localeCompare(b.periodo)),
    porMes: Object.values(porMes).sort((a, b) => a.periodo.localeCompare(b.periodo)),
    resumen: {
      ventas: totalVentas,
      costo: totalCosto,
      gananciaBruta: totalGanancia,
      margenBruto: totalVentas > 0 ? (totalGanancia / totalVentas * 100) : 0,
      gastos: totalGastos,
      gananciaNeta: totalNeto,
      margenNeto: totalVentas > 0 ? (totalNeto / totalVentas * 100) : 0,
    }
  })
}
