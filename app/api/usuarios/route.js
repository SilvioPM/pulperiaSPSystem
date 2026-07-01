import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function GET() {
  try {
    const usuarios = await prisma.usuario.findMany({
      select: { id: true, username: true, nombre: true, esAdmin: true, rol: true, modulos: true, activo: true, creadoEn: true },
      orderBy: { creadoEn: 'asc' },
    })
    return Response.json(usuarios.map(u => ({ ...u, modulos: JSON.parse(u.modulos || '[]') })))
  } catch (error) {
    console.error('Error al obtener usuarios:', error)
    return Response.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    let { username, password, nombre, esAdmin, rol, modulos } = await req.json()
    username = username?.trim()
    nombre = nombre?.trim()
    if (!username || !password || !nombre) {
      return Response.json({ error: 'Username, password y nombre requeridos' }, { status: 400 })
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
    let { id, username, password, nombre, esAdmin, rol, modulos, activo } = await req.json()
    if (!id) return Response.json({ error: 'ID requerido' }, { status: 400 })

    const data = {}
    if (username !== undefined) data.username = username.trim()
    if (nombre !== undefined) data.nombre = nombre.trim()
    if (esAdmin !== undefined) data.esAdmin = esAdmin
    if (rol !== undefined) data.rol = rol
    if (modulos !== undefined) data.modulos = JSON.stringify(modulos)
    if (activo !== undefined) data.activo = activo
    if (password) data.password = await bcrypt.hash(password, 10)

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
