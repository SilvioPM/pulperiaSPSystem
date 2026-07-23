import { verificarToken, firmarToken, COOKIE_NAME } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET(req) {
  try {
    const cookie = req.cookies.get(COOKIE_NAME)
    if (!cookie?.value) {
      return Response.json({ autenticado: false }, { status: 401 })
    }

    const payload = await verificarToken(cookie.value)
    if (!payload) {
      return Response.json({ autenticado: false }, { status: 401 })
    }

    // Si el token expira en menos de 1 hora, re-emitir uno nuevo
    const now = Math.floor(Date.now() / 1000)
    const exp = payload.exp
    if (exp && (exp - now) < 3600) {
      const nuevoToken = await firmarToken(payload)
      const cookieStore = await cookies()
      cookieStore.set(COOKIE_NAME, nuevoToken, {
        httpOnly: true, secure: false, sameSite: 'lax',
        path: '/', maxAge: 60 * 60 * 24,
      })
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
