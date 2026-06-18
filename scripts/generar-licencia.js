/**
 * Genera un archivo .lic para un cliente.
 * Uso: node scripts/generar-licencia.js <machineId> <dias>
 * Ej: node scripts/generar-licencia.js a1b2c3d4e5f6g7h8i9j0 365
 */
const crypto = require('crypto')

const LICENCIA_SECRET = process.env.APP_LICENSE_SECRET

const machineId = process.argv[2]
const dias = parseInt(process.argv[3]) || 365

if (!machineId) {
  console.error('Uso: node scripts/generar-licencia.js 2b31f63d92592ed64f60b02ddf8968ef 50000')
  process.exit(1)
}

const expiresAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

const firma = crypto
  .createHmac('sha256', LICENCIA_SECRET)
  .update(`${machineId}|${expiresAt}`)
  .digest('hex')

const licencia = { machineId, expiresAt, firma }
const json = JSON.stringify(licencia)
const nombreArchivo = `licencia_${machineId.slice(0, 8)}_${expiresAt}.lic`

// Escribe el archivo en UTF-8 directo (evita problema de encoding con > en PowerShell)
require('fs').writeFileSync(nombreArchivo, json, 'utf8')

console.log(`✅ Licencia generada: ${nombreArchivo}`)
console.log(json)