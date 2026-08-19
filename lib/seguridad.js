import { cookies } from 'next/headers'
import { verificarToken, COOKIE_NAME } from './auth'

export async function obtenerUsuarioActual() {
  const store = await cookies()
  const token = store.get(COOKIE_NAME)?.value
  if (!token) return null
  return verificarToken(token)
}

export function filtrarCampos(entrada, permitidos) {
  const salida = {}
  for (const campo of permitidos) {
    if (entrada[campo] !== undefined) salida[campo] = entrada[campo]
  }
  return salida
}

// Campos editables por rol (protección contra mass assignment)
export const CAMPOS_EDITABLES = {
  usuario: {
    admin: ['username', 'nombre', 'password', 'esAdmin', 'rol', 'modulos', 'activo'],
    estandar: ['nombre', 'password'],
  },
}