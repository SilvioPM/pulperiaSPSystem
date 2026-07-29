import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { parseNumber } from '@/lib/number'

export async function PUT(request, { params }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await request.json()

    const existente = await prisma.compra.findUnique({
      where: { id },
      include: { detalles: { include: { producto: true } } }
    })
    if (!existente) return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    if (existente.estado === 'anulada') return NextResponse.json({ error: 'No se puede editar una compra anulada' }, { status: 400 })
    if (!body.detalles || !Array.isArray(body.detalles) || body.detalles.length === 0) {
      return NextResponse.json({ error: 'La compra debe tener al menos un detalle' }, { status: 400 })
    }

    const esBorrador = body.esBorrador !== false
    const esEditandoConfirmado = existente.estado !== 'borrador' && !esBorrador

    const compra = await prisma.$transaction(async (tx) => {
      if (esEditandoConfirmado) {
        const oldDetalles = existente.detalles
        for (const old of oldDetalles) {
          const oldFc = old.producto.factorConversion || 1
          const oldCantidadBase = old.cantidad * oldFc
          const newDetalle = (body.detalles || []).find(d => parseInt(d.productoId) === old.productoId)
          const newCantidad = newDetalle ? parseFloat(newDetalle.cantidad) : 0
          const newFc = (newDetalle ? parseFloat(newDetalle.factorConversion) : null) || old.producto.factorConversion || 1
          const newCantidadBase = newCantidad * newFc
          const diff = newCantidadBase - oldCantidadBase

          if (Math.abs(diff) > 0.001) {
            await tx.producto.update({
              where: { id: old.productoId },
              data: { stock: { increment: diff } }
            })
            await tx.movInventario.create({
              data: {
                productoId: old.productoId,
                tipo: diff > 0 ? 'entrada' : 'salida',
                cantidad: Math.abs(diff),
                cantidadOriginal: Math.abs(newCantidad - old.cantidad),
                unidadOriginal: old.unidad,
                motivo: `Ajuste edición compra ${existente.numero}`
              }
            })
          }
        }

        for (const detalle of (body.detalles || [])) {
          const oldDetalle = oldDetalles.find(d => d.productoId === parseInt(detalle.productoId))
          if (!oldDetalle) {
            const producto = await tx.producto.findUnique({ where: { id: parseInt(detalle.productoId) } })
            if (!producto) throw new Error(`Producto ID ${detalle.productoId} no encontrado`)
            const fc = parseFloat(detalle.factorConversion) || producto.factorConversion || 1
            const cantidadBase = parseFloat(detalle.cantidad) * fc
            await tx.producto.update({
              where: { id: parseInt(detalle.productoId) },
              data: { stock: { increment: cantidadBase } }
            })
            await tx.movInventario.create({
              data: {
                productoId: parseInt(detalle.productoId),
                tipo: 'entrada',
                cantidad: cantidadBase,
                cantidadOriginal: parseFloat(detalle.cantidad),
                unidadOriginal: detalle.unidad || 'unidad',
                motivo: `Ajuste edición compra ${existente.numero}`
              }
            })
          }
        }
      }

      await tx.detalleCompra.deleteMany({ where: { compraId: id } })

      const esCredito = body.esCredito || false

      const totalAbonado = esEditandoConfirmado
        ? (await tx.abonoCompra.aggregate({ where: { compraId: id }, _sum: { monto: true } }))._sum.monto || 0
        : 0

      const actualizada = await tx.compra.update({
        where: { id },
        data: {
          facturaProveedor: body.facturaProveedor || null,
          proveedorId: parseInt(body.proveedorId),
          subtotal: parseNumber(body.subtotal || 0),
          iva: parseNumber(body.iva || 0),
          total: parseNumber(body.total),
          esCredito,
          saldoPendiente: esBorrador ? 0 : (esCredito ? Math.max(0, parseNumber(body.total) - totalAbonado) : 0),
          estado: esBorrador ? 'borrador' : (esCredito ? 'credito' : 'pagada'),
          fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
          nota: body.nota || null,
          detalles: {
            create: (body.detalles || []).map(d => ({
              productoId: parseInt(d.productoId),
              cantidad: parseFloat(d.cantidad),
              unidad: d.unidad || 'unidad',
              costo: parseFloat(d.costo),
              subtotal: parseFloat(d.subtotal)
            }))
          }
        },
        include: { proveedor: true, detalles: { include: { producto: true } }, abonos: true }
      })

      if (!esBorrador && !esEditandoConfirmado) {
        for (const detalle of (body.detalles || [])) {
          const producto = await tx.producto.findUnique({ where: { id: parseInt(detalle.productoId) } })
          if (!producto) throw new Error(`Producto ID ${detalle.productoId} no encontrado`)

          const fc = parseFloat(detalle.factorConversion) || producto.factorConversion || 1
          const cantidadBase = parseFloat(detalle.cantidad) * fc

          const updateData = {
            stock: { increment: cantidadBase },
            unidadBase: detalle.unidadVenta || producto.unidadBase,
            unidadCompra: detalle.unidadCompra || producto.unidadCompra,
            factorConversion: fc,
            costo: parseFloat(detalle.costo) / fc
          }
          if (producto.unidadVenta2 && detalle.unidad === producto.unidadVenta2) {
            updateData.costoVenta2 = parseFloat(detalle.costo)
          }
          if (producto.unidadVenta3 && detalle.unidad === producto.unidadVenta3) {
            updateData.costoVenta3 = parseFloat(detalle.costo)
          }
          if (producto.unidadVenta4 && detalle.unidad === producto.unidadVenta4) {
            updateData.costoVenta4 = parseFloat(detalle.costo)
          }
          if (detalle.fechaVencimiento) {
            updateData.fechaVencimiento = new Date(detalle.fechaVencimiento)
          }
          await tx.producto.update({ where: { id: parseInt(detalle.productoId) }, data: updateData })

          await tx.movInventario.create({
            data: {
              productoId: parseInt(detalle.productoId),
              tipo: 'entrada',
              cantidad: cantidadBase,
              cantidadOriginal: parseFloat(detalle.cantidad),
              unidadOriginal: detalle.unidadCompra || detalle.unidad || 'unidad',
              motivo: `Compra ${existente.numero}`
            }
          })
        }
      }

      return actualizada
    })

    return NextResponse.json(compra)
  } catch (error) {
    console.error('Error al editar compra:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const existente = await prisma.compra.findUnique({ where: { id } })
    if (!existente) return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    if (existente.estado !== 'borrador') return NextResponse.json({ error: 'Solo se pueden eliminar compras en borrador' }, { status: 400 })

    await prisma.detalleCompra.deleteMany({ where: { compraId: id } })
    await prisma.compra.delete({ where: { id } })

    return NextResponse.json({ ok: true, eliminado: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar compra' }, { status: 500 })
  }
}
