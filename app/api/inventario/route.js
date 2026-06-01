import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — Historial de movimientos
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

    const movimientos = await prisma.movInventario.findMany({
      where,
      include: { producto: true },
      orderBy: { creadoEn: 'desc' }
    })
    return NextResponse.json(movimientos)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener movimientos' }, { status: 500 })
  }
}

// POST — Agregar o quitar stock manualmente
export async function POST(request) {
  try {
    const body = await request.json()

    // Actualizamos el stock del producto
    const producto = await prisma.producto.update({
      where: { id: parseInt(body.productoId) },
      data: {
        stock: body.tipo === 'entrada'
          ? { increment: parseInt(body.cantidad) }
          : { decrement: parseInt(body.cantidad) }
      }
    })

    // Guardamos el movimiento en el historial
    const movimiento = await prisma.movInventario.create({
      data: {
        productoId: parseInt(body.productoId),
        tipo: body.tipo,
        cantidad: parseInt(body.cantidad),
        motivo: body.motivo || null
      }
    })

    return NextResponse.json({ producto, movimiento }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar movimiento' }, { status: 500 })
  }
}