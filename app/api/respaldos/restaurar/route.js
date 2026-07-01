import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { verificarToken, COOKIE_NAME } from '@/lib/auth'

const execAsync = promisify(exec)
const DATABASE_URL = process.env.DATABASE_URL

async function psqlDisponible() {
  try { await execAsync('psql --version'); return true }
  catch { return false }
}

async function encontrarContainerApp() {
  const nombres = ['pulperia-system-app-1', 'pulperia-system_app_1', 'pulperia-system-app-2', 'pulperia-system_app_2']
  for (const nombre of nombres) {
    try {
      const { stdout } = await execAsync(`docker ps --filter name=${nombre} --format "{{.Names}}"`)
      if (stdout.trim()) return nombre
    } catch {}
  }
  try {
    const { stdout } = await execAsync(`docker ps --filter ancestor=pulperia-system-app --format "{{.Names}}"`)
    const names = stdout.trim().split('\n').filter(Boolean)
    if (names.length > 0) return names[0]
  } catch {}
  return null
}

async function ejecutarPsql(tmpFile) {
  const disponible = await psqlDisponible()
  if (disponible) {
    await execAsync(`psql "${DATABASE_URL}" -f "${tmpFile}"`)
    return
  }

  const container = await encontrarContainerApp()
  if (!container) {
    throw new Error(
      'psql no está instalado en Windows. Ejecutá la restauración desde el contenedor Docker:\n' +
      '  docker compose up -d --build\n' +
      '  Y restaurá desde http://localhost:3000/respaldos'
    )
  }

  const dbUrl = DATABASE_URL.replace(/@localhost:/, '@db:')
  const remotePath = '/tmp/restaurar.sql'
  await execAsync(`docker cp "${tmpFile}" ${container}:${remotePath}`)
  await execAsync(`docker exec ${container} psql "${dbUrl}" -f "${remotePath}"`)
  await execAsync(`docker exec ${container} rm -f "${remotePath}"`).catch(() => {})
}

export async function POST(req) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value
  if (!cookie) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const payload = await verificarToken(cookie)
  if (!payload?.esAdmin) return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  if (!DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL no configurada' }, { status: 500 })

  try {
    const formData = await req.formData()
    const file = formData.get('archivo')
    if (!file) return NextResponse.json({ error: 'No se envió ningún archivo' }, { status: 400 })
    if (typeof file === 'string') return NextResponse.json({ error: 'Archivo inválido' }, { status: 400 })

    const buffer = Buffer.from(await file.arrayBuffer())
    if (buffer.length === 0) return NextResponse.json({ error: 'El archivo está vacío' }, { status: 400 })

    const tmpFile = path.resolve(process.cwd(), 'tmp-restaurar.sql')
    await fs.writeFile(tmpFile, buffer)

    const prismaMod = await import('@/lib/prisma')
    await prismaMod.prisma.$disconnect()
    const globalForPrisma = globalThis
    globalForPrisma.prisma = undefined

    try {
      await ejecutarPsql(tmpFile)
    } catch (err) {
      await fs.unlink(tmpFile).catch(() => {})
      return NextResponse.json({ error: err.message }, { status: 400 })
    }

    await fs.unlink(tmpFile).catch(() => {})

    return NextResponse.json({ mensaje: 'Base de datos restaurada correctamente' })
  } catch (error) {
    console.error('Error al restaurar respaldo:', error)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}
