import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { calcularCajaStats } from '@/lib/cajaStats'
import { sanitizarEntrada } from '@/lib/sanitizar'

export async function GET() {
  try {
    const actual = await prisma.caja.findFirst({
      where: { estado: 'abierta' },
      orderBy: { id: 'desc' },
      include: { arqueo: true, movimientos: { orderBy: { creadoEn: 'desc' } } }
    })
    let actualConStats = null
    if (actual) {
      const stats = await calcularCajaStats(actual)
      actualConStats = { ...actual, ...stats, ventasCredito: 0 }
    }
    const historial = await prisma.caja.findMany({
      where: { estado: 'cerrada' },
      orderBy: { cerradaEn: 'desc' },
      take: 30,
      include: { arqueo: true, movimientos: { orderBy: { creadoEn: 'desc' } } }
    })
    const historialConStats = await Promise.all(historial.map(async h => {
      const stats = await calcularCajaStats(h)
      return { ...h, ...stats }
    }))
    return NextResponse.json({ actual: actualConStats, historial: historialConStats })
  } catch (e) {
    console.error('Error al obtener caja:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = sanitizarEntrada(await req.json(), 200)
    const { montoInicial, montoInicialUs, usuario } = body

    // Abrir caja en transacción con lock para evitar carrera
    const caja = await prisma.$transaction(async (tx) => {
      // Verificar que no haya una caja abierta (dentro de la transacción con lock)
      const abierta = await tx.caja.findFirst({ where: { estado: 'abierta' } })
      if (abierta) throw new Error('Ya hay una caja abierta')

      return await tx.caja.create({
        data: { usuarioApertura: usuario, montoInicial: parseFloat(montoInicial || 0), montoInicialUs: parseFloat(montoInicialUs || 0) }
      })
    })

    return NextResponse.json(caja, { status: 201 })
  } catch (e) {
    if (e.message === 'Ya hay una caja abierta') {
      return NextResponse.json({ error: e.message }, { status: 400 })
    }
    console.error('Error al abrir caja:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}