import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { verificarToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(request, { params }) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value
  if (!cookie) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const payload = await verificarToken(cookie)
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const id = parseInt(params.id)
    const body = await request.json()
    const monto = parseFloat(body.monto || 0)
    if (monto <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

    const cliente = await prisma.cliente.update({
      where: { id },
      data: { saldoInicialPagado: { increment: monto } }
    })

    return NextResponse.json({ mensaje: 'Abono registrado', cliente })
  } catch (error) {
    console.error('Error al abonar saldo inicial:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
