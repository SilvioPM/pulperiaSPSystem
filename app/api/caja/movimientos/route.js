import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const caja = await prisma.caja.findFirst({ where: { estado: 'abierta' }, orderBy: { id: 'desc' } })
    if (!caja) return NextResponse.json([])
    const movimientos = await prisma.movimientoCaja.findMany({ where: { cajaId: caja.id }, orderBy: { creadoEn: 'desc' } })
    return NextResponse.json(movimientos)
  } catch (e) {
    console.error('Error al obtener movimientos:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { tipo, concepto, moneda, monto } = await req.json()
    if (!tipo || !concepto || !moneda || monto === undefined) {
      return NextResponse.json({ error: 'Todos los campos son requeridos' }, { status: 400 })
    }
    const caja = await prisma.caja.findFirst({ where: { estado: 'abierta' } })
    if (!caja) return NextResponse.json({ error: 'No hay caja abierta' }, { status: 400 })

    const mov = await prisma.movimientoCaja.create({
      data: { cajaId: caja.id, tipo, concepto, moneda, monto: parseFloat(monto) }
    })

    // Actualizar totales en caja
    const esEntrada = tipo === 'entrada'
    const campo = moneda === 'C$' ? 'ingresosExtra' : 'ingresosExtra' // same field, diferentiated by moneda
    await prisma.caja.update({
      where: { id: caja.id },
      data: esEntrada
        ? { ingresosExtra: { increment: parseFloat(monto) } }
        : { egresos: { increment: parseFloat(monto) } }
    })

    return NextResponse.json(mov, { status: 201 })
  } catch (e) {
    console.error('Error al crear movimiento:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { id } = await req.json()
    const mov = await prisma.movimientoCaja.findUnique({ where: { id } })
    if (!mov) return NextResponse.json({ error: 'Movimiento no encontrado' }, { status: 404 })

    const caja = await prisma.caja.findFirst({ where: { estado: 'abierta', id: mov.cajaId } })
    if (!caja) return NextResponse.json({ error: 'La caja ya está cerrada' }, { status: 400 })

    // Revertir totales
    const esEntrada = mov.tipo === 'entrada'
    await prisma.caja.update({
      where: { id: mov.cajaId },
      data: esEntrada
        ? { ingresosExtra: { decrement: mov.monto } }
        : { egresos: { decrement: mov.monto } }
    })

    await prisma.movimientoCaja.delete({ where: { id } })
    return NextResponse.json({ ok: true })
  } catch (e) {
    console.error('Error al eliminar movimiento:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}