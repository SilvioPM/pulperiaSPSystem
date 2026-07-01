import { NextResponse } from 'next/server'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import { verificarToken, COOKIE_NAME } from '@/lib/auth'

const execAsync = promisify(exec)
const DATABASE_URL = process.env.DATABASE_URL

async function pgDumpDisponible() {
  try {
    await execAsync('pg_dump --version')
    return true
  } catch {
    return false
  }
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

async function ejecutarPgDump(tmpFile) {
  const disponible = await pgDumpDisponible()
  if (disponible) {
    await execAsync(`pg_dump "${DATABASE_URL}" -Fp -c -f "${tmpFile}"`)
    return
  }

  const container = await encontrarContainerApp()
  if (!container) {
    throw new Error(
      'pg_dump no está instalado en Windows. Ejecutá dentro del contenedor Docker:\n' +
      '  docker compose up -d --build\n' +
      '  Y descargá el respaldo desde http://localhost:3000/respaldos\n\n' +
      'O instalá PostgreSQL client tools en Windows para desarrollo local.'
    )
  }

  const dbUrl = DATABASE_URL.replace(/@localhost:/, '@db:')
  await execAsync(
    `docker exec ${container} pg_dump "${dbUrl}" -Fp -c > "${tmpFile}"`
  )
}

export async function GET(req) {
  const cookie = req.cookies.get(COOKIE_NAME)?.value
  if (!cookie) return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  const payload = await verificarToken(cookie)
  if (!payload?.esAdmin) return NextResponse.json({ error: 'Solo administradores' }, { status: 403 })

  if (!DATABASE_URL) return NextResponse.json({ error: 'DATABASE_URL no configurada' }, { status: 500 })

  const tmpFile = path.resolve(process.cwd(), 'tmp-respaldo.sql')

  try {
    await ejecutarPgDump(tmpFile)

    const buffer = await fs.readFile(tmpFile)
    await fs.unlink(tmpFile).catch(() => {})

    const today = new Date().toISOString().slice(0, 10)
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/sql',
        'Content-Disposition': `attachment; filename="respaldo-${today}.sql"`,
        'Content-Length': buffer.length.toString(),
      },
    })
  } catch (error) {
    console.error('Error al generar respaldo:', error.message)
    await fs.unlink(tmpFile).catch(() => {})
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
