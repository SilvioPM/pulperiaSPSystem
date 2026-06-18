import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body = await request.json()
    const compraId = parseInt(body.compraId)
    const monto = parseFloat(body.monto)

    if (!compraId || isNaN(monto) || monto <= 0) {
      return NextResponse.json({ error: 'Datos de abono inválidos' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const compra = await tx.compra.findUnique({ where: { id: compraId } })
      if (!compra) throw new Error('Compra no encontrada')
      if (monto > compra.saldoPendiente) {
        throw new Error(`El abono supera el saldo pendiente (C$ ${compra.saldoPendiente})`)
      }

      const abono = await tx.abonoCompra.create({
        data: { compraId, monto, nota: body.nota || null }
      })

      const nuevoSaldo = parseFloat((compra.saldoPendiente - monto).toFixed(2))
      await tx.compra.update({
        where: { id: compraId },
        data: { saldoPendiente: nuevoSaldo, estado: nuevoSaldo <= 0 ? 'pagada' : 'credito' }
      })

      return { abono, nuevoSaldo }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error al registrar abono de compra:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
