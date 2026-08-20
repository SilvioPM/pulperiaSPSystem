import { prisma } from '@/lib/prisma'
import { verificarToken, COOKIE_NAME } from '@/lib/auth'

// Caché en memoria: token de sesión → { valido, ts } (TTL 30s)
const sesionCache = new Map()

function cacheGet(ses) {
  const entry = sesionCache.get(ses)
  if (entry && Date.now() - entry.ts < 30000) return entry.valido
  return null
}

export async function GET(req) {
  try {
    const cookieHeader = req.headers.get('cookie') || ''
    const cookies = cookieHeader.split(';').reduce((acc, c) => {
      const [k, v] = c.trim().split('=')
      if (k && v) acc[k] = v
      return acc
    }, {})
    const cookieValue = cookies[COOKIE_NAME]
    if (!cookieValue) {
      return Response.json({ valido: false }, { status: 401 })
    }

    const payload = await verificarToken(cookieValue)
    if (!payload || !payload.ses) {
      return Response.json({ valido: false }, { status: 401 })
    }

    const cacheado = cacheGet(payload.ses)
    if (cacheado !== null) {
      if (!cacheado) return Response.json({ valido: false }, { status: 401 })
      return Response.json({ valido: true, id: payload.id, esAdmin: payload.esAdmin })
    }

    const usuario = await prisma.usuario.findFirst({
      where: { sessionToken: payload.ses, activo: true }
    })

    const valido = !!usuario
    sesionCache.set(payload.ses, { valido, ts: Date.now() })

    if (!valido) {
      return Response.json({ valido: false }, { status: 401 })
    }
    return Response.json({ valido: true, id: usuario.id, esAdmin: usuario.esAdmin })
  } catch {
    return Response.json({ valido: false }, { status: 500 })
  }
}