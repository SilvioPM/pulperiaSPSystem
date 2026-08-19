import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { sanitizarEntrada } from '@/lib/sanitizar'
import { parseNumber } from '@/lib/number'

export async function PUT(request, { params }) {
  try {
    const id   = parseInt(params.id)
    const body = sanitizarEntrada(await request.json(), 100)

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
      if (detalle.producto.esGenerico) continue
      if (detalle.producto.stock < detalle.cantidad) {
        return NextResponse.json({
          error: `Stock insuficiente para "${detalle.producto.nombre}". Disponible: ${detalle.producto.stock}, necesario: ${detalle.cantidad}`
        }, { status: 400 })
      }
    }

    const cajaAbierta = await prisma.caja.findFirst({ where: { estado: 'abierta' } })
    if (!cajaAbierta) {
      return NextResponse.json({ error: 'No hay caja abierta. Abrí una caja antes de facturar.' }, { status: 400 })
    }

    // Número de factura atómico (usar el mismo patrón que facturas/route.js)
    const ultimaFactura = await prisma.factura.findFirst({ orderBy: { id: 'desc' }, select: { numero: true } })
    let secuencia = 1
    if (ultimaFactura?.numero) {
      const partes = ultimaFactura.numero.split('-')
      secuencia = parseInt(partes[1] || '0') + 1
    }
    const numero = `FAC-${String(secuencia).padStart(5, '0')}`

    const factura = await prisma.$transaction(async (tx) => {
      // Crear factura
      const creada = await tx.factura.create({
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
              subtotal:   d.subtotal,
              factorConversion: d.factorConversion || 1,
              unidadVenta: d.unidad || null,
              comboId: d.comboId || null,
            }))
          }
        },
        include: {
          cliente:  true,
          detalles: { include: { producto: true } }
        }
      })

      // Descontar stock y registrar movimientos
      for (const detalle of proforma.detalles) {
        if (detalle.producto.esGenerico) continue

        await tx.producto.update({
          where: { id: detalle.productoId },
          data:  { stock: { decrement: detalle.cantidad } }
        })
        await tx.movInventario.create({
          data: {
            productoId:       detalle.productoId,
            tipo:             'salida',
            cantidad:         detalle.cantidad,
            cantidadOriginal: detalle.cantidad,
            unidadOriginal:   detalle.unidad || 'unidad',
            motivo:           `Factura ${numero} desde Proforma ${proforma.numero}`
          }
        })
      }

      // Actualizar caja
      await tx.caja.update({
        where: { id: cajaAbierta.id },
        data: {
          totalVendido:     { increment: proforma.total },
          ventasEfectivoCs: { increment: proforma.total },
        }
      })

      // Marcar proforma como aprobada
      await tx.proforma.update({
        where: { id },
        data:  { estado: 'aprobada' }
      })

      // Auditoría
      await tx.auditoria.create({
        data: {
          usuario: 'sistema',
          accion: 'convertir',
          entidad: 'proforma',
          detalle: `Proforma #${proforma.numero} convertida a Factura #${numero}`
        }
      })

      return creada
    })

    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    console.error('Error al convertir proforma:', error)
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
