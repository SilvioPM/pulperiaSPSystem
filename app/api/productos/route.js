import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — Obtener todos los productos (con paginación)
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const categoriaId = searchParams.get('categoriaId')
    const incluirInactivos = searchParams.get('incluirInactivos') === 'true'
    const vencer = parseInt(searchParams.get('vencer') || 0)
    const vencidos = searchParams.get('vencidos') === 'true'
    const page = Math.max(1, parseInt(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || 50)))

    const where = {
      ...(incluirInactivos ? {} : { activo: true }),
      ...(buscar && {
        OR: [
          { nombre: { contains: buscar, mode: 'insensitive' } },
          { codigo: { contains: buscar, mode: 'insensitive' } }
        ]
      }),
      ...(categoriaId && { categoriaId: parseInt(categoriaId) }),
      ...(vencer > 0 && {
        fechaVencimiento: {
          not: null,
          lte: new Date(Date.now() + vencer * 24 * 60 * 60 * 1000),
          gte: vencidos ? undefined : new Date()
        }
      }),
      ...(vencidos && !vencer ? { fechaVencimiento: { not: null, lt: new Date() } } : {})
    }

    const [productos, total] = await Promise.all([
      prisma.producto.findMany({
        where,
        include: { categoria: true },
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.producto.count({ where })
    ])

    return NextResponse.json({
      data: productos,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
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
        fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null
      }
    })
    return NextResponse.json(producto, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear producto' }, { status: 500 })
  }
}