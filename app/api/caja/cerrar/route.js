import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { arqueo, observacion, usuario } = await req.json()

    const caja = await prisma.caja.findFirst({ where: { estado: 'abierta' } })
    if (!caja) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 400 })

    // Recalcular solo dinero que realmente entró a caja
    const facturas = await prisma.factura.findMany({
      where: { creadoEn: { gte: caja.abiertaEn }, estado: { not: 'anulada' } }
    })
    let ventasEfectivoCs = 0, ventasEfectivoUs = 0
    let ventasTarjeta = 0, ventasTransfer = 0
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
        }
      } else {
        if (f.metodoPago === 'credito') continue
        const monto = f.metodoPago === 'dolares' ? (f.pagoEnUsd || f.pagoCon || 0) : f.total
        if (f.metodoPago === 'efectivo') ventasEfectivoCs += monto
        else if (f.metodoPago === 'dolares') ventasEfectivoUs += monto
        else if (f.metodoPago === 'tarjeta') ventasTarjeta += monto
        else if (f.metodoPago === 'transferencia') ventasTransfer += monto
      }
    }
    // Abonos de clientes (CxC): dinero que entró a caja
    const abonos = await prisma.abono.findMany({
      where: { creadoEn: { gte: caja.abiertaEn } }
    })
    for (const a of abonos) {
      ventasEfectivoCs += a.monto
    }

    // Calcular totales del arqueo
    let efectivoRealCs = 0
    let efectivoRealUs = 0

    if (arqueo?.length) {
      for (const item of arqueo) {
        if (item.moneda === 'C$') efectivoRealCs += item.subtotal
        else efectivoRealUs += item.subtotal
      }
    }

    const diferenciaCs = parseFloat((efectivoRealCs - caja.montoInicial - ventasEfectivoCs - caja.ingresosExtra + caja.egresos).toFixed(2))
    const diferenciaUs = parseFloat((efectivoRealUs - ventasEfectivoUs).toFixed(2))

    // Guardar detalle del arqueo
    if (arqueo?.length) {
      await prisma.arqueoDetalle.createMany({
        data: arqueo.map(a => ({ cajaId: caja.id, ...a }))
      })
    }

    const cerrada = await prisma.caja.update({
      where: { id: caja.id },
      data: {
        estado: 'cerrada',
        usuarioCierre: usuario,
        cerradaEn: new Date(),
        efectivoRealCs,
        efectivoRealUs,
        diferencia: diferenciaCs,
        diferenciaUs,
        observacion
      }
    })

    return NextResponse.json(cerrada)
  } catch (e) {
    console.error('Error al cerrar caja:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}