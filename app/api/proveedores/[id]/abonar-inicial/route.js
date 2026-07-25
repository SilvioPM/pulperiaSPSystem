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
    const fuente = body.fuente || 'otro'
    if (monto <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      const proveedor = await tx.proveedor.update({
        where: { id },
        data: { saldoInicialCxpPagado: { increment: monto } }
      })

      if (fuente === 'caja') {
        const cajaAbierta = await tx.caja.findFirst({ where: { estado: 'abierta' } })
        if (cajaAbierta) {
          await tx.movimientoCaja.create({
            data: {
              cajaId: cajaAbierta.id, tipo: 'salida',
              concepto: `Pago saldo inicial a proveedor ${proveedor.nombre}`,
              moneda: 'C$', monto
            }
          })
          await tx.caja.update({
            where: { id: cajaAbierta.id },
            data: { egresos: { increment: monto } }
          })
        }
      }

      return { mensaje: 'Abono registrado', proveedor }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error al abonar saldo inicial:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
