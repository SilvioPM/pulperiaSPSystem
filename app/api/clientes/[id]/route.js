import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const cliente = await prisma.cliente.update({
      where: { id },
      data: {
        nombre: body.nombre,
        telefono: body.telefono || null,
        cedula: body.cedula || null,
        direccion: body.direccion || null,
        limiteCredito: parseFloat(body.limiteCredito || 0)
      }
    })
    return NextResponse.json(cliente)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar cliente' }, { status: 500 })
  }
}
