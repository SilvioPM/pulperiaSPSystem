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
    return NextResponse.json({ error: error.message }, { status: 500 })
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
    console.error('ERROR PROVEEDOR:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}