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
      return Response.json({ error: 'No tiene permisos para anular facturas' }, { status: 403 })
    }

    const facturaAnular = await prisma.factura.findUnique({
      where: { id: parseInt(id) },
      include: { detalles: true },
    })

    if (!facturaAnular) {
      return Response.json({ error: 'Factura no encontrada' }, { status: 404 })
    }

    if (facturaAnular.estado === 'anulada') {
      return Response.json({ error: 'La factura ya está anulada' }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Primero restaurar stock y registrar movimientos
      for (const detalle of facturaAnular.detalles) {
        const factor = detalle.factorConversion || 1
        const cantidadBase = detalle.cantidad * factor

        const prod = await tx.producto.findUnique({ where: { id: detalle.productoId }, select: { esGenerico: true } })
        // Si es genérico, no afecta inventario
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

      // Luego marcar factura como anulada
      await tx.factura.update({
        where: { id: parseInt(id) },
        data: { estado: 'anulada', anuladaEn: new Date(), anuladaPor: `${autorizador.nombre} (${autorizador.username})` },
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
    })

    return Response.json({ mensaje: 'Factura anulada exitosamente' })
  } catch (error) {
    console.error('Error al anular factura:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
