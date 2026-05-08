import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const categorias = await prisma.categoria.findMany({
      orderBy: { nombre: 'asc' }
    })
    return NextResponse.json(categorias)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener categorías' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body     = await request.json()
    const categoria = await prisma.categoria.create({
      data: { nombre: body.nombre }
    })
    return NextResponse.json(categoria, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear categoría' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id'))

    const categoria = await prisma.categoria.findUnique({
      where: { id },
      include: { _count: { select: { productos: true } } }
    })

    if (!categoria) {
      return NextResponse.json({ error: 'Categoría no encontrada' }, { status: 404 })
    }

    if (categoria._count.productos > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar. Tiene ${categoria._count.productos} producto(s) asignado(s).` },
        { status: 400 }
      )
    }

    await prisma.categoria.delete({ where: { id } })
    return NextResponse.json({ ok: true })

  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar categoría' }, { status: 500 })
  }
}