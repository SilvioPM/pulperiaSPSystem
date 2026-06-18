import { verificarToken, COOKIE_NAME } from '@/lib/auth'

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
