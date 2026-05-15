import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body    = await request.json()
    const compraId = parseInt(body.compraId)
    const monto   = parseFloat(body.monto)

    const compra = await prisma.compra.findUnique({
      where: { id: compraId }
    })

    if (!compra) {
      return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    }

    if (monto > compra.saldoPendiente) {
      return NextResponse.json(
        { error: `El abono supera el saldo pendiente (C$ ${compra.saldoPendiente})` },
        { status: 400 }
      )
    }

    const abono = await prisma.abonoCompra.create({
      data: { compraId, monto, nota: body.nota || null }
    })

    const nuevoSaldo = parseFloat((compra.saldoPendiente - monto).toFixed(2))
    await prisma.compra.update({
      where: { id: compraId },
      data:  {
        saldoPendiente: nuevoSaldo,
        estado:         nuevoSaldo <= 0 ? 'pagada' : 'credito'
      }
    })

    return NextResponse.json({ abono, nuevoSaldo }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar abono' }, { status: 500 })
  }
}