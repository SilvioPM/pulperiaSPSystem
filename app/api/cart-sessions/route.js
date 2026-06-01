import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET - listar todos los tickets en espera
export async function GET() {
  try {
    const sessions = await prisma.cartSession.findMany({
      orderBy: { creadoEn: 'desc' }
    })
    // Normalizar data por si tiene doble stringify (bug anterior)
    const normalizados = sessions.map(s => {
      let parsed = s.data
      try { parsed = JSON.parse(s.data); if (typeof parsed === 'string') parsed = JSON.parse(parsed) } catch {}
      return { ...s, data: typeof parsed === 'object' && parsed !== null ? JSON.stringify(parsed) : s.data }
    })
    return NextResponse.json(normalizados)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener tickets' }, { status: 500 })
  }
}

// POST - guardar un ticket en espera
export async function POST(req) {
  try {
    const { nombre, data } = await req.json()
    const session = await prisma.cartSession.create({
      data: { nombre, data: JSON.stringify(data) }
    })
    return NextResponse.json(session, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar ticket' }, { status: 500 })
  }
}

// DELETE - eliminar un ticket en espera
export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url)
    const id = Number(searchParams.get('id'))
    if (!id) return NextResponse.json({ error: 'ID inválido' }, { status: 400 })
    await prisma.cartSession.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al eliminar ticket' }, { status: 500 })
  }
}
