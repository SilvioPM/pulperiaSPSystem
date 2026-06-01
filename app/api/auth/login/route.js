import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(req) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return Response.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 })
    }

    const usuario = await prisma.usuario.findUnique({ where: { username } })
    if (!usuario || !usuario.activo) {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    const valido = await bcrypt.compare(password, usuario.password)
    if (!valido) {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    return Response.json({
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      esAdmin: usuario.esAdmin,
      rol: usuario.rol,
      modulos: JSON.parse(usuario.modulos || '[]'),
    })
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 })
  }
}
