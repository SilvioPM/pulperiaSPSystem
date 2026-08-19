import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req, { params }) {
  try {
    const ip = getClientIp(req)
    const rl = rateLimit(ip, 3, 300000, 'anular-compra')
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
      return Response.json({ error: 'No tiene permisos para anular compras' }, { status: 403 })
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const compraAnular = await tx.compra.findUnique({
        where: { id: parseInt(id) },
        include: { detalles: true },
      })

      if (!compraAnular) {
        throw new Error('Compra no encontrada')
      }

      if (compraAnular.estado === 'anulada') {
        throw new Error('La compra ya está anulada')
      }

      // Restaurar stock y registrar movimientos
      for (const detalle of compraAnular.detalles) {
        const producto = await tx.producto.findUnique({ where: { id: detalle.productoId } })
        const unidadCompra = detalle.unidad
        const cantidadBase = (producto?.unidadCompra && producto?.unidadBase && producto?.factorConversion && producto.unidadCompra !== producto.unidadBase)
          ? detalle.cantidad * producto.factorConversion : detalle.cantidad

        await tx.producto.update({
          where: { id: detalle.productoId },
          data: { stock: { decrement: cantidadBase } },
        })

        await tx.movInventario.create({
          data: {
            productoId: detalle.productoId,
            tipo: 'salida',
            cantidad: cantidadBase,
            motivo: `Anulación compra ${compraAnular.numero} (autorizado por ${autorizador.username})`,
          },
        })

        // Revertir cambios en producto aplicados durante la compra
        const revertData = {}
        if (producto?.costo !== undefined && detalle.costo !== undefined) revertData.costo = producto.costo
        if (producto?.fechaVencimiento && detalle.fechaVencimiento) revertData.fechaVencimiento = producto.fechaVencimiento
        if (producto?.unidadBase && detalle.unidad) revertData.unidadBase = producto.unidadBase
        if (producto?.unidadCompra && detalle.unidad) revertData.unidadCompra = producto.unidadCompra
        if (producto?.factorConversion && detalle.factorConversion) revertData.factorConversion = producto.factorConversion
        if (Object.keys(revertData).length > 0) {
          await tx.producto.update({
            where: { id: detalle.productoId },
            data: revertData
          })
        }
      }

      await tx.compra.update({
        where: { id: parseInt(id) },
        data: { estado: 'anulada', saldoPendiente: 0, anuladaEn: new Date(), anuladaPor: `${autorizador.nombre} (${autorizador.username})` },
      })

      await tx.auditoria.create({
        data: {
          usuario: `${autorizador.nombre} (${autorizador.username})`,
          accion: 'anular',
          entidad: 'compra',
          detalle: `Compra #${compraAnular.numero} - C$ ${compraAnular.total.toFixed(2)}`
        }
      })

      return { mensaje: 'Compra anulada exitosamente' }
    })

    return Response.json(resultado)
  } catch (error) {
    console.error('Error al anular compra:', error)
    const mensaje = error.message === 'Compra no encontrada' ? 'Compra no encontrada'
      : error.message === 'La compra ya está anulada' ? 'La compra ya está anulada'
      : 'Error interno del servidor'
    const status = error.message === 'Compra no encontrada' ? 404
      : error.message === 'La compra ya está anulada' ? 400
      : 500
    return Response.json({ error: mensaje }, { status })
  }
}
