import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(req) {
  try {
    const { arqueo, observacion, usuario } = await req.json()

    const caja = await prisma.caja.findFirst({ where: { estado: 'abierta' } })
    if (!caja) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 400 })

    // Calcular totales del arqueo
    let efectivoRealCs = 0
    let efectivoRealUs = 0

    if (arqueo?.length) {
      for (const item of arqueo) {
        if (item.moneda === 'C$') efectivoRealCs += item.subtotal
        else efectivoRealUs += item.subtotal
      }
    }

    const diferenciaCs = parseFloat((efectivoRealCs - caja.montoInicial - caja.ventasEfectivoCs - caja.ingresosExtra + caja.egresos).toFixed(2))
    const diferenciaUs = parseFloat((efectivoRealUs - caja.ventasEfectivoUs).toFixed(2))

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