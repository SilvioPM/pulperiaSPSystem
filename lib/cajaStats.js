import { prisma } from './prisma'

function computarStats(facturas, abonos) {
  let ventasEfectivoCs = 0, ventasEfectivoUs = 0
  let ventasTarjeta = 0, ventasTransfer = 0, totalPagos = 0
  for (const f of facturas) {
    let dp = []
    try { dp = f.detallesPago ? JSON.parse(f.detallesPago) : [] } catch {}
    if (dp.length > 0) {
      for (const p of dp) {
        if (p.metodo === 'credito') continue
        const monto = parseFloat(p.monto || 0)
        if (p.metodo === 'efectivo' && p.moneda === 'C$') ventasEfectivoCs += monto
        else if (p.metodo === 'efectivo' && p.moneda === '$') ventasEfectivoUs += monto
        else if (p.metodo === 'dolares') ventasEfectivoUs += monto
        else if (p.metodo === 'tarjeta') ventasTarjeta += monto
        else if (p.metodo === 'transferencia') ventasTransfer += monto
        totalPagos += monto
      }
    } else {
      if (f.metodoPago === 'credito') continue
      const monto = f.metodoPago === 'dolares' ? (f.pagoEnUsd || f.pagoCon || 0) : f.total
      if (f.metodoPago === 'efectivo') ventasEfectivoCs += monto
      else if (f.metodoPago === 'dolares') ventasEfectivoUs += monto
      else if (f.metodoPago === 'tarjeta') ventasTarjeta += monto
      else if (f.metodoPago === 'transferencia') ventasTransfer += monto
      totalPagos += monto
    }
  }

  // Abonos divididos por método: efectivo entra a la caja física; tarjeta/transferencia van al banco
  let abonosEfectivoCs = 0, abonosEfectivoUs = 0, abonosTarjeta = 0, abonosTransfer = 0
  for (const a of abonos) {
    if (a.metodo === 'dolares' || (a.metodo === 'efectivo' && a.moneda === '$')) abonosEfectivoUs += a.monto
    else if (a.metodo === 'tarjeta') abonosTarjeta += a.monto
    else if (a.metodo === 'transferencia') abonosTransfer += a.monto
    else abonosEfectivoCs += a.monto
  }

  const abonosTotal = abonos.reduce((s, a) => s + a.monto, 0)

  return {
    ventasEfectivoCs: parseFloat(ventasEfectivoCs.toFixed(2)),
    ventasEfectivoUs: parseFloat(ventasEfectivoUs.toFixed(2)),
    ventasTarjeta: parseFloat(ventasTarjeta.toFixed(2)),
    ventasTransfer: parseFloat(ventasTransfer.toFixed(2)),
    abonosEfectivoCs: parseFloat(abonosEfectivoCs.toFixed(2)),
    abonosEfectivoUs: parseFloat(abonosEfectivoUs.toFixed(2)),
    abonosTarjeta: parseFloat(abonosTarjeta.toFixed(2)),
    abonosTransfer: parseFloat(abonosTransfer.toFixed(2)),
    abonosTotal: parseFloat(abonosTotal.toFixed(2)),
    totalVendido: parseFloat((totalPagos + abonosTotal).toFixed(2))
  }
}

export async function calcularCajaStats(caja) {
  const rango = { gte: caja.abiertaEn, ...(caja.cerradaEn ? { lte: caja.cerradaEn } : {}) }

  const [facturas, abonos] = await Promise.all([
    prisma.factura.findMany({ where: { creadoEn: rango, estado: { not: 'anulada' } } }),
    prisma.abono.findMany({ where: { creadoEn: rango } })
  ])

  return computarStats(facturas, abonos)
}

// Calcula stats de varias cajas con SOLO 2 consultas (evita el N+1):
// se traen facturas y abonos del rango completo y se particionan por caja.
export async function calcularCajaStatsBatch(cajas) {
  if (!cajas || cajas.length === 0) return []

  const desde = cajas.reduce((min, c) => !min || c.abiertaEn < min ? c.abiertaEn : min, null)
  const hasta = cajas.reduce((max, c) => !max || (c.cerradaEn && c.cerradaEn > max) ? c.cerradaEn : max, null)

  const [facturas, abonos] = await Promise.all([
    prisma.factura.findMany({ where: { creadoEn: { gte: desde, ...(hasta ? { lte: hasta } : {}) }, estado: { not: 'anulada' } } }),
    prisma.abono.findMany({ where: { creadoEn: { gte: desde, ...(hasta ? { lte: hasta } : {}) } } })
  ])

  return cajas.map(c => {
    const rango = { gte: c.abiertaEn, ...(c.cerradaEn ? { lte: c.cerradaEn } : {}) }
    const f = facturas.filter(x => x.creadoEn >= rango.gte && (rango.lte ? x.creadoEn <= rango.lte : true))
    const a = abonos.filter(x => x.creadoEn >= rango.gte && (rango.lte ? x.creadoEn <= rango.lte : true))
    return computarStats(f, a)
  })
}