import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req, { params }) {
  try {
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

    const compraAnular = await prisma.compra.findUnique({
      where: { id: parseInt(id) },
      include: { detalles: true },
    })

    if (!compraAnular) {
      return Response.json({ error: 'Compra no encontrada' }, { status: 404 })
    }

    if (compraAnular.estado === 'anulada') {
      return Response.json({ error: 'La compra ya está anulada' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
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
    })

    return Response.json({ mensaje: 'Compra anulada exitosamente' })
  } catch (error) {
    console.error('Error al anular compra:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
