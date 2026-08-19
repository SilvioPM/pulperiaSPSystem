import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { calcularCajaStats } from '@/lib/cajaStats'
import { sanitizarEntrada } from '@/lib/sanitizar'

export async function POST(req) {
  try {
    const body = sanitizarEntrada(await req.json(), 300, ['arqueo'])
    const { arqueo, observacion, usuario } = body

    const caja = await prisma.caja.findFirst({ where: { estado: 'abierta' } })
    if (!caja) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 400 })

    const stats = await calcularCajaStats(caja)
    const ventasEfectivoCs = stats.ventasEfectivoCs
    const ventasEfectivoUs = stats.ventasEfectivoUs

    // Calcular totales del arqueo
    let efectivoRealCs = 0
    let efectivoRealUs = 0

    if (arqueo?.length) {
      for (const item of arqueo) {
        const st = parseFloat(item.subtotal)
        if (isNaN(st)) {
          return NextResponse.json({ error: 'Valor inválido en el arqueo. Revisá los subtotales.' }, { status: 400 })
        }
        if (item.moneda === 'C$') efectivoRealCs += st
        else efectivoRealUs += st
      }
    }

    const diferenciaCs = parseFloat((efectivoRealCs - caja.montoInicial - ventasEfectivoCs - caja.ingresosExtra + caja.egresos).toFixed(2))
    const diferenciaUs = parseFloat((efectivoRealUs - caja.montoInicialUs - ventasEfectivoUs - caja.ingresosExtraUs + caja.egresosUs).toFixed(2))

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
        observacion,
        ventasEfectivoCs: stats.ventasEfectivoCs,
        ventasEfectivoUs: stats.ventasEfectivoUs,
        ventasTarjeta: stats.ventasTarjeta,
        ventasTransfer: stats.ventasTransfer,
        ventasCredito: 0,
        totalVendido: stats.totalVendido
      }
    })

    return NextResponse.json(cerrada)
  } catch (e) {
    console.error('Error al cerrar caja:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}