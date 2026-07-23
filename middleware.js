import { NextResponse } from 'next/server'
import { verificarToken, COOKIE_NAME } from './lib/auth'

const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/me', '/api/auth/logout', '/api/config', '/api/licencia', '/api/logo']

export default async function middleware(req) {
  const { pathname } = req.nextUrl

  if (!pathname.startsWith('/api/')) return NextResponse.next()

  if (req.method === 'OPTIONS') {
    return new NextResponse(null, {
      status: 204,
      headers: {
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
        'Access-Control-Max-Age': '86400',
      },
    })
  }

  // CSRF: validar Origin/Referer en métodos de escritura
  if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const origin = req.headers.get('origin')
    const referer = req.headers.get('referer')
    const url = new URL(req.url)
    const allowed = [url.origin, `${url.protocol}//${url.host}`]
    if (origin) {
      try {
        const o = new URL(origin)
        if (!allowed.some(a => o.origin === new URL(a).origin)) {
          return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: 'Origen inválido' }, { status: 400 })
      }
    } else if (referer) {
      try {
        const r = new URL(referer)
        if (!allowed.some(a => r.origin === new URL(a).origin)) {
          return NextResponse.json({ error: 'Origen no permitido' }, { status: 403 })
        }
      } catch {
        return NextResponse.json({ error: 'Referer inválido' }, { status: 400 })
      }
    }
  }

  // Rutas públicas
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return NextResponse.next()

  // Validar JWT
  const cookie = req.cookies.get(COOKIE_NAME)
  if (!cookie?.value) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const payload = await verificarToken(cookie.value)
  if (!payload) {
    return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
