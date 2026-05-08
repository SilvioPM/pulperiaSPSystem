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

    // Verificamos si tiene ventas registradas
    const ventas = await prisma.detalleFac.count({
      where: { productoId: id }
    })

    if (ventas > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar. Tiene ${ventas} venta(s) registrada(s).` },
        { status: 400 }
      )
    }

    // Borramos movimientos de inventario primero
    await prisma.movInventario.deleteMany({ where: { productoId: id } })
    await prisma.producto.delete({ where: { id } })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar producto' }, { status: 500 })
  }
}