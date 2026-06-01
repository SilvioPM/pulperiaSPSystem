import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')

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

    const proformas = await prisma.proforma.findMany({
      where,
      include: {
        cliente:  true,
        detalles: { include: { producto: true } }
      },
      orderBy: { creadoEn: 'desc' }
    })
    return NextResponse.json(proformas)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener proformas' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body   = await request.json()
    const total  = await prisma.proforma.count()
    const numero = `PRO-${String(total + 1).padStart(5, '0')}`

    const proforma = await prisma.proforma.create({
      data: {
        numero,
        clienteId:   body.clienteId || null,
        subtotal:    parseFloat(body.subtotal),
        iva:         parseFloat(body.iva || 0),
        total:       parseFloat(body.total),
        nota:        body.nota || null,
        validoHasta: body.validoHasta ? new Date(body.validoHasta) : null,
        estado:      'pendiente',
        detalles: {
          create: body.detalles.map(d => ({
            productoId: d.productoId,
            cantidad:   d.cantidad,
            precio:     d.precio,
            subtotal:   d.subtotal
          }))
        }
      },
      include: {
        cliente:  true,
        detalles: { include: { producto: true } }
      }
    })
    return NextResponse.json(proforma, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear proforma' }, { status: 500 })
  }
}