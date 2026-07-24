import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    const desde = searchParams.get('desde')
    const hasta = searchParams.get('hasta')
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '20')))

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
    const buscarFactura = searchParams.get('factura')
    if (buscarFactura) {
      where.facturaProveedor = { contains: buscarFactura, mode: 'insensitive' }
    }
    const estado = searchParams.get('estado')
    if (estado) {
      where.estado = estado
    }

    const [compras, total] = await Promise.all([
      prisma.compra.findMany({
        where,
        include: {
          proveedor:   true,
          detalles:    { include: { producto: true } },
          abonos: true
        },
        orderBy: { creadoEn: 'desc' },
        skip: (page - 1) * limit,
        take: limit
      }),
      prisma.compra.count({ where })
    ])

    return NextResponse.json({ data: compras, total, page, totalPages: Math.ceil(total / limit) })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener compras' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    if (!body.detalles || !Array.isArray(body.detalles) || body.detalles.length === 0) {
      return NextResponse.json({ error: 'La compra debe tener al menos un detalle' }, { status: 400 })
    }

    const esBorrador = body.esBorrador === true

    const compra = await prisma.$transaction(async (tx) => {
      const ultima = await tx.compra.findFirst({ orderBy: { id: 'desc' }, select: { numero: true } })
      let secuencia = 1
      if (ultima?.numero) {
        const partes = ultima.numero.split('-')
        secuencia = parseInt(partes[1] || '0') + 1
      }
      const numero = `COM-${String(secuencia).padStart(5, '0')}`

      const esCredito = body.esCredito || false
      const creada = await tx.compra.create({
        data: {
          numero,
          facturaProveedor: body.facturaProveedor || null,
          proveedorId: parseInt(body.proveedorId),
          subtotal: parseFloat(body.subtotal || 0),
          iva: parseFloat(body.iva || 0),
          total: parseFloat(body.total),
          esCredito,
          saldoPendiente: esBorrador ? 0 : (esCredito ? parseFloat(body.total) : 0),
          estado: esBorrador ? 'borrador' : (esCredito ? 'credito' : 'pagada'),
          fechaVencimiento: body.fechaVencimiento ? new Date(body.fechaVencimiento) : null,
          nota: body.nota || null,
          detalles: {
            create: body.detalles.map(d => ({
              productoId: parseInt(d.productoId),
              cantidad: parseFloat(d.cantidad),
              unidad: d.unidad || 'unidad',
              costo: parseFloat(d.costo),
              subtotal: parseFloat(d.subtotal)
            }))
          }
        },
        include: {
          proveedor: true,
          detalles: { include: { producto: true } },
          abonos: true
        }
      })

      if (!esBorrador) {
        for (const detalle of body.detalles) {
          const producto = await tx.producto.findUnique({ where: { id: parseInt(detalle.productoId) } })
          if (!producto) throw new Error(`Producto ID ${detalle.productoId} no encontrado`)

          const fc = parseFloat(detalle.factorConversion) || producto.factorConversion || 1
          const cantidadBase = parseFloat(detalle.cantidad) * fc

          const updateData = {
            stock: { increment: cantidadBase },
            unidadBase: detalle.unidadVenta || producto.unidadBase,
            unidadCompra: detalle.unidadCompra || producto.unidadCompra,
            factorConversion: fc,
            costo: parseFloat(detalle.costo) / fc
          }
          if (producto.unidadVenta2 && detalle.unidad === producto.unidadVenta2) {
            updateData.costoVenta2 = parseFloat(detalle.costo)
          }
          if (producto.unidadVenta3 && detalle.unidad === producto.unidadVenta3) {
            updateData.costoVenta3 = parseFloat(detalle.costo)
          }
          if (producto.unidadVenta4 && detalle.unidad === producto.unidadVenta4) {
            updateData.costoVenta4 = parseFloat(detalle.costo)
          }
          if (detalle.fechaVencimiento) {
            updateData.fechaVencimiento = new Date(detalle.fechaVencimiento)
          }
          await tx.producto.update({
            where: { id: parseInt(detalle.productoId) },
            data: updateData
          })

          await tx.movInventario.create({
            data: {
              productoId: parseInt(detalle.productoId),
              tipo: 'entrada',
              cantidad: cantidadBase,
              cantidadOriginal: parseFloat(detalle.cantidad),
              unidadOriginal: detalle.unidadCompra || detalle.unidad || 'unidad',
              motivo: `Compra ${numero}`
            }
          })
        }
      }

      return creada
    })

    return NextResponse.json(compra, { status: 201 })
  } catch (error) {
    console.error('Error al registrar compra:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
