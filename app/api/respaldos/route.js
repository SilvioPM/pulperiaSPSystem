import { NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import { verificarToken, COOKIE_NAME } from '@/lib/auth'

const DB_PATH = path.resolve(process.cwd(), 'prisma', 'dev.db')

export async function GET(req) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value
  if (!cookie) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const payload = await verificarToken(cookie)
  if (!payload?.esAdmin) return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  try {
    const exists = await fs.stat(DB_PATH).then(() => true).catch(() => false)
    if (!exists) return NextResponse.json({ error: 'No se encontró la base de datos' }, { status: 404 })

    const buffer = await fs.readFile(DB_PATH)
    const today = new Date().toISOString().slice(0, 10)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/octet-stream',
        'Content-Disposition': `attachment; filename="respaldo-${today}.db"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error al descargar respaldo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
