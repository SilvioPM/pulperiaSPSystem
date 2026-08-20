import { prisma } from '@/lib/prisma'
import { obtenerUsuarioActual } from '@/lib/seguridad'

// Cierre remoto de sesión: solo administradores
export async function DELETE(req, { params }) {
  try {
    const actual = await obtenerUsuarioActual()
    if (!actual) return Response.json({ error: 'No autorizado' }, { status: 401 })
    if (!actual.esAdmin) return Response.json({ error: 'Sin permiso' }, { status: 403 })

    const id = parseInt(params.id)
    if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

    const usuario = await prisma.usuario.findUnique({ where: { id } })
    if (!usuario) return Response.json({ error: 'Usuario no encontrado' }, { status: 404 })

    await prisma.usuario.update({ where: { id }, data: { sessionToken: null } })

    return Response.json({ ok: true })
  } catch (error) {
    console.error('Error al cerrar sesión remota:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}