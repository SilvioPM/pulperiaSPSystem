import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { parseNumber } from '@/lib/number'
import { sanitizarEntrada } from '@/lib/sanitizar'

export async function POST(request) {
  try {
    const body = sanitizarEntrada(await request.json(), 300)
    const facturaId = parseInt(body.facturaId)
    const monto = parseNumber(body.monto)
    const metodo = body.metodo || 'efectivo'
    const moneda = body.moneda || 'C$'

    const METODOS_VALIDOS = ['efectivo', 'dolares', 'tarjeta', 'transferencia']
    if (!METODOS_VALIDOS.includes(metodo)) {
      return NextResponse.json({ error: 'Método de pago inválido' }, { status: 400 })
    }
    if (moneda !== 'C$' && moneda !== '$') {
      return NextResponse.json({ error: 'Moneda inválida' }, { status: 400 })
    }

    if (!facturaId || isNaN(monto) || monto <= 0) {
      return NextResponse.json({ error: 'Datos de abono inválidos' }, { status: 400 })
    }

    const result = await prisma.$transaction(async (tx) => {
      const factura = await tx.factura.findUnique({ where: { id: facturaId } })
      if (!factura) throw new Error('Factura no encontrada')

      if (factura.estado === 'anulada') {
        throw new Error('No se puede abonar una factura anulada')
      }

      if (monto > factura.saldoPendiente) {
        throw new Error(`El abono (C$ ${monto}) supera el saldo pendiente (C$ ${factura.saldoPendiente})`)
      }

      const abono = await tx.abono.create({
        data: { facturaId, monto, metodo, moneda, nota: body.nota || null }
      })

      const nuevoSaldo = parseFloat((factura.saldoPendiente - monto).toFixed(2))
      const nuevoEstado = nuevoSaldo <= 0 ? 'pagada' : 'credito'

      await tx.factura.update({
        where: { id: facturaId },
        data: { saldoPendiente: nuevoSaldo, estado: nuevoEstado }
      })

      // Sumar a caja abierta según el método: efectivo entra al cajón,
      // tarjeta/transferencia van al banco (no afectan el arqueo físico)
      const cajaAbierta = await tx.caja.findFirst({ where: { estado: 'abierta' } })
      if (cajaAbierta) {
        const updateCaja = { totalVendido: { increment: monto } }
        if (metodo === 'dolares' || (metodo === 'efectivo' && moneda === '$')) updateCaja.abonosEfectivoUs = { increment: monto }
        else if (metodo === 'efectivo') updateCaja.abonosEfectivoCs = { increment: monto }
        else if (metodo === 'tarjeta') updateCaja.abonosTarjeta = { increment: monto }
        else if (metodo === 'transferencia') updateCaja.abonosTransfer = { increment: monto }
        await tx.caja.update({ where: { id: cajaAbierta.id }, data: updateCaja })
      }

      return { abono, nuevoSaldo, nuevoEstado }
    })

    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    console.error('Error al registrar abono:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
