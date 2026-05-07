import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')

    const clientes = await prisma.cliente.findMany({
      where: buscar ? {
        nombre: { contains: buscar }
      } : {},
      orderBy: { nombre: 'asc' }
    })
    return NextResponse.json(clientes)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const cliente = await prisma.cliente.create({
      data: {
        nombre: body.nombre,
        telefono: body.telefono || null,
        cedula: body.cedula || null,
        direccion: body.direccion || null
      }
    })
    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}