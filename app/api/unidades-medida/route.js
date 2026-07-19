import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const unidades = await prisma.unidadMedida.findMany({
      orderBy: { nombre: 'asc' }
    })
    return NextResponse.json(unidades)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener unidades' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    const nombre = String(body.nombre || '').trim()
    if (!nombre) return NextResponse.json({ error: 'El nombre es requerido' }, { status: 400 })
    const existe = await prisma.unidadMedida.findUnique({ where: { nombre } })
    if (existe) {
      if (!existe.activo) {
        const unidad = await prisma.unidadMedida.update({ where: { id: existe.id }, data: { activo: true } })
        return NextResponse.json(unidad)
      }
      return NextResponse.json({ error: 'Ya existe esa unidad' }, { status: 400 })
    }
    const unidad = await prisma.unidadMedida.create({ data: { nombre } })
    return NextResponse.json(unidad)
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear unidad' }, { status: 500 })
  }
}

export async function PUT(request) {
  try {
    const body = await request.json()
    const id = parseInt(body.id)
    const nombre = String(body.nombre || '').trim()
    if (!id || !nombre) return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    const existe = await prisma.unidadMedida.findUnique({ where: { id } })
    if (!existe) return NextResponse.json({ error: 'Unidad no encontrada' }, { status: 404 })
    const duplicado = await prisma.unidadMedida.findUnique({ where: { nombre } })
    if (duplicado && duplicado.id !== id) return NextResponse.json({ error: 'Ya existe otra unidad con ese nombre' }, { status: 400 })
    const unidad = await prisma.unidadMedida.update({ where: { id }, data: { nombre } })
    return NextResponse.json(unidad)
  } catch (error) {
    return NextResponse.json({ error: 'Error al editar unidad' }, { status: 500 })
  }
}

export async function DELETE(request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = parseInt(searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 })
    await prisma.unidadMedida.update({ where: { id }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar unidad' }, { status: 500 })
  }
}
