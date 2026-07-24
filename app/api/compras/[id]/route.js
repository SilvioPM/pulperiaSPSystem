import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function PUT(request, { params }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)
    const body = await request.json()

    const existente = await prisma.compra.findUnique({ where: { id } })
    if (!existente) return NextResponse.json({ error: 'Compra no encontrada' }, { status: 404 })
    if (existente.estado !== 'borrador') return NextResponse.json({ error: 'Solo se pueden editar compras en borrador' }, { status: 400 })
    if (!body.detalles || !Array.isArray(body.detalles) || body.detalles.length === 0) {
      return NextResponse.json({ error: 'La compra debe tener al menos un detalle' }, { status: 400 })
    }

    const compra = await prisma.$transaction(async (tx) => {
      await tx.detalleCompra.deleteMany({ where: { compraId: id } })

      const esBorrador = body.esBorrador !== false
      const esCredito = body.esCredito || false

      const actualizada = await tx.compra.update({
        where: { id },
        data: {
          facturaProveedor: body.facturaProveedor || null,
          proveedorId: parseInt(body.proveedorId),
          subtotal: parseFloat(body.subtotal || 0),
          iva: parseFloat(body.iva || 0),
          total: parseFloat(body.total),
          esCredito,
          saldoPendiente: esBorrador ? 0 : (esCredito ? parseFloat(body.total) : 0),
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

      if (!esBorrador) {
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
