import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url)
    let desde = searchParams.get('desde')
    let hasta = searchParams.get('hasta')

    if (!desde || !hasta) {
      const hoy = new Date()
      if (!hasta) hasta = hoy.toISOString().split('T')[0]
      if (!desde) {
        const treinta = new Date(hoy)
        treinta.setDate(treinta.getDate() - 30)
        desde = treinta.toISOString().split('T')[0]
      }
    }

    const where = {
      estado: { not: 'anulada' },
      creadoEn: {
        gte: new Date(desde),
        lte: new Date(hasta + 'T23:59:59.999Z')
      }
    }

    const [facturas, compras, productos] = await Promise.all([
      prisma.factura.findMany({
        where,
        include: {
          cliente: true,
          detalles: { include: { producto: true } },
          abonos: true
        },
        orderBy: { creadoEn: 'desc' }
      }),
      prisma.compra.findMany({
        where: { creadoEn: where.creadoEn },
        include: { proveedor: true, abonos: true },
        orderBy: { creadoEn: 'desc' }
      }),
      prisma.producto.findMany({
        where: { activo: true },
        include: { categoria: true }
      })
    ])

    // ── Ventas ────────────────────────────────────────────────────
    const totalVentas    = facturas.reduce((s, f) => s + f.total, 0)
    const totalDescuentos = facturas.reduce((s, f) => s + (f.descuento || 0), 0)
    const totalIva       = facturas.reduce((s, f) => s + (f.iva || 0), 0)

    // ── Ganancias ─────────────────────────────────────────────────
    // Suma el costo histórico guardado en cada detalle, fallback al costo actual del producto
    let costoTotal = 0
    facturas.forEach(f => {
      f.detalles.forEach(d => {
        const costo = d.costo > 0 ? d.costo : (d.producto?.costo || 0)
        costoTotal += costo * d.cantidad
      })
    })
    const gananciaTotal = totalVentas - costoTotal

    // ── Ventas por día (últimos 30) ───────────────────────────────
    const ventasPorDia = {}
    facturas.forEach(f => {
      const dia = new Date(f.creadoEn).toISOString().split('T')[0]
      if (!ventasPorDia[dia]) ventasPorDia[dia] = { dia, ventas: 0, total: 0 }
      ventasPorDia[dia].ventas++
      ventasPorDia[dia].total += f.total
    })

    // ── Top productos ─────────────────────────────────────────────
    const conteoProductos = {}
    facturas.forEach(f => {
      f.detalles.forEach(d => {
        const nombre = d.producto?.nombre || 'Desconocido'
        if (!conteoProductos[nombre]) {
          conteoProductos[nombre] = { nombre, cantidad: 0, ventas: 0, ganancia: 0 }
        }
        conteoProductos[nombre].cantidad += d.cantidad
        conteoProductos[nombre].ventas   += d.subtotal
        const costo = d.costo > 0 ? d.costo : (d.producto?.costo || 0)
        conteoProductos[nombre].ganancia += (d.precio - costo) * d.cantidad
      })
    })
    const topProductos = Object.values(conteoProductos)
      .sort((a, b) => b.ventas - a.ventas)
      .slice(0, 10)

    // ── Métodos de pago ───────────────────────────────────────────
    const metodosPago = {}
    facturas.forEach(f => {
      const m = f.metodoPago
      if (!metodosPago[m]) metodosPago[m] = { metodo: m, cantidad: 0, total: 0 }
      metodosPago[m].cantidad++
      metodosPago[m].total += f.total
    })

    // ── Inventario valorizado ─────────────────────────────────────
    const inventario = productos.map(p => ({
      id: p.id,
      nombre: p.nombre,
      categoria: p.categoria?.nombre,
      stock: p.stock,
      stockMinimo: p.stockMinimo,
      costo: p.costo,
      precio: p.precio,
      valorCosto: p.stock * p.costo,
      valorVenta: p.stock * p.precio,
      margen: p.precio > 0 ? ((p.precio - p.costo) / p.precio * 100) : 0
    }))
    const totalValorInventario = inventario.reduce((s, p) => s + p.valorCosto, 0)
    const stockBajo = inventario.filter(p => p.stock <= p.stockMinimo && p.stock > 0)
    const agotados  = inventario.filter(p => p.stock <= 0)

    // ── CXC ───────────────────────────────────────────────────────
    const cxc = facturas.filter(f => f.esCredito).map(f => ({
      id: f.id,
      numero: f.numero,
      cliente: f.cliente?.nombre || 'Sin cliente',
      total: f.total,
      saldoPendiente: f.saldoPendiente,
      diasDeuda: Math.floor((new Date() - new Date(f.creadoEn)) / (1000*60*60*24)),
      creadoEn: f.creadoEn
    }))
    const totalCXC = cxc.reduce((s, f) => s + f.saldoPendiente, 0)

    // ── CXP ───────────────────────────────────────────────────────
    const cxp = compras.filter(c => c.esCredito).map(c => ({
      id: c.id,
      numero: c.numero,
      proveedor: c.proveedor?.nombre,
      total: c.total,
      saldoPendiente: c.saldoPendiente,
      creadoEn: c.creadoEn
    }))
    const totalCXP = cxp.reduce((s, c) => s + c.saldoPendiente, 0)

    return NextResponse.json({
      resumen: {
        totalVentas,
        totalDescuentos,
        totalIva,
        costoTotal,
        gananciaTotal,
        margenPct: totalVentas > 0 ? (gananciaTotal / totalVentas * 100) : 0,
        numFacturas: facturas.length,
        ticketPromedio: facturas.length > 0 ? totalVentas / facturas.length : 0,
        totalValorInventario,
        totalCXC,
        totalCXP
      },
      ventasPorDia: Object.values(ventasPorDia).sort((a,b) => a.dia.localeCompare(b.dia)),
      topProductos,
      metodosPago: Object.values(metodosPago),
      inventario,
      stockBajo,
      agotados,
      cxc,
      cxp
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: 'Error al generar reporte' }, { status: 500 })
  }
}
