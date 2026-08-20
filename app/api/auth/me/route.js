import { prisma } from '@/lib/prisma'
import { verificarToken, firmarToken, COOKIE_NAME } from '@/lib/auth'

export async function GET(req) {
  try {
    // Leer cookie del header manualmente (next/headers cookies() no funciona en route handlers en este entorno)
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=')
      if (k && v) acc[k] = v
      return acc
    }, {})
    const cookieValue = cookies[COOKIE_NAME]
    if (!cookieValue) {
      return Response.json({ autenticado: false }, { status: 401 })
    }

    const payload = await verificarToken(cookieValue)
    if (!payload || !payload.ses) {
      return Response.json({ autenticado: false }, { status: 401 })
    }

    // Sesión única: si el token fue invalidado (logout remoto o nuevo login), rechazar
    const usuario = await prisma.usuario.findFirst({
      where: { sessionToken: payload.ses, activo: true }
    })
    if (!usuario) {
      return Response.json({ autenticado: false, sesionCerrada: true }, { status: 401 })
    }

    // Si el token expira en menos de 1 hora, re-emitir uno nuevo
    const now = Math.floor(Date.now() / 1000)
    const exp = payload.exp
    if (exp && (exp - now) < 3600) {
      const nuevoToken = await firmarToken(payload)
      const proto = req.headers.get('x-forwarded-proto') || 'http'
      const headers = new Headers()
      headers.set('Set-Cookie', `${COOKIE_NAME}=${nuevoToken}; HttpOnly; SameSite=Lax; Path=/; Max-Age=86400${proto === 'https' ? '; Secure' : ''}`)
      return Response.json({
        autenticado: true,
        id: payload.id,
        username: payload.username,
        nombre: payload.nombre,
        rol: payload.rol,
        esAdmin: payload.esAdmin,
        modulos: payload.modulos || [],
      }, { headers })
    }

    return Response.json({
      autenticado: true,
      id: payload.id,
      username: payload.username,
      nombre: payload.nombre,
      rol: payload.rol,
      esAdmin: payload.esAdmin,
      modulos: payload.modulos || [],
    })
  } catch {
    return Response.json({ autenticado: false }, { status: 500 })
  }
}
