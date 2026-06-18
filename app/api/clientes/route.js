import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const page = Math.max(1, parseInt(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || 30)))

    const where = buscar ? { nombre: { contains: buscar } } : {}

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.cliente.count({ where })
    ])

    return NextResponse.json({
      data: clientes,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
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
        direccion: body.direccion || null,
        limiteCredito: parseFloat(body.limiteCredito || 0)
      }
    })
    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
