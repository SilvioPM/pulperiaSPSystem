import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { parseNumber } from '@/lib/number'
import { verificarToken, COOKIE_NAME } from '@/lib/auth'
import { sanitizarEntrada } from '@/lib/sanitizar'

export async function POST(request, { params }) {
  const cookie = request.cookies.get(COOKIE_NAME)?.value
  if (!cookie) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const payload = await verificarToken(cookie)
  if (!payload) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })

  try {
    const id = parseInt(params.id)
    const body = sanitizarEntrada(await request.json(), 200)
    const monto = parseNumber(body.monto || 0)
    const metodo = body.metodo || 'efectivo'
    const moneda = body.moneda || 'C$'
    if (monto <= 0) return NextResponse.json({ error: 'Monto inválido' }, { status: 400 })

    const METODOS_VALIDOS = ['efectivo', 'dolares', 'tarjeta', 'transferencia']
    if (!METODOS_VALIDOS.includes(metodo)) return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 })

    const result = await prisma.$transaction(async (tx) => {
      const cliente = await tx.cliente.update({
        where: { id },
        data: { saldoInicialPagado: { increment: monto } }
      })

      // Solo el efectivo entra al cajón: registrar como ingreso extra (persiste en el arqueo).
      // Tarjeta/transferencia van al banco y no tocan la caja.
      const esEfectivo = metodo === 'efectivo' || metodo === 'dolares'
      if (esEfectivo) {
        const cajaAbierta = await tx.caja.findFirst({ where: { estado: 'abierta' } })
        if (cajaAbierta) {
          const esUs = metodo === 'dolares' || moneda === '$'
          await tx.movimientoCaja.create({
            data: {
              cajaId: cajaAbierta.id, tipo: 'entrada',
              concepto: `Abono saldo inicial cliente ${cliente.nombre}`,
              moneda: esUs ? '$' : 'C$', monto
            }
          })
          await tx.caja.update({
            where: { id: cajaAbierta.id },
            data: {
              [esUs ? 'ingresosExtraUs' : 'ingresosExtra']: { increment: monto },
              totalVendido: { increment: monto }
            }
          })
        }
      }

      return { mensaje: 'Abono registrado', cliente }
    })

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error al abonar saldo inicial:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}