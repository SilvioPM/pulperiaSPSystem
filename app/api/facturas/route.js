import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

// GET — Obtener todas las facturas (con paginación)
export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const page = Math.max(1, parseInt(searchParams.get('page') || 1))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || 30)))
    const clienteId = searchParams.get('clienteId')
    const estado = searchParams.get('estado')

    const where = {}
    if (desde || hasta) {
      where.creadoEn = {}
      if (desde) where.creadoEn.gte = new Date(desde)
      if (hasta) {
        const h = new Date(hasta)
        h.setHours(23, 59, 59, 999)
        where.creadoEn.lte = h
      }
    }
    if (clienteId) where.clienteId = parseInt(clienteId)
    if (estado) where.estado = estado

    const [facturas, total] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: {
          cliente: true,
          detalles: { include: { producto: true } },
          abonos: true
        },
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.factura.count({ where })
    ])

    return NextResponse.json({
      data: facturas,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener facturas' }, { status: 500 })
  }
}

// POST — Crear una nueva factura (venta)
export async function POST(request) {
  try {
    const body = await request.json()

    // Validaciones básicas
    if (!body.detalles || !Array.isArray(body.detalles) || body.detalles.length === 0) {
      return NextResponse.json({ error: 'La factura debe tener al menos un detalle' }, { status: 400 })
    }
    const totalVal = parseFloat(body.total)
    if (isNaN(totalVal) || totalVal < 0) {
      return NextResponse.json({ error: 'Total inválido' }, { status: 400 })
    }

    // Usamos una transacción para asegurar atomicidad en número, creación y stock
    const factura = await prisma.$transaction(async (tx) => {
      // Número de factura atómico dentro de la transacción
      const ultima = await tx.factura.findFirst({ orderBy: { id: 'desc' }, select: { numero: true } })
      let secuencia = 1
      if (ultima?.numero) {
        const partes = ultima.numero.split('-')
        secuencia = parseInt(partes[1] || '0') + 1
      }
      const numero = `FAC-${String(secuencia).padStart(5, '0')}`

      const esCredito = body.esCredito || false
      const detallesPagoArr = body.detallesPago || []
      const pagoNoCredito = detallesPagoArr.length > 0
        ? detallesPagoArr
          .filter(p => p.metodo !== 'credito')
          .reduce((s, p) => s + (p.metodo === 'dolares' ? parseFloat(p.monto || 0) * (parseFloat(body.tasaCambio || 0) || 1) : parseFloat(p.monto || 0)), 0)
        : parseFloat(body.pagoCon || 0)
      const saldoPendiente = esCredito ? Math.max(0, totalVal - pagoNoCredito) : 0
      const creada = await tx.factura.create({
        data: {
          numero,
          clienteId: body.clienteId ? parseInt(body.clienteId) : null,
          subtotal: parseFloat(body.subtotal),
          descuento: parseFloat(body.descuento || 0),
          iva: parseFloat(body.iva || 0),
          total: totalVal,
          pagoCon: parseFloat(body.pagoCon || 0),
          cambio: parseFloat(body.cambio || 0),
          metodoPago: body.metodoPago || 'efectivo',
          esCredito,
          saldoPendiente: esCredito ? totalVal : 0,
          estado: esCredito ? 'credito' : 'pagada',
          fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
          detallesPago: body.detallesPago ? JSON.stringify(body.detallesPago) : null,
          detalles: {
            create: body.detalles.map(d => ({
              productoId: parseInt(d.productoId),
              cantidad: parseFloat(d.cantidad),
              unidadVenta: d.unidadVenta || null,
              precio: parseFloat(d.precio),
              costo: parseFloat(d.costo || 0),
              subtotal: parseFloat(d.subtotal),
              factorConversion: parseFloat(d.factorConversion || 1)
            }))
          }
        },
        include: {
          detalles: { include: { producto: true } },
          cliente: true
        }
      })

      // Descontar stock y registrar movimientos dentro de la misma transacción
      for (const detalle of body.detalles) {
        const factor = parseFloat(detalle.factorConversion || 1)
        const cantidadBase = parseFloat(detalle.cantidad) * factor

        const prod = await tx.producto.findUnique({ where: { id: parseInt(detalle.productoId) } })
        if (!prod) throw new Error(`Producto ID ${detalle.productoId} no encontrado`)
        if (prod.stock < cantidadBase) {
          throw new Error(`Stock insuficiente para "${prod.nombre}". Disponible: ${prod.stock}`)
        }

        await tx.producto.update({
          where: { id: parseInt(detalle.productoId) },
          data: { stock: { decrement: cantidadBase } }
        })

        await tx.movInventario.create({
          data: {
            productoId: parseInt(detalle.productoId),
            tipo: 'salida',
            cantidad: cantidadBase,
            cantidadOriginal: parseFloat(detalle.cantidad),
            unidadOriginal: detalle.unidadVenta || null,
            motivo: `Venta ${numero}`
          }
        })
      }

      // Auditoría dentro de la transacción
      if (body.usuario) {
        await tx.auditoria.create({
          data: {
            usuario: body.usuario,
            accion: 'crear',
            entidad: 'factura',
            detalle: `Factura #${numero} - C$ ${totalVal} (${body.metodoPago || 'efectivo'}${body.detallesPago?.length > 1 ? ' +mixto' : ''})`
          }
        })
      }

      return creada
    })

    // Actualizar caja abierta si existe
    const cajaAbierta = await prisma.caja.findFirst({ where: { estado: 'abierta' } })
    if (cajaAbierta) {
      const updateCaja = { totalVendido: { increment: parseFloat(body.total) } }
      const dp = body.detallesPago || []
      if (dp.length > 0) {
        for (const p of dp) {
          const monto = parseFloat(p.monto || 0)
          if (p.metodo === 'efectivo' && p.moneda === 'C$') updateCaja.ventasEfectivoCs = { increment: monto }
          else if (p.metodo === 'efectivo' && p.moneda === '$') updateCaja.ventasEfectivoUs = { increment: monto }
          else if (p.metodo === 'dolares') updateCaja.ventasEfectivoUs = { increment: monto }
          else if (p.metodo === 'tarjeta') updateCaja.ventasTarjeta = { increment: monto }
          else if (p.metodo === 'transferencia') updateCaja.ventasTransfer = { increment: monto }
          else if (p.metodo === 'credito') updateCaja.ventasCredito = { increment: monto }
        }
      } else {
        if (body.metodoPago === 'efectivo') updateCaja.ventasEfectivoCs = { increment: parseFloat(body.total) }
        else if (body.metodoPago === 'dolares') updateCaja.ventasEfectivoUs = { increment: parseFloat(body.pagoEnUsd || body.pagoCon || 0) }
        else if (body.metodoPago === 'tarjeta') updateCaja.ventasTarjeta = { increment: parseFloat(body.total) }
        else if (body.metodoPago === 'transferencia') updateCaja.ventasTransfer = { increment: parseFloat(body.total) }
        else if (body.metodoPago === 'credito') updateCaja.ventasCredito = { increment: parseFloat(body.total) }
      }
      await prisma.caja.update({ where: { id: cajaAbierta.id }, data: updateCaja })
    }

    return NextResponse.json(factura, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear factura' }, { status: 500 })
  }
}