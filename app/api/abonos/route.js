import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const facturaId = parseInt(body.facturaId)
    const monto = parseFloat(body.monto)

    if (!facturaId || isNaN(monto) || monto <= 0) {
      return NextResponse.json({ error: 'Datos de abono inválidos' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const factura = await tx.factura.findUnique({ where: { id: facturaId } })
      if (!factura) throw new Error('Factura no encontrada')

      if (monto > factura.saldoPendiente) {
        throw new Error(`El abono (C$ ${monto}) supera el saldo pendiente (C$ ${factura.saldoPendiente})`)
      }

      const abono = await tx.abono.create({
        data: { facturaId, monto, nota: body.nota || null }
      })

      const nuevoSaldo = parseFloat((factura.saldoPendiente - monto).toFixed(2))
      const nuevoEstado = nuevoSaldo <= 0 ? 'pagada' : 'credito'

      await tx.factura.update({
        where: { id: facturaId },
        data: { saldoPendiente: nuevoSaldo, estado: nuevoEstado }
      })

      return { abono, nuevoSaldo, nuevoEstado }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error al registrar abono:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
