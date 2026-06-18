import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

    const where = {}
    if (desde || hasta) {
      where.creadoEn = {}
      if (desde) where.creadoEn.gte = new Date(desde)
      if (hasta) {
        const h = new Date(hasta)
        h.setHours(23, 59, 59, 999)
        where.creadoEn.lte = h
      }
    }

    const [proformas, total] = await Promise.all([
      prisma.proforma.findMany({
        where,
        include: {
          cliente:  true,
          detalles: { include: { producto: true } }
        },
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.proforma.count({ where })
    ])

    return NextResponse.json({ data: proformas, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener proformas' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    if (!body.detalles || !Array.isArray(body.detalles) || body.detalles.length === 0) {
      return NextResponse.json({ error: 'La proforma debe tener al menos un detalle' }, { status: 400 })
    }

    const proforma = await prisma.$transaction(async (tx) => {
      const ultima = await tx.proforma.findFirst({ orderBy: { id: 'desc' }, select: { numero: true } })
      let secuencia = 1
      if (ultima?.numero) {
        const partes = ultima.numero.split('-')
        secuencia = parseInt(partes[1] || '0') + 1
      }
      const numero = `PRO-${String(secuencia).padStart(5, '0')}`

      return await tx.proforma.create({
        data: {
          numero,
          clienteId: body.clienteId ? parseInt(body.clienteId) : null,
          subtotal: parseFloat(body.subtotal),
          iva: parseFloat(body.iva || 0),
          total: parseFloat(body.total),
          nota: body.nota || null,
          validoHasta: body.validoHasta ? new Date(body.validoHasta) : null,
          estado: 'pendiente',
          detalles: {
            create: body.detalles.map(d => ({
              productoId: parseInt(d.productoId),
              cantidad: parseFloat(d.cantidad),
              precio: parseFloat(d.precio),
              subtotal: parseFloat(d.subtotal)
            }))
          }
        },
        include: {
          cliente: true,
          detalles: { include: { producto: true } }
        }
      })
    })

    return NextResponse.json(proforma, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear proforma' }, { status: 500 })
  }
}