import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { calcularCajaStats } from '@/lib/cajaStats'
import { sanitizarEntrada } from '@/lib/sanitizar'

export async function PUT(request, { params }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = sanitizarEntrada(await request.json(), 300, ['arqueo'])
    const { arqueo, observacion } = body

    const caja = await prisma.caja.findUnique({ where: { id } })
    if (!caja) return NextResponse.json({ error: 'Caja no encontrada' }, { status: 404 })
    if (caja.estado !== 'cerrada') {
      return NextResponse.json({ error: 'Solo se puede editar el arqueo de una caja cerrada' }, { status: 400 })
    }
    if (!arqueo || !Array.isArray(arqueo) || arqueo.length === 0) {
      return NextResponse.json({ error: 'El arqueo no puede estar vacío' }, { status: 400 })
    }

    let efectivoRealCs = 0
    let efectivoRealUs = 0
    for (const item of arqueo) {
      const st = parseFloat(item.subtotal)
      if (isNaN(st)) {
        return NextResponse.json({ error: 'Valor inválido en el arqueo. Revisá los subtotales.' }, { status: 400 })
      }
      if (item.moneda === 'C$') efectivoRealCs += st
      else efectivoRealUs += st
    }

    const stats = await calcularCajaStats(caja)
    const esperadoCs = parseFloat((caja.montoInicial + stats.ventasEfectivoCs + stats.abonosEfectivoCs + caja.ingresosExtra - caja.egresos).toFixed(2))
    const esperadoUs = parseFloat((caja.montoInicialUs + stats.ventasEfectivoUs + stats.abonosEfectivoUs + caja.ingresosExtraUs - caja.egresosUs).toFixed(2))
    const diferenciaCs = parseFloat((efectivoRealCs - esperadoCs).toFixed(2))
    const diferenciaUs = parseFloat((efectivoRealUs - esperadoUs).toFixed(2))

    await prisma.$transaction([
      prisma.arqueoDetalle.deleteMany({ where: { cajaId: id } }),
      prisma.arqueoDetalle.createMany({
        data: arqueo.map(a => ({
          cajaId: id,
          moneda: a.moneda,
          denominacion: parseFloat(a.denominacion),
          cantidad: parseInt(a.cantidad) || 0,
          subtotal: parseFloat(a.subtotal)
        }))
      }),
      prisma.caja.update({
        where: { id },
        data: {
          efectivoRealCs,
          efectivoRealUs,
          diferencia: diferenciaCs,
          diferenciaUs,
          observacion: observacion ?? caja.observacion
        }
      })
    ])

    return NextResponse.json({ id, efectivoRealCs, efectivoRealUs, diferencia: diferenciaCs, diferenciaUs })
  } catch (e) {
    console.error('Error al editar arqueo:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
