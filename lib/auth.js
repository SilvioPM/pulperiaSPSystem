import { SignJWT, jwtVerify } from 'jose'

const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('FATAL: JWT_SECRET no está definido en .env')
}

const secret = new TextEncoder().encode(JWT_SECRET)

export const COOKIE_NAME = 'session'

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
    .sign(secret)
}

export async function verificarToken(token) {
  try {
    const { payload } = await jwtVerify(token, secret)
    return payload
  } catch {
    return null
  }
}
