import { NextResponse } from 'next/server'
import { verificarToken, COOKIE_NAME } from './lib/auth'

const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/me', '/api/auth/logout', '/api/licencia', '/api/logo']

// Mapa recurso → módulos permitidos (RBAC). Cada API la consumen las páginas de varios módulos.
// esAdmin tiene acceso a todo.
const RUTAS_MODULOS = [
  { prefix: '/api/cart-sessions', modulos: ['pos'] },
  { prefix: '/api/imprimir', modulos: ['pos'] },
  { prefix: '/api/productos', modulos: ['productos', 'pos', 'inventario', 'compras', 'proformas'] },
  { prefix: '/api/categorias', modulos: ['productos', 'pos', 'compras', 'proformas'] },
  { prefix: '/api/unidades-medida', modulos: ['productos', 'compras'] },
  { prefix: '/api/clientes', modulos: ['clientes', 'pos', 'cuentas-cobrar', 'proformas'] },
  { prefix: '/api/facturas', modulos: ['facturas', 'pos', 'clientes', 'cuentas-cobrar', 'inicio'] },
  { prefix: '/api/caja', modulos: ['caja', 'pos', 'gastos'] },
  { prefix: '/api/compras', modulos: ['compras', 'deudas', 'reportes', 'inicio'] },
  { prefix: '/api/abonos-compra', modulos: ['compras', 'deudas', 'reportes'] },
  { prefix: '/api/proveedores', modulos: ['proveedores', 'compras', 'deudas'] },
  { prefix: '/api/abonos', modulos: ['clientes', 'cuentas-cobrar', 'reportes'] },
  { prefix: '/api/inventario', modulos: ['inventario'] },
  { prefix: '/api/proformas', modulos: ['proformas', 'pos'] },
  { prefix: '/api/gastos', modulos: ['gastos', 'reportes'] },
  { prefix: '/api/reportes', modulos: ['reportes', 'inicio'] },
  { prefix: '/api/config', modulos: ['configuracion'] },
  { prefix: '/api/usuarios', modulos: ['usuarios'] },
]

// Recursos solo para administradores
const RUTAS_ADMIN = ['/api/auditoria', '/api/respaldos']

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
    const host = req.headers.get('host')
    const allowed = []
    if (host) {
      allowed.push(`http://${host}`, `https://${host}`)
    } else {
      const url = new URL(req.url)
      allowed.push(url.origin)
    }
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

  // /api/config: GET es público (recibos/impresión), el resto requiere módulo configuracion
  if (pathname.startsWith('/api/config') && req.method === 'GET') return NextResponse.next()

  // Validar JWT
  const cookie = req.cookies.get(COOKIE_NAME)
  if (!cookie?.value) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const payload = await verificarToken(cookie.value)
  if (!payload) {
    return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 })
  }

  // RBAC: validar permiso del módulo para este recurso
  if (RUTAS_ADMIN.some(r => pathname.startsWith(r)) && !payload.esAdmin) {
    return NextResponse.json({ error: 'Sin permiso para este recurso' }, { status: 403 })
  }
  const ruta = RUTAS_MODULOS.find(r => pathname.startsWith(r.prefix))
  if (ruta && !payload.esAdmin) {
    const modulosUser = payload.modulos || []
    const permitido = ruta.modulos.some(m => modulosUser.includes(m))
    if (!permitido) {
      return NextResponse.json({ error: 'Sin permiso para este recurso' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: '/api/:path*',
}
