import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request, { params }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const factura = await prisma.factura.findUnique({
      where: { id },
      include: {
        cliente: true,
        detalles: { include: { producto: true } },
        abonos: true
      }
    })
    if (!factura) return NextResponse.json({ error: 'Factura no encontrada' }, { status: 404 })
    return NextResponse.json(factura)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener factura' }, { status: 500 })
  }
}
