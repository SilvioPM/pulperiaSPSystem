import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'
import cron from 'node-cron'

const execAsync = promisify(exec)

const DATABASE_URL = process.env.DATABASE_URL
const BACKUP_DIR = path.resolve(process.env.SPSYSTEM_BACKUP_DIR || '/app/respaldos')

async function generarRespaldoAutomatico() {
  if (!DATABASE_URL) {
    console.error('[Backup Cron] DATABASE_URL no configurada')
    return
  }

  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true })

    const now = new Date()
    const dateStr = now.toISOString().slice(0, 10)
    const filename = `respaldo-${dateStr}.sql`
    const filepath = path.join(BACKUP_DIR, filename)

    console.log(`[Backup Cron] Generando respaldo: ${filename}`)
    await execAsync(`pg_dump "${DATABASE_URL}" -Fp -c -f "${filepath}"`)

    const stats = await fs.stat(filepath)
    const sizeMB = (stats.size / 1024 / 1024).toFixed(2)
    console.log(`[Backup Cron] Respaldo completado: ${filename} (${sizeMB} MB)`)

    const files = await fs.readdir(BACKUP_DIR)
    const backups = files
      .filter(f => f.startsWith('respaldo-') && f.endsWith('.sql'))
      .sort()
      .reverse()

    if (backups.length > 4) {
      for (const old of backups.slice(4)) {
        await fs.unlink(path.join(BACKUP_DIR, old))
        console.log(`[Backup Cron] Eliminando respaldo antiguo: ${old}`)
      }
    }
  } catch (error) {
    console.error('[Backup Cron] Error:', error.message)
  }
}

cron.schedule('0 2 * * 0', () => {
  generarRespaldoAutomatico()
})

console.log(`[Backup Cron] Programado: todos los domingos a las 02:00 → ${BACKUP_DIR}`)
console.log('[Backup Cron] Vigente hasta que el proceso termine (Ctrl+C para detener)')
