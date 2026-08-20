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

    // Lo esperado en el cajón es SOLO efectivo (ventas + abonos en efectivo + inicial + ingresos - egresos).
    // Tarjeta/transferencia no entran a la caja: van al banco.
    const esperadoCs = parseFloat((caja.montoInicial + stats.ventasEfectivoCs + stats.abonosEfectivoCs + caja.ingresosExtra - caja.egresos).toFixed(2))
    const esperadoUs = parseFloat((caja.montoInicialUs + stats.ventasEfectivoUs + stats.abonosEfectivoUs + caja.ingresosExtraUs - caja.egresosUs).toFixed(2))

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

    const diferenciaCs = parseFloat((efectivoRealCs - esperadoCs).toFixed(2))
    const diferenciaUs = parseFloat((efectivoRealUs - esperadoUs).toFixed(2))

    // Cerrar caja en transacción: arqueo + update atómicos
    const cerrada = await prisma.$transaction(async (tx) => {
      // Guardar detalle del arqueo
      if (arqueo?.length) {
        await tx.arqueoDetalle.createMany({
          data: arqueo.map(a => ({ cajaId: caja.id, ...a }))
        })
      }

      return await tx.caja.update({
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
          ventasCredito: stats.ventasCredito, // mantener crédito real, no forzar 0
          abonosEfectivoCs: stats.abonosEfectivoCs,
          abonosEfectivoUs: stats.abonosEfectivoUs,
          abonosTarjeta: stats.abonosTarjeta,
          abonosTransfer: stats.abonosTransfer,
          totalVendido: stats.totalVendido
        }
      })
    })

    return NextResponse.json({ ...cerrada, esperadoCs, esperadoUs })
  } catch (e) {
    console.error('Error al cerrar caja:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}