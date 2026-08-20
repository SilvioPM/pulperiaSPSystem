import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { obtenerUsuarioActual, filtrarCampos, CAMPOS_EDITABLES } from '@/lib/seguridad'
import { sanitizarEntrada } from '@/lib/sanitizar'

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, username: true, nombre: true, esAdmin: true, rol: true, modulos: true, activo: true, creadoEn: true, sessionToken: true },
      orderBy: { creadoEn: 'asc' },
    })
    return Response.json(usuarios.map(u => ({ ...u, modulos: JSON.parse(u.modulos || '[]'), sesionActiva: !!u.sessionToken, sessionToken: undefined })))
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const actual = await obtenerUsuarioActual()
    if (!actual) return Response.json({ error: 'No autorizado' }, { status: 401 })

    let { username, password, nombre, esAdmin, rol, modulos } = sanitizarEntrada(await req.json(), 100, ['password', 'modulos'])
    username = username?.trim()
    nombre = nombre?.trim()
    if (!username || !password || !nombre) {
      return Response.json({ error: 'Username, password y nombre requeridos' }, { status: 400 })
    }

    // Solo el administrador puede crear usuarios con privilegios
    if (!actual.esAdmin) {
      esAdmin = false
      rol = 'cajero'
      modulos = []
    }

    const existente = await prisma.usuario.findUnique({ where: { username } })
    if (existente) {
      return Response.json({ error: 'El username ya existe' }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)
    const usuario = await prisma.usuario.create({
      data: { username, password: hashed, nombre, esAdmin: esAdmin || false, rol: rol || 'cajero', modulos: JSON.stringify(modulos || []) },
    })

    return Response.json({
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      esAdmin: usuario.esAdmin,
      rol: usuario.rol,
      modulos: JSON.parse(usuario.modulos || '[]'),
      activo: usuario.activo,
    })
  } catch (error) {
    console.error('Error al crear usuario:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const actual = await obtenerUsuarioActual()
    if (!actual) return Response.json({ error: 'No autorizado' }, { status: 401 })

    let { id, ...resto } = sanitizarEntrada(await req.json(), 100, ['password', 'modulos'])
    if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

    // No-admin solo puede editar SU PROPIO registro
    if (!actual.esAdmin && id !== actual.id) {
      return Response.json({ error: 'No tiene permiso para editar a otro usuario' }, { status: 403 })
    }

    // Protección contra mass assignment: solo campos permitidos según el rol
    const permitidos = actual.esAdmin ? CAMPOS_EDITABLES.usuario.admin : CAMPOS_EDITABLES.usuario.estandar
    const campos = filtrarCampos(resto, permitidos)

    // Admin no puede auto-degradarse (evitar que el último admin se quite privilegios)
    if (actual.esAdmin && id === actual.id) {
      if (campos.esAdmin === false || campos.activo === false) {
        return Response.json({ error: 'No puede degradarse ni desactivarse a sí mismo' }, { status: 400 })
      }
    }

    const data = {}
    if (campos.username !== undefined) data.username = String(campos.username).trim()
    if (campos.nombre !== undefined) data.nombre = String(campos.nombre).trim()
    if (campos.esAdmin !== undefined) data.esAdmin = !!campos.esAdmin
    if (campos.rol !== undefined) data.rol = campos.rol
    if (campos.modulos !== undefined) data.modulos = JSON.stringify(campos.modulos)
    if (campos.activo !== undefined) data.activo = !!campos.activo
    if (campos.password) data.password = await bcrypt.hash(campos.password, 10)

    if (Object.keys(data).length === 0) {
      return Response.json({ error: 'No hay campos permitidos para actualizar' }, { status: 400 })
    }

    // Invalidar sesión si el usuario se desactiva o cambia su contraseña
    if (campos.activo === false || campos.password) {
      data.sessionToken = null
    }

    const usuario = await prisma.usuario.update({ where: { id }, data })
    return Response.json({
      id: usuario.id,
      username: usuario.username,
      nombre: usuario.nombre,
      esAdmin: usuario.esAdmin,
      rol: usuario.rol,
      modulos: JSON.parse(usuario.modulos || '[]'),
      activo: usuario.activo,
    })
  } catch (error) {
    console.error('Error al actualizar usuario:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
