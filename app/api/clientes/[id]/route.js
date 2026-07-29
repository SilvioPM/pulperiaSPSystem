import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { parseNumber } from '@/lib/number'

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id)
    const facturas = await prisma.factura.findMany({ where: { clienteId: id }, select: { id: true }, take: 1 })
    if (facturas.length > 0) {
      return NextResponse.json({ error: 'No se puede eliminar un cliente con facturas asociadas' }, { status: 400 })
    }
    await prisma.cliente.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar cliente' }, { status: 500 })
  }
}

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: body.nombre,
        codigo: body.codigo || null,
        telefono: body.telefono || null,
        cedula: body.cedula || null,
        direccion: body.direccion || null,
        limiteCredito: parseNumber(body.limiteCredito || 0),
        ...(body.saldoInicial !== undefined && { saldoInicial: parseNumber(body.saldoInicial || 0) })
      }
    })
    return NextResponse.json(cliente)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}
