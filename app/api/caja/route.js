import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const actual = await prisma.caja.findFirst({ where: { estado: 'abierta' }, orderBy: { id: 'desc' } })
    const historial = await prisma.caja.findMany({ where: { estado: 'cerrada' }, orderBy: { cerradaEn: 'desc' }, take: 30 })
    return NextResponse.json({ actual, historial })
  } catch (e) {
    console.error('Error al obtener caja:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { montoInicial, usuario } = await req.json()

    // Verificar que no haya una caja abierta
    const abierta = await prisma.caja.findFirst({ where: { estado: 'abierta' } })
    if (abierta) return NextResponse.json({ error: 'Ya hay una caja abierta' }, { status: 400 })

    const caja = await prisma.caja.create({
      data: { usuarioApertura: usuario, montoInicial: parseFloat(montoInicial || 0) }
    })

    return NextResponse.json(caja, { status: 201 })
  } catch (e) {
    console.error('Error al abrir caja:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}