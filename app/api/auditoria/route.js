import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get('pagina') || '1')
    const limit = parseInt(searchParams.get('limite') || '100')
    const usuario = searchParams.get('usuario')
    const accion = searchParams.get('accion')
    const entidad = searchParams.get('entidad')
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

    const where = {}
    if (usuario) where.usuario = { contains: usuario, mode: 'insensitive' }
    if (accion) where.accion = accion
    if (entidad) where.entidad = entidad
    if (desde || hasta) {
      where.createdAt = {}
      if (desde) where.createdAt.gte = new Date(desde)
      if (hasta) where.createdAt.lte = new Date(hasta + 'T23:59:59.999Z')
    }

    const [total, rows] = await Promise.all([
      prisma.auditoria.count({ where }),
      prisma.auditoria.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      })
    ])

    return NextResponse.json({ rows, total, pagina: page, totalPaginas: Math.ceil(total / limit) })
  } catch (e) {
    console.error('Error al obtener auditoría:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const registro = await prisma.auditoria.create({
      data: {
        usuario: body.usuario,
        accion: body.accion,
        entidad: body.entidad,
        detalle: body.detalle || null
      }
    })
    return NextResponse.json(registro)
  } catch (e) {
    console.error('Error al crear registro de auditoría:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}