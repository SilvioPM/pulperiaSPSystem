/**
 * Genera un archivo .lic para un cliente.
 * Uso: node scripts/generar-licencia.js [machineId] [dias]
 *      node scripts/generar-licencia.js --interactivo
 */

const crypto = require('crypto')
const fs = require('fs')
const path = require('path')
const readline = require('readline')

const LICENCIA_SECRET = process.env.APP_LICENSE_SECRET

const OPCIONES_DIAS = [
  { label: '7 días (prueba)', dias: 7 },
  { label: '30 días (1 mes)', dias: 30 },
  { label: '90 días (3 meses)', dias: 90 },
  { label: '180 días (6 meses)', dias: 180 },
  { label: '365 días (1 año)', dias: 365 },
  { label: '3650 días (10 años)', dias: 3650 },
  { label: '50000 días (casi eterna)', dias: 50000 },
  { label: 'Ingresar cantidad manual', dias: -1 },
]

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })

function preguntar(q) {
  return new Promise(resolve => rl.question(q, resolve))
}

async function elegirOpcion() {
  console.log('\nSeleccioná la duración de la licencia:')
  OPCIONES_DIAS.forEach((o, i) => console.log(`  ${i + 1}. ${o.label}`))
  const op = parseInt(await preguntar('\nOpción (1-8): ')) || 0
  if (op < 1 || op > 8) {
    console.error('Opción inválida')
    return elegirOpcion()
  }
  const seleccionada = OPCIONES_DIAS[op - 1]
  if (seleccionada.dias === -1) {
    return parseInt(await preguntar('Ingresá la cantidad de días: ')) || 365
  }
  return seleccionada.dias
}

async function obtenerMachineId() {
  // Buscar archivo machine-id en /app/data/ o ./data/
  const rutasPosibles = [
    '/app/data/machine-id',
    path.join(process.cwd(), 'data', 'machine-id'),
    path.join(process.cwd(), 'machine-id.txt'),
  ]
  const archivoExistente = rutasPosibles.find(r => fs.existsSync(r))
  if (archivoExistente) {
    const confirm = await preguntar(`¿Usar machine-id de "${archivoExistente}"? (s/N): `)
    if (confirm.toLowerCase() === 's') {
      return fs.readFileSync(archivoExistente, 'utf8').trim()
    }
  }

  const manual = await preguntar('Ingresá el machine-id del cliente (o dejá vacío para salir): ')
  if (!manual) {
    console.log('Operación cancelada.')
    process.exit(0)
  }
  return manual.trim()
}

async function main() {
  const modoInteractivo = process.argv.includes('--interactivo')
  let machineId = process.argv[2]
  let dias = parseInt(process.argv[3]) || 365

  if (modoInteractivo || !machineId) {
    machineId = await obtenerMachineId()
    if (!machineId) {
      console.error('Machine-ID requerido.')
      process.exit(1)
    }
    dias = await elegirOpcion()
    rl.close()
  }

  if (!LICENCIA_SECRET) {
    console.error('ERROR: Falta la variable APP_LICENSE_SECRET en el .env')
    console.error('Asegurate de tener un .env con:')
    console.error('  APP_LICENSE_SECRET=tu_secreto')
    process.exit(1)
  }

  const expiresAt = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString().split('T')[0]

  const firma = crypto
    .createHmac('sha256', LICENCIA_SECRET)
    .update(`${machineId}|${expiresAt}`)
    .digest('hex')

  const licencia = { machineId, expiresAt, firma }
  const json = JSON.stringify(licencia, null, 2)
  const nombreArchivo = `licencia_${machineId.slice(0, 8)}_${expiresAt}.lic`

  fs.writeFileSync(nombreArchivo, json, 'utf8')

  console.log(`\n✅ Licencia generada: ${nombreArchivo}`)
  console.log(`   Machine-ID : ${machineId}`)
  console.log(`   Vence      : ${expiresAt} (${dias} días)`)
  console.log(`   Archivo    : ${path.resolve(nombreArchivo)}\n`)
}

main()
