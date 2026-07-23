import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const id   = parseInt(params.id)
    const body = await request.json()

    const proforma = await prisma.proforma.update({
      where: { id },
      data:  { estado: body.estado }
    })
    return NextResponse.json(proforma)
  } catch (error) {
    return NextResponse.json({ error: 'Error al actualizar proforma' }, { status: 500 })
  }
}

export async function POST(request, { params }) {
  try {
    const cajaAbierta = await prisma.caja.findFirst({ where: { estado: 'abierta' } })
    if (!cajaAbierta) {
      return NextResponse.json({ error: 'No hay caja abierta. Abrí una caja antes de facturar.' }, { status: 400 })
    }

    const id       = parseInt(params.id)
    const proforma = await prisma.proforma.findUnique({
      where:   { id },
      include: { detalles: { include: { producto: true } }, cliente: true }
    })

    if (!proforma) {
      return NextResponse.json({ error: 'Proforma no encontrada' }, { status: 404 })
    }

    if (proforma.estado !== 'pendiente') {
      return NextResponse.json({ error: `La proforma ya está "${proforma.estado}". No se puede convertir.` }, { status: 400 })
    }

    for (const detalle of proforma.detalles) {
      if (detalle.producto.stock < detalle.cantidad) {
        return NextResponse.json({
          error: `Stock insuficiente para "${detalle.producto.nombre}". Disponible: ${detalle.producto.stock}, necesario: ${detalle.cantidad}`
        }, { status: 400 })
      }
    }

    const totalFacturas = await prisma.factura.count()
    const numero        = `FAC-${String(totalFacturas + 1).padStart(5, '0')}`

    const factura = await prisma.factura.create({
      data: {
        numero,
        clienteId:  proforma.clienteId,
        subtotal:   proforma.subtotal,
        iva:        proforma.iva,
        total:      proforma.total,
        pagoCon:    proforma.total,
        cambio:     0,
        metodoPago: 'efectivo',
        estado:     'pagada',
        detalles: {
          create: proforma.detalles.map(d => ({
            productoId: d.productoId,
            cantidad:   d.cantidad,
            precio:     d.precio,
            costo:      d.producto.costo || 0,
            subtotal:   d.subtotal
          }))
        }
      },
      include: {
        cliente:  true,
        detalles: { include: { producto: true } }
      }
    })

    for (const detalle of proforma.detalles) {
      await prisma.producto.update({
        where: { id: detalle.productoId },
        data:  { stock: { decrement: detalle.cantidad } }
      })
      await prisma.movInventario.create({
        data: {
          productoId:       detalle.productoId,
          tipo:             'salida',
          cantidad:         detalle.cantidad,
          cantidadOriginal: detalle.cantidad,
          unidadOriginal:   'unidad',
          motivo:           `Factura ${numero} desde Proforma ${proforma.numero}`
        }
      })
    }

    await prisma.caja.update({
      where: { id: cajaAbierta.id },
      data: {
        totalVendido:     { increment: proforma.total },
        ventasEfectivoCs: { increment: proforma.total },
      }
    })

    await prisma.proforma.update({
      where: { id },
      data:  { estado: 'aprobada' }
    })

    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al convertir proforma' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id)
    await prisma.detalleProforma.deleteMany({ where: { proformaId: id } })
    await prisma.proforma.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar proforma' }, { status: 500 })
  }
}
