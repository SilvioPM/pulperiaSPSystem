import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — Obtener todas las facturas
export async function GET() {
  try {
    const facturas = await prisma.factura.findMany({
      include: {
        cliente: true,
        detalles: { include: { producto: true } }
      },
      orderBy: { creadoEn: 'desc' },
      take: 50
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
        detalles: {
          create: body.detalles.map(d => ({
            productoId: d.productoId,
            cantidad: d.cantidad,
            precio: d.precio,
            subtotal: d.subtotal
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
      await prisma.producto.update({
        where: { id: detalle.productoId },
        data: { stock: { decrement: detalle.cantidad } }
      })

      // Registramos el movimiento en el historial
      await prisma.movInventario.create({
        data: {
          productoId: detalle.productoId,
          tipo: 'salida',
          cantidad: detalle.cantidad,
          motivo: `Venta ${numero}`
        }
      })
    }

    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 })
  }
}