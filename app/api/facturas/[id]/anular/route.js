import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req, { params }) {
  try {
    const ip = getClientIp(req)
    const rl = rateLimit(ip, 3, 300000, 'anular-factura')
    if (!rl.allowed) {
      return Response.json({ error: `Demasiados intentos de anulación. Intente en ${rl.resetIn} segundos.` }, { status: 429 })
    }

    const { id } = await params
    const { username, password } = await req.json()

    if (!username || !password) {
      return Response.json({ error: 'Usuario y contraseña requeridos para autorizar' }, { status: 400 })
    }

    const autorizador = await prisma.usuario.findUnique({ where: { username } })
    if (!autorizador || !autorizador.activo) {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valido = await bcrypt.compare(password, autorizador.password)
    if (!valido) {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const puedeAutorizar = autorizador.esAdmin || autorizador.rol === 'supervisor' || autorizador.rol === 'encargado'
    if (!puedeAutorizar) {
      return Response.json({ error: 'No tiene permisos para anular facturas' }, { status: 403 })
    }

    // Usar transacción con bloqueo para evitar doble anulación
    const resultado = await prisma.$transaction(async (tx) => {
      // Bloquear la factura para actualización (SELECT FOR UPDATE implícito en transacción)
      const facturaAnular = await tx.factura.findUnique({
        where: { id: parseInt(id) },
        include: { detalles: true },
      })

      if (!facturaAnular) {
        throw new Error('Factura no encontrada')
      }

      if (facturaAnular.estado === 'anulada') {
        throw new Error('La factura ya está anulada')
      }

      // Restaurar stock y registrar movimientos
      for (const detalle of facturaAnular.detalles) {
        const factor = detalle.factorConversion || 1
        const cantidadBase = detalle.cantidad * factor

        const prod = await tx.producto.findUnique({ where: { id: detalle.productoId }, select: { esGenerico: true } })
        if (prod?.esGenerico) continue

        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stock: { increment: cantidadBase } },
        })

        await tx.movInventario.create({
          data: {
            productoId: detalle.productoId,
            tipo: 'entrada',
            cantidad: cantidadBase,
            motivo: `Anulación ${facturaAnular.numero} (autorizado por ${autorizador.username})`,
          },
        })
      }

      // Revertir caja: descontar los montos que se sumaron al crear la factura
      const caja = await tx.caja.findFirst({ where: { estado: 'abierta' } })
      if (caja) {
        const updateCaja = {}
        let totalRevertir = 0

        // Revertir abonos registrados a esta factura (se sumaron por método al cajón o al banco)
        const abonosFactura = await tx.abono.findMany({ where: { facturaId: facturaAnular.id } })
        for (const a of abonosFactura) {
          const m = parseFloat(a.monto || 0)
          if (a.metodo === 'dolares' || (a.metodo === 'efectivo' && a.moneda === '$')) updateCaja.abonosEfectivoUs = { decrement: m }
          else if (a.metodo === 'efectivo') updateCaja.abonosEfectivoCs = { decrement: m }
          else if (a.metodo === 'tarjeta') updateCaja.abonosTarjeta = { decrement: m }
          else if (a.metodo === 'transferencia') updateCaja.abonosTransfer = { decrement: m }
          totalRevertir += m
        }

        const dp = facturaAnular.detallesPago ? JSON.parse(facturaAnular.detallesPago) : []
        if (dp.length > 0) {
          let totalPagado = 0
          for (const p of dp) {
            const monto = parseFloat(p.monto || 0)
            if (p.metodo === 'credito') {
              updateCaja.ventasCredito = { decrement: monto }
            } else {
              totalPagado += monto
              if (p.metodo === 'efectivo' && p.moneda === 'C$') updateCaja.ventasEfectivoCs = { decrement: monto }
              else if (p.metodo === 'efectivo' && p.moneda === '$') updateCaja.ventasEfectivoUs = { decrement: monto }
              else if (p.metodo === 'dolares') updateCaja.ventasEfectivoUs = { decrement: monto }
              else if (p.metodo === 'tarjeta') updateCaja.ventasTarjeta = { decrement: monto }
              else if (p.metodo === 'transferencia') updateCaja.ventasTransfer = { decrement: monto }
            }
          }
          totalRevertir += totalPagado
        } else {
          if (facturaAnular.metodoPago === 'credito') {
            updateCaja.ventasCredito = { decrement: facturaAnular.total }
          } else {
            totalRevertir += facturaAnular.total
            if (facturaAnular.metodoPago === 'efectivo') updateCaja.ventasEfectivoCs = { decrement: facturaAnular.total }
            else if (facturaAnular.metodoPago === 'dolares') updateCaja.ventasEfectivoUs = { decrement: facturaAnular.pagoEnUsd || facturaAnular.pagoCon || 0 }
            else if (facturaAnular.metodoPago === 'tarjeta') updateCaja.ventasTarjeta = { decrement: facturaAnular.total }
            else if (facturaAnular.metodoPago === 'transferencia') updateCaja.ventasTransfer = { decrement: facturaAnular.total }
          }
        }
        if (totalRevertir > 0) updateCaja.totalVendido = { decrement: totalRevertir }
        if (Object.keys(updateCaja).length > 0) {
          await tx.caja.update({ where: { id: caja.id }, data: updateCaja })
        }
      }

      // Marcar factura como anulada + saldoPendiente = 0
      await tx.factura.update({
        where: { id: parseInt(id) },
        data: { estado: 'anulada', saldoPendiente: 0, anuladaEn: new Date(), anuladaPor: `${autorizador.nombre} (${autorizador.username})` },
      })

      // Auditoría
      await tx.auditoria.create({
        data: {
          usuario: `${autorizador.nombre} (${autorizador.username})`,
          accion: 'anular',
          entidad: 'factura',
          detalle: `Factura #${facturaAnular.numero} - C$ ${facturaAnular.total.toFixed(2)}`
        }
      })

      return { mensaje: 'Factura anulada exitosamente' }
    })

    return Response.json(resultado)
  } catch (error) {
    console.error('Error al anular factura:', error)
    const mensaje = error.message === 'Factura no encontrada' ? 'Factura no encontrada'
      : error.message === 'La factura ya está anulada' ? 'La factura ya está anulada'
      : 'Error interno del servidor'
    const status = error.message === 'Factura no encontrada' ? 404
      : error.message === 'La factura ya está anulada' ? 400
      : 500
    return Response.json({ error: mensaje }, { status })
  }
}
