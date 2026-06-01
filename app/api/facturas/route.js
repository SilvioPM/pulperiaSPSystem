import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — Obtener todas las facturas
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

    const facturas = await prisma.factura.findMany({
      where,
      include: {
        cliente: true,
        detalles: { include: { producto: true } }
      },
      orderBy: { creadoEn: 'desc' }
    })
    return NextResponse.json(facturas)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 })
  }
}

// POST — Crear una nueva factura (venta)
export async function POST(request) {
  try {
    const body = await request.json()

    // Generamos número de factura automático
    const total = await prisma.factura.count()
    const numero = `FAC-${String(total + 1).padStart(5, '0')}`

    // Creamos la factura con todos sus detalles en una sola operación
    const esCredito = body.esCredito || false
    const factura = await prisma.factura.create({
      data: {
        numero,
        clienteId: body.clienteId || null,
        subtotal: parseFloat(body.subtotal),
        descuento: parseFloat(body.descuento || 0),
        iva: parseFloat(body.iva || 0),
        total: parseFloat(body.total),
        pagoCon: parseFloat(body.pagoCon || 0),
        cambio: parseFloat(body.cambio || 0),
        metodoPago: body.metodoPago || 'efectivo',
        esCredito,
        saldoPendiente: esCredito ? parseFloat(body.total) : 0,
        estado: esCredito ? 'credito' : 'pagada',
        detalles: {
          create: body.detalles.map(d => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            unidadVenta: d.unidadVenta || null,
            precio: d.precio,
            costo: parseFloat(d.costo || 0),
            subtotal: d.subtotal,
            factorConversion: parseFloat(d.factorConversion || 1)
          }))
        }
      },
      include: {
        detalles: { include: { producto: true } },
        cliente: true
      }
    })

    // Descontamos el stock de cada producto vendido
    for (const detalle of body.detalles) {
      const factor = detalle.factorConversion || 1
      const cantidadBase = detalle.cantidad * factor

      await prisma.producto.update({
        where: { id: detalle.productoId },
        data: { stock: { decrement: cantidadBase } }
      })

      // Registramos el movimiento en el historial
      await prisma.movInventario.create({
        data: {
          productoId: detalle.productoId,
          tipo: 'salida',
          cantidad: cantidadBase,
          cantidadOriginal: detalle.cantidad,
          unidadOriginal: detalle.unidadVenta || null,
          motivo: `Venta ${numero}`
        }
      })
    }

    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 })
  }
}