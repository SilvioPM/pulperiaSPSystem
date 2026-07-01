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

    const [compras, total] = await Promise.all([
      prisma.compra.findMany({
        where,
        include: {
          proveedor:   true,
          detalles:    { include: { producto: true } },
          abonos: true
        },
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.compra.count({ where })
    ])

    return NextResponse.json({ data: compras, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener compras' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    if (!body.detalles || !Array.isArray(body.detalles) || body.detalles.length === 0) {
      return NextResponse.json({ error: 'La compra debe tener al menos un detalle' }, { status: 400 })
    }

    const compra = await prisma.$transaction(async (tx) => {
      const ultima = await tx.compra.findFirst({ orderBy: { id: 'desc' }, select: { numero: true } })
      let secuencia = 1
      if (ultima?.numero) {
        const partes = ultima.numero.split('-')
        secuencia = parseInt(partes[1] || '0') + 1
      }
      const numero = `COM-${String(secuencia).padStart(5, '0')}`

      const esCredito = body.esCredito || false
      const creada = await tx.compra.create({
        data: {
          numero,
          proveedorId: parseInt(body.proveedorId),
          subtotal: parseFloat(body.subtotal),
          iva: parseFloat(body.iva || 0),
          total: parseFloat(body.total),
          esCredito,
          saldoPendiente: esCredito ? parseFloat(body.total) : 0,
          estado: esCredito ? 'credito' : 'pagada',
          fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
          nota: body.nota || null,
          detalles: {
            create: body.detalles.map(d => ({
              productoId: parseInt(d.productoId),
              cantidad: parseFloat(d.cantidad),
              unidad: d.unidad || 'unidad',
              costo: parseFloat(d.costo),
              subtotal: parseFloat(d.subtotal)
            }))
          }
        },
        include: {
          proveedor: true,
          detalles: { include: { producto: true } },
          abonos: true
        }
      })

      for (const detalle of body.detalles) {
        const producto = await tx.producto.findUnique({ where: { id: parseInt(detalle.productoId) } })
        if (!producto) throw new Error(`Producto ID ${detalle.productoId} no encontrado`)

        const esUnidadCompra = detalle.unidad === producto.unidadCompra
        const cantidadBase = esUnidadCompra
          ? parseFloat(detalle.cantidad) * (producto.factorConversion || 1)
          : parseFloat(detalle.cantidad)

        const updateData = {
          stock: { increment: cantidadBase },
          costo: esUnidadCompra
            ? parseFloat(detalle.costo) / (producto.factorConversion || 1)
            : parseFloat(detalle.costo)
        }
        // Si la unidad de compra coincide con unidadVenta2, actualizar costoVenta2
        if (producto.unidadVenta2 && detalle.unidad === producto.unidadVenta2) {
          updateData.costoVenta2 = parseFloat(detalle.costo)
        }
        await tx.producto.update({
          where: { id: parseInt(detalle.productoId) },
          data: updateData
        })

        await tx.movInventario.create({
          data: {
            productoId: parseInt(detalle.productoId),
            tipo: 'entrada',
            cantidad: cantidadBase,
            cantidadOriginal: parseFloat(detalle.cantidad),
            unidadOriginal: detalle.unidad || 'unidad',
            motivo: `Compra ${numero}`
          }
        })
      }

      return creada
    })

    return NextResponse.json(compra, { status: 201 })
  } catch (error) {
    console.error('Error al registrar compra:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
