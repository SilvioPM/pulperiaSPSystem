import { prisma } from '@/lib/prisma'
import { verificarToken, COOKIE_NAME } from '@/lib/auth'

export async function POST(req) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=')
      if (k && v) acc[k] = v
      return acc
    }, {})
    const cookieValue = cookies[COOKIE_NAME]
    if (cookieValue) {
      const payload = await verificarToken(cookieValue)
      if (payload?.id) {
        await prisma.usuario.update({
          where: { id: payload.id },
          data: { sessionToken: null }
        }).catch(() => {})
      }
    }

    const res = Response.json({ ok: true })
    res.headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
    )
    return res
  } catch {
    return Response.json({ error: 'Error al cerrar sesión' }, { status: 500 })
  }
}
