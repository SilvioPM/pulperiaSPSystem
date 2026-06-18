import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const proveedores = await prisma.proveedor.findMany({
      where:   { activo: true },
      include: { _count: { select: { compras: true } } },
      orderBy: { nombre: 'asc' }
    })
    return NextResponse.json(proveedores)
  } catch (error) {
    console.error('Error al obtener proveedores:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
export async function POST(request) {
  try {
    const body = await request.json()
    const proveedor = await prisma.proveedor.create({
      data: {
        nombre:    body.nombre,
        telefono:  body.telefono  || null,
        contacto:  body.contacto  || null,
        direccion: body.direccion || null,
        email:     body.email     || null,
      }
    })
    return NextResponse.json(proveedor, { status: 201 })
  } catch (error) {
    console.error('Error al crear proveedor:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}