import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { verificarToken, COOKIE_NAME } from '@/lib/auth'

const DB_PATH = path.resolve(process.cwd(), 'prisma', 'dev.db')

export async function POST(req) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value
  if (!cookie) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const payload = await verificarToken(cookie)
  if (!payload?.esAdmin) return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  try {
    const formData = await req.formData()
    const file = formData.get('archivo')
    if (!file) return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })

    if (typeof file === 'string') return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0) return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })

    if (buffer.readUInt8(0) !== 0x53 || buffer.toString('ascii', 0, 16) !== 'SQLite format 3\u0000') {
      return NextResponse.json({ error: 'El archivo no es una base de datos SQLite válida' }, { status: 400 })
    }

    const prismaMod = await import('@/lib/prisma')
    await prismaMod.prisma.$disconnect()

    const globalForPrisma = globalThis
    globalForPrisma.prisma = undefined

    const bakPath = DB_PATH + '.bak'
    const exists = await fs.stat(DB_PATH).then(() => true).catch(() => false)
    if (exists) {
      await fs.rename(DB_PATH, bakPath)
    }

    try {
      await fs.writeFile(DB_PATH, buffer)
    } catch {
      if (exists) await fs.rename(bakPath, DB_PATH)
      throw new Error('Error al escribir el archivo de base de datos')
    }

    if (exists) {
      await fs.unlink(bakPath).catch(() => {})
    }

    return NextResponse.json({ mensaje: 'Base de datos restaurada correctamente' })
  } catch (error) {
    console.error('Error al restaurar respaldo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
