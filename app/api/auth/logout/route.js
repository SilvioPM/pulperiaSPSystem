import { COOKIE_NAME } from '@/lib/auth'

export async function POST() {
  try {
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
