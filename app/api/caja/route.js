import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const actual = await prisma.caja.findFirst({ where: { estado: 'abierta' }, orderBy: { id: 'desc' } })
    if (actual) {
      // Recalcular solo el dinero que realmente entró a caja
      // Facturas: solo métodos de pago reales (excluir crédito)
      const facturas = await prisma.factura.findMany({
        where: {
          creadoEn: { gte: actual.abiertaEn },
          estado: { not: 'anulada' }
        }
      })
      let totalIngresado = 0, ventasEfectivoCs = 0, ventasEfectivoUs = 0
      let ventasTarjeta = 0, ventasTransfer = 0, abonosTotal = 0
      for (const f of facturas) {
        let dp = []
        try { dp = f.detallesPago ? JSON.parse(f.detallesPago) : [] } catch {}
        if (dp.length > 0) {
          for (const p of dp) {
            if (p.metodo === 'credito') continue
            const monto = parseFloat(p.monto || 0)
            if (p.metodo === 'efectivo' && p.moneda === 'C$') ventasEfectivoCs += monto
            else if (p.metodo === 'efectivo' && p.moneda === '$') ventasEfectivoUs += monto
            else if (p.metodo === 'dolares') ventasEfectivoUs += monto
            else if (p.metodo === 'tarjeta') ventasTarjeta += monto
            else if (p.metodo === 'transferencia') ventasTransfer += monto
            totalIngresado += monto
          }
        } else {
          if (f.metodoPago === 'credito') continue
          const monto = f.metodoPago === 'dolares' ? (f.pagoEnUsd ?? f.pagoCon ?? 0) : f.total
          if (f.metodoPago === 'efectivo') ventasEfectivoCs += monto
          else if (f.metodoPago === 'dolares') ventasEfectivoUs += monto
          else if (f.metodoPago === 'tarjeta') ventasTarjeta += monto
          else if (f.metodoPago === 'transferencia') ventasTransfer += monto
          totalIngresado += monto
        }
      }
      // Abonos de clientes (CxC): dinero que entró a caja
      const abonos = await prisma.abono.findMany({
        where: { creadoEn: { gte: actual.abiertaEn } }
      })
      for (const a of abonos) {
        abonosTotal += a.monto
        totalIngresado += a.monto
      }
      actual.totalVendido = totalIngresado
      actual.ventasEfectivoCs = ventasEfectivoCs
      actual.ventasEfectivoUs = ventasEfectivoUs
      actual.ventasTarjeta = ventasTarjeta
      actual.ventasTransfer = ventasTransfer
      actual.ventasCredito = 0
      actual.abonosTotal = abonosTotal
    }
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