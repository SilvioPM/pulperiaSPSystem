import { prisma } from './prisma'

export async function calcularCajaStats(caja) {
  const rango = { gte: caja.abiertaEn, ...(caja.cerradaEn ? { lte: caja.cerradaEn } : {}) }

  const [facturas, abonos] = await Promise.all([
    prisma.factura.findMany({ where: { creadoEn: rango, estado: { not: 'anulada' } } }),
    prisma.abono.findMany({ where: { creadoEn: rango } })
  ])

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

  const abonosTotal = abonos.reduce((s, a) => s + a.monto, 0)

  return {
    ventasEfectivoCs: parseFloat(ventasEfectivoCs.toFixed(2)),
    ventasEfectivoUs: parseFloat(ventasEfectivoUs.toFixed(2)),
    ventasTarjeta: parseFloat(ventasTarjeta.toFixed(2)),
    ventasTransfer: parseFloat(ventasTransfer.toFixed(2)),
    abonosTotal: parseFloat(abonosTotal.toFixed(2)),
    totalVendido: parseFloat((totalPagos + abonosTotal).toFixed(2))
  }
}
