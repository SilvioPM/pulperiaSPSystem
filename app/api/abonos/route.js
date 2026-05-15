import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function POST(request) {
  try {
    const body     = await request.json()
    const facturaId = parseInt(body.facturaId)
    const monto    = parseFloat(body.monto)

    // Obtenemos la factura actual
    const factura = await prisma.factura.findUnique({
      where: { id: facturaId }
    })

    if (!factura) {
      return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    if (monto > factura.saldoPendiente) {
      return NextResponse.json(
        { error: `El abono (C$ ${monto}) supera el saldo pendiente (C$ ${factura.saldoPendiente})` },
        { status: 400 }
      )
    }

    // Registramos el abono
    const abono = await prisma.abono.create({
      data: {
        facturaId,
        monto,
        nota: body.nota || null
      }
    })

    // Actualizamos el saldo pendiente
    const nuevoSaldo = parseFloat((factura.saldoPendiente - monto).toFixed(2))
    const nuevoEstado = nuevoSaldo <= 0 ? 'pagada' : 'credito'

    await prisma.factura.update({
      where: { id: facturaId },
      data:  {
        saldoPendiente: nuevoSaldo,
        estado:         nuevoEstado
      }
    })

    return NextResponse.json({ abono, nuevoSaldo, nuevoEstado }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar abono' }, { status: 500 })
  }
}