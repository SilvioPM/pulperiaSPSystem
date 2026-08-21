import { NextResponse } from 'next/server'
import { verificarToken, COOKIE_NAME } from './lib/auth'

const PUBLIC_ROUTES = ['/api/auth/login', '/api/auth/me', '/api/auth/sesion', '/api/auth/logout', '/api/licencia', '/api/logo', '/api/auth/verify-password']

// Cache simple en memoria para estado de licencia (TTL 30s)
const licenciaCache = new Map()

// Cache simple en memoria para validez de sesión (TTL 30s)
const sesionCache = new Map()

// Base URL interna para llamadas del middleware a la propia API.
// El middleware corre DENTRO del contenedor de la app, así que apunta a su
// propio servidor HTTP y no al host público (que puede ser HTTPS vía Caddy,
// inaccesible desde adentro del contenedor).
const URL_INTERNA = 'http://127.0.0.1:3000'

async function verificarLicencia(req) {
  const cached = licenciaCache.get('estado')
  if (cached && Date.now() - cached.ts < 30000) {
    return cached.valida
  }

  try {
    const res = await fetch(`${URL_INTERNA}/api/licencia`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
      // Timeout implícito por fetch
    })
    if (res.ok) {
      const data = await res.json()
      licenciaCache.set('estado', { valida: data.valida === true, ts: Date.now() })
      return data.valida === true
    }
  } catch {
    // Si falla la verificación, permitimos (fail-open) pero logueamos
    console.warn('No se pudo verificar licencia, permitiendo acceso (fail-open)')
  }
  return true
}

// Verifica que el token de sesión del JWT siga activo en la BD (logout remoto / sesión única).
// Internamente llama a /api/auth/sesion (público) y cachea 30s por token.
async function verificarSesion(req, payload) {
  if (!payload.ses) return false

  const cached = sesionCache.get(payload.ses)
  if (cached && Date.now() - cached.ts < 30000) {
    return cached.valida
  }

  try {
    const res = await fetch(`${URL_INTERNA}/api/auth/sesion`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': req.headers.get('cookie') || '',
      },
    })
    const valida = res.ok
    sesionCache.set(payload.ses, { valida, ts: Date.now() })
    return valida
  } catch {
    // Si falla la verificación, permitimos (fail-open) pero logueamos
    console.warn('No se pudo verificar sesión, permitiendo acceso (fail-open)')
    return true
  }
}

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
  { prefix: '/api/auth/verify-password', modulos: ['usuarios', 'pos'] },
]

// Recursos solo para administradores
const RUTAS_ADMIN = ['/api/auditoria', '/api/respaldos']

// Escrituras operacionales que un cajero SÍ puede hacer (vender, cobrar, caja, tickets).
// Todo lo demás en POST/PUT/DELETE exige rol supervisor/encargado/admin (o esAdmin).
// p = ruta exacta | s = sufijo de subruta (cualquier id entre p y s)
const ESCRITURA_CAJERO = [
  { m: 'POST', p: '/api/facturas' },
  { m: 'POST', p: '/api/facturas/', s: '/anular' },        // requiere contraseña de supervisor en el handler
  { m: 'POST', p: '/api/abonos' },
  { m: 'POST', p: '/api/abonos-compra' },
  { m: 'POST', p: '/api/clientes' },                       // crear cliente rápido desde POS
  { m: 'POST', p: '/api/clientes/', s: '/abonar-inicial' },
  { m: 'POST', p: '/api/caja' },                           // apertura de caja
  { m: 'POST', p: '/api/caja/cerrar' },                    // arqueo y cierre
  { m: 'POST', p: '/api/caja/movimientos' },               // entradas/salidas de caja
  { m: 'POST', p: '/api/cart-sessions' },                  // estacionar venta
  { m: 'DELETE', p: '/api/cart-sessions' },                // retirar venta estacionada
  { m: 'POST', p: '/api/imprimir' },
]

export default async function middleware(req) {
  const { pathname } = req.nextUrl

  // Páginas: bloquear por licencia (sin JWT; login y páginas de licencia son públicas)
  if (!pathname.startsWith('/api/')) {
    if (pathname === '/login' || pathname === '/licencia' || pathname.startsWith('/licencia-bloqueada')) {
      return NextResponse.next()
    }
    const licenciaValida = await verificarLicencia(req)
    if (!licenciaValida) {
      return NextResponse.redirect(new URL('/licencia-bloqueada', req.url))
    }
    return NextResponse.next()
  }

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

  // Rutas públicas (sin JWT ni licencia)
  if (PUBLIC_ROUTES.some(r => pathname.startsWith(r))) return NextResponse.next()

  // /api/config: GET es público (recibos/impresión), el resto requiere módulo configuracion
  if (pathname.startsWith('/api/config') && req.method === 'GET') return NextResponse.next()

  // Validar licencia ANTES que JWT (si no hay licencia válida, no deja entrar)
  const licenciaValida = await verificarLicencia(req)
  if (!licenciaValida) {
    return NextResponse.json({ error: 'Licencia inválida o expirada', code: 'LICENCIA_INVALIDA' }, { status: 403 })
  }

  // Validar JWT
  const cookie = req.cookies.get(COOKIE_NAME)
  if (!cookie?.value) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  const payload = await verificarToken(cookie.value)
  if (!payload) {
    return NextResponse.json({ error: 'Sesión inválida o expirada' }, { status: 401 })
  }

  // Sesión única: validar que el token de sesión siga activo en la BD (logout remoto)
  const sesionValida = await verificarSesion(req, payload)
  if (!sesionValida) {
    return NextResponse.json({ error: 'Sesión cerrada en otro dispositivo' }, { status: 401 })
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

  // Rol de escritura: cajero = solo lectura (salvo operaciones permitidas).
  // Antes esto solo se ocultaba en la UI; ahora también se valida en el servidor.
  if (!payload.esAdmin && payload.rol === 'cajero' && ['POST', 'PUT', 'DELETE'].includes(req.method)) {
    const permitida = ESCRITURA_CAJERO.some(r => {
      if (r.m !== req.method) return false
      if (r.p === pathname) return true
      if (r.s && pathname.startsWith(r.p) && pathname.endsWith(r.s)) return true
      return false
    })
    if (!permitida) {
      return NextResponse.json({ error: 'Sin permiso para esta acción (rol cajero = solo lectura)' }, { status: 403 })
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/((?!_next|.*\\..*).*)'],
}
