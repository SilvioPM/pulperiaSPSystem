import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { rateLimit, getClientIp } from '@/lib/rate-limit'

export async function POST(req) {
  try {
    const ip = getClientIp(req)
    const rl = rateLimit(ip, 5, 300000, 'verify-password')
    if (!rl.allowed) {
      return Response.json({ valido: false, error: `Demasiados intentos. Intente en ${rl.resetIn} segundos.` }, { status: 429 })
    }

    const { username, password } = await req.json()
    if (!username || !password) {
      return Response.json({ valido: false, error: 'Usuario y contraseña requeridos' })
    }

    const usuario = await prisma.usuario.findUnique({ where: { username } })
    if (!usuario || !usuario.activo) {
      return Response.json({ valido: false, error: 'Credenciales inválidas' })
    }

    const valido = await bcrypt.compare(password, usuario.password)
    if (!valido) {
      return Response.json({ valido: false, error: 'Credenciales inválidas' })
    }

    const puedeAutorizar = usuario.esAdmin || usuario.rol === 'supervisor' || usuario.rol === 'encargado'
    if (!puedeAutorizar) {
      return Response.json({ valido: false, error: 'El usuario no tiene permisos para autorizar' })
    }

    return Response.json({
      valido: true,
      user: { id: usuario.id, username: usuario.username, nombre: usuario.nombre, rol: usuario.rol },
    })
  } catch (error) {
    console.error('Error en verificar contraseña:', error)
    return Response.json({ valido: false, error: 'Error interno del servidor' })
  }
}
