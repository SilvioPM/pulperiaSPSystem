import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const id   = parseInt(params.id)
    const body = await request.json()
    const proveedor = await prisma.proveedor.update({
      where: { id },
      data: {
        nombre:    body.nombre,
        telefono:  body.telefono  || null,
        contacto:  body.contacto  || null,
        direccion: body.direccion || null,
        email:     body.email     || null,
        ...(body.saldoInicialCxp !== undefined && { saldoInicialCxp: parseFloat(body.saldoInicialCxp || 0) })
      }
    })
    return NextResponse.json(proveedor)
  } catch (error) {
    return NextResponse.json({ error: 'Error al editar proveedor' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id)
    await prisma.proveedor.update({
      where: { id },
      data:  { activo: false }
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar proveedor' }, { status: 500 })
  }
}