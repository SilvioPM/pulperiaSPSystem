import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const compras = await prisma.compra.findMany({
      include: {
        proveedor:   true,
        detalles:    { include: { producto: true } },
        abonosCompra: true
      },
      orderBy: { creadoEn: 'desc' }
    })
    return NextResponse.json(compras)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener compras' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body   = await request.json()
    const total  = await prisma.compra.count()
    const numero = `COM-${String(total + 1).padStart(5, '0')}`

    const esCredito      = body.esCredito || false
    const saldoPendiente = esCredito ? parseFloat(body.total) : 0
    const estado         = esCredito ? 'credito' : 'pagada'

    const compra = await prisma.compra.create({
      data: {
        numero,
        proveedorId:    parseInt(body.proveedorId),
        subtotal:       parseFloat(body.subtotal),
        iva:            parseFloat(body.iva || 0),
        total:          parseFloat(body.total),
        esCredito,
        saldoPendiente,
        estado,
        nota:           body.nota || null,
        detalles: {
          create: body.detalles.map(d => ({
            productoId: parseInt(d.productoId),
            cantidad:   parseFloat(d.cantidad),
            unidad:     d.unidad || 'unidad',
            costo:      parseFloat(d.costo),
            subtotal:   parseFloat(d.subtotal)
          }))
        }
      },
      include: {
        proveedor:    true,
        detalles:     { include: { producto: true } },
        abonosCompra: true
      }
    })

    // Actualizamos el stock e inventario
    for (const detalle of body.detalles) {
      const producto = await prisma.producto.findUnique({
        where: { id: parseInt(detalle.productoId) }
      })

      const esUnidadCompra = detalle.unidad === producto?.unidadCompra
      const cantidadBase   = esUnidadCompra
        ? parseFloat(detalle.cantidad) * (producto?.factorConversion || 1)
        : parseFloat(detalle.cantidad)

      await prisma.producto.update({
        where: { id: parseInt(detalle.productoId) },
        data:  {
          stock: { increment: cantidadBase },
          costo: parseFloat(detalle.costo)
        }
      })

      await prisma.movInventario.create({
        data: {
          productoId:       parseInt(detalle.productoId),
          tipo:             'entrada',
          cantidad:         cantidadBase,
          cantidadOriginal: parseFloat(detalle.cantidad),
          unidadOriginal:   detalle.unidad || 'unidad',
          motivo:           `Compra ${numero}`
        }
      })
    }

    return NextResponse.json(compra, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al registrar compra' }, { status: 500 })
  }
}