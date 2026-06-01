import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — Obtener todos los productos
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const categoriaId = searchParams.get('categoriaId')

    const productos = await prisma.producto.findMany({
      where: {
        activo: true,
        ...(buscar && {
          nombre: { contains: buscar }
        }),
        ...(categoriaId && {
          categoriaId: parseInt(categoriaId)
        })
      },
      include: { categoria: true },
      orderBy: { nombre: 'asc' }
    })
    return NextResponse.json(productos)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener productos' }, { status: 500 })
  }
}

// POST — Crear un nuevo producto
export async function POST(request) {
  try {
    const body = await request.json()
    const producto = await prisma.producto.create({
      data: {
        nombre: body.nombre,
        codigo: body.codigo || null,
        precio: parseFloat(body.precio),
        costo: parseFloat(body.costo || 0),
        stock: parseInt(body.stock || 0),
        stockMinimo: parseInt(body.stockMinimo || 5),
        unidad: body.unidad || 'unidad',
        unidadBase: body.unidadBase || body.unidad || 'unidad',
        unidadCompra: body.unidadCompra || body.unidad || 'unidad',
        factorConversion: parseFloat(body.factorConversion || 1),
        precioMayor: parseFloat(body.precioMayor || 0),
        unidadVenta2: body.unidadVenta2 || null,
        precioVenta2: parseFloat(body.precioVenta2 || 0),
        factorVenta2: parseFloat(body.factorVenta2 || 1),
        categoriaId: parseInt(body.categoriaId)
      }
    })
    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}