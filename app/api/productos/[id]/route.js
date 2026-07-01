import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// PUT — Editar un producto
export async function PUT(request, { params }) {
  try {
    const id   = parseInt(params.id)
    const body = await request.json()

    const producto = await prisma.producto.update({
      where: { id },
      data: {
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
        unidadVenta2: body.unidadVenta2 || null,
        precioVenta2: parseFloat(body.precioVenta2 || 0),
        costoVenta2: parseFloat(body.costoVenta2 || 0),
        factorVenta2: parseFloat(body.factorVenta2 || 1),
        categoriaId: parseInt(body.categoriaId)
      }
    })
    return NextResponse.json(producto)
  } catch (error) {
    return NextResponse.json({ error: 'Error al editar producto' }, { status: 500 })
  }
}

// DELETE — Eliminar un producto
export async function DELETE(request, { params }) {
  try {
    const id = parseInt(params.id)

    // Verificamos si tiene ventas o compras registradas
    const ventas = await prisma.detalleFac.count({ where: { productoId: id } })
    const compras = await prisma.detalleCompra.count({ where: { productoId: id } })
    const proformas = await prisma.detalleProforma.count({ where: { productoId: id } })

    if (ventas > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar. Tiene ${ventas} venta(s) registrada(s).` },
        { status: 400 }
      )
    }
    if (compras > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar. Tiene ${compras} compra(s) registrada(s).` },
        { status: 400 }
      )
    }
    if (proformas > 0) {
      await prisma.detalleProforma.deleteMany({ where: { productoId: id } })
    }

    // Borramos movimientos de inventario primero
    await prisma.movInventario.deleteMany({ where: { productoId: id } })
    await prisma.producto.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}