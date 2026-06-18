import { SignJWT, jwtVerify } from 'jose'

export const COOKIE_NAME = 'session'

let _secret = null
function getSecret() {
  if (!_secret) {
    const raw = process.env.JWT_SECRET
    if (!raw) throw new Error('FATAL: JWT_SECRET no está definido en .env')
    _secret = new TextEncoder().encode(raw)
  }
  return _secret
}

export async function firmarToken(usuario) {
  return new SignJWT({
    id: usuario.id,
    username: usuario.username,
    nombre: usuario.nombre,
    rol: usuario.rol,
    esAdmin: usuario.esAdmin,
    modulos: typeof usuario.modulos === 'string' ? JSON.parse(usuario.modulos) : (usuario.modulos || []),
  })
    .setProtectedHeader({ alg: 'HS256' })
    .setExpirationTime('24h')
    .sign(getSecret())
}

export async function verificarToken(token) {
  try {
    const { payload } = await jwtVerify(token, getSecret())
    return payload
  } catch {
    return null
  }
}
