import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// PUT — Editar un producto
export async function PUT(request, { params }) {
  try {
    const { id: idStr } = await params
    const id   = parseInt(idStr)
    const body = await request.json()

    const data = {
      nombre:      body.nombre,
      codigo:      body.codigo || null,
      precio:      parseFloat(body.precio),
      costo:       parseFloat(body.costo || 0),
      stock:       parseInt(body.stock || 0),
      stockMinimo: parseInt(body.stockMinimo || 5),
      unidad:      body.unidad || 'unidad',
      unidadBase:  body.unidadBase || body.unidad || 'unidad',
      unidadCompra: body.unidadCompra || body.unidad || 'unidad',
      factorConversion: parseFloat(body.factorConversion || 1),
      precioMayor: parseFloat(body.precioMayor || 0),
      cantidadMinimaMayor: parseFloat(body.cantidadMinimaMayor || 0),
      unidadVenta2: body.unidadVenta2 || null,
      precioVenta2: parseFloat(body.precioVenta2 || 0),
      costoVenta2: parseFloat(body.costoVenta2 || 0),
      factorVenta2: parseFloat(body.factorVenta2 || 1),
      unidadVenta3: body.unidadVenta3 || null,
      precioVenta3: parseFloat(body.precioVenta3 || 0),
      costoVenta3: parseFloat(body.costoVenta3 || 0),
      factorVenta3: parseFloat(body.factorVenta3 || 1),
      unidadVenta4: body.unidadVenta4 || null,
      precioVenta4: parseFloat(body.precioVenta4 || 0),
      costoVenta4: parseFloat(body.costoVenta4 || 0),
      factorVenta4: parseFloat(body.factorVenta4 || 1),
      categoriaId: parseInt(body.categoriaId),
      esGenerico: body.esGenerico === true,
      fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : body.fechaVencimiento === null ? null : undefined,
    }
    // Limpiar undefined fields
    Object.keys(data).forEach(k => data[k] === undefined && delete data[k])
    if (body.activo !== undefined) data.activo = body.activo

    // Manejar códigos alias: eliminar existentes, crear nuevos
    const codigosAlias = Array.isArray(body.codigosAlias) ? body.codigosAlias.filter(c => c?.trim()) : []
    if (body.codigosAlias !== undefined) {
      await prisma.productoCodigo.deleteMany({ where: { productoId: id } })
      if (codigosAlias.length > 0) {
        await prisma.productoCodigo.createMany({
          data: codigosAlias.map(c => ({ codigo: c, productoId: id }))
        })
      }
    }

    const producto = await prisma.producto.update({
      where: { id },
      data,
      include: { codigosAlias: true }
    })
    return NextResponse.json(producto)
  } catch (error) {
    return NextResponse.json({ error: 'Error al editar producto' }, { status: 500 })
  }
}

// DELETE — Eliminar un producto (o marcarlo inactivo si tiene movimientos)
export async function DELETE(request, { params }) {
  try {
    const { id: idStr } = await params
    const id = parseInt(idStr)

    const ventas = await prisma.detalleFac.count({ where: { productoId: id } })
    const compras = await prisma.detalleCompra.count({ where: { productoId: id } })
    const proformas = await prisma.detalleProforma.count({ where: { productoId: id } })

    // Si tiene ventas o compras, no se puede eliminar — se marca inactivo
    if (ventas > 0 || compras > 0) {
      await prisma.producto.update({
        where: { id },
        data: { activo: false }
      })
      return NextResponse.json({ ok: true, inactivado: true, motivo: `Tiene ${ventas + compras} movimiento(s). Se marcó como inactivo.` })
    }

    if (proformas > 0) {
      await prisma.detalleProforma.deleteMany({ where: { productoId: id } })
    }

    await prisma.movInventario.deleteMany({ where: { productoId: id } })
    await prisma.producto.delete({ where: { id } })

    return NextResponse.json({ ok: true, eliminado: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}