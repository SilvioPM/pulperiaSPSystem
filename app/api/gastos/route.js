import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const categoria = searchParams.get('categoria')
    const page = Math.max(1, parseInt(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || 50)))

    const where = {}
    if (desde || hasta) {
      where.fecha = {}
      if (desde) where.fecha.gte = new Date(desde)
      if (hasta) {
        const h = new Date(hasta)
        h.setHours(23, 59, 59, 999)
        where.fecha.lte = h
      }
    }
    if (categoria) where.categoria = categoria

    const [gastos, total] = await Promise.all([
      prisma.gasto.findMany({ where, orderBy: { fecha: 'desc' }, skip: (page - 1) * limit, take: limit }),
      prisma.gasto.count({ where })
    ])

    return NextResponse.json({ data: gastos, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener gastos' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const metodoPago = body.metodoPago || 'efectivo'
    const gasto = await prisma.gasto.create({
      data: {
        concepto: body.concepto,
        categoria: body.categoria || 'Operativos',
        monto: parseFloat(body.monto),
        fecha: new Date(body.fecha),
        metodoPago,
        nota: body.nota || null,
      }
    })
    // Solo descalfar de caja si el método de pago es efectivo
    const caja = metodoPago === 'efectivo' ? await prisma.caja.findFirst({ where: { estado: 'abierta' } }) : null
    if (caja) {
      await prisma.movimientoCaja.create({
        data: {
          cajaId: caja.id,
          tipo: 'salida',
          concepto: `Gasto #${gasto.id}: ${gasto.concepto}`,
          moneda: 'C$',
          monto: gasto.monto
        }
      })
      await prisma.caja.update({
        where: { id: caja.id },
        data: { egresos: { increment: gasto.monto } }
      })
    }
    return NextResponse.json(gasto, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear gasto' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = parseInt(searchParams.get('id'))
    // Revertir egreso de caja si existe
    const mov = await prisma.movimientoCaja.findFirst({
      where: { concepto: { startsWith: `Gasto #${id}:` } }
    })
    if (mov) {
      await prisma.caja.update({
        where: { id: mov.cajaId },
        data: { egresos: { decrement: mov.monto } }
      })
      await prisma.movimientoCaja.delete({ where: { id: mov.id } })
    }
    await prisma.gasto.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar gasto' }, { status: 500 })
  }
}
