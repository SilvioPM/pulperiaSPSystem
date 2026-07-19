import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { firmarToken, COOKIE_NAME } from '@/lib/auth'

const rateLimitMap = new Map()

function checkRateLimit(ip) {
  const now = Date.now()
  const windowMs = 60 * 1000
  const maxAttempts = 10

  const entry = rateLimitMap.get(ip)
  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitMap.set(ip, { windowStart: now, count: 1 })
    return { allowed: true }
  }

  entry.count++
  if (entry.count > maxAttempts) {
    return { allowed: false, retryAfter: Math.ceil((windowMs - (now - entry.windowStart)) / 1000) }
  }
  return { allowed: true }
}

const MAX_INTENTOS = 5
const TIEMPO_BLOQUEO_MIN = 5

export async function POST(req) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('x-real-ip') || 'unknown'
    const rateCheck = checkRateLimit(ip)
    if (!rateCheck.allowed) {
      return Response.json({ error: `Demasiadas solicitudes. Intente de nuevo en ${rateCheck.retryAfter} segundos` }, { status: 429 })
    }

    const { username, password, recordar } = await req.json()
    if (!username || !password) {
      return Response.json({ error: 'Usuario y contraseña requeridos' }, { status: 400 })
    }

    const usuario = await prisma.usuario.findUnique({ where: { username } })
    if (!usuario || !usuario.activo) {
      return Response.json({ error: 'Credenciales inválidas' }, { status: 401 })
    }

    if (usuario.bloqueadoHasta && new Date(usuario.bloqueadoHasta) > new Date()) {
      const falta = Math.ceil((new Date(usuario.bloqueadoHasta) - new Date()) / 1000 / 60)
      return Response.json({ error: `Usuario bloqueado. Intente de nuevo en ${falta} minuto(s)` }, { status: 423 })
    }

    const valido = await bcrypt.compare(password, usuario.password)

    if (!valido) {
      const nuevos = (usuario.intentosFallidos || 0) + 1
      const data = { intentosFallidos: nuevos }

      if (nuevos >= MAX_INTENTOS) {
        data.bloqueadoHasta = new Date(Date.now() + TIEMPO_BLOQUEO_MIN * 60 * 1000)
        data.intentosFallidos = 0
        await prisma.usuario.update({ where: { id: usuario.id }, data })
        return Response.json({ error: `Demasiados intentos. Usuario bloqueado por ${TIEMPO_BLOQUEO_MIN} minutos` }, { status: 423 })
      }

      await prisma.usuario.update({ where: { id: usuario.id }, data })
      const restantes = MAX_INTENTOS - nuevos
      return Response.json({ error: `Credenciales inválidas. ${restantes} intento(s) restante(s)` }, { status: 401 })
    }

    if (usuario.intentosFallidos > 0 || usuario.bloqueadoHasta) {
      await prisma.usuario.update({
        where: { id: usuario.id },
        data: { intentosFallidos: 0, bloqueadoHasta: null }
      })
    }

    const token = await firmarToken(usuario)

    const res = Response.json({
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      esAdmin: usuario.esAdmin,
      rol: usuario.rol,
      modulos: JSON.parse(usuario.modulos || '[]'),
    })

    const maxAge = recordar ? 'Max-Age=86400' : ''
    res.headers.set(
      'Set-Cookie',
      `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; ${maxAge}`
    )

    return res
  } catch (error) {
    console.error('Error en login:', error)
    return Response.json({ error: 'Error al iniciar sesión' }, { status: 500 })
  }
}

// Limpiar entries antiguas cada 5 minutos
setInterval(() => {
  const now = Date.now()
  for (const [ip, entry] of rateLimitMap) {
    if (now - entry.windowStart > 120 * 1000) rateLimitMap.delete(ip)
  }
}, 5 * 60 * 1000)
