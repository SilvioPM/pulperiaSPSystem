import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import os from 'os'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()

const LICENCIA_SECRET = process.env.APP_LICENSE_SECRET

let cachedMachineId = null
let cacheTime = 0

export function generarMachineId() {
  if (cachedMachineId && Date.now() - cacheTime < 60000) return cachedMachineId

  const dataDir = process.env.SPSYSTEM_DATA_DIR || path.join(process.cwd(), 'data')
  const machineIdFile = path.join(dataDir, 'machine-id')

  try {
    if (fs.existsSync(machineIdFile)) {
      cachedMachineId = fs.readFileSync(machineIdFile, 'utf8').trim()
      cacheTime = Date.now()
      return cachedMachineId
    }
  } catch {}

  const datos = [
    os.hostname(),
    os.platform(),
    os.arch(),
    ...(os.cpus() || []).map(c => c.model),
    ...Object.values(os.networkInterfaces())
      .flat()
      .filter(i => i && !i.internal)
      .map(i => i.mac)
      .filter(Boolean)
      .sort()
  ].join('|')
  cachedMachineId = crypto.createHash('sha256').update(datos).digest('hex').slice(0, 32)
  cacheTime = Date.now()

  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(machineIdFile, cachedMachineId)
  } catch {}

  return cachedMachineId
}

export function validarFirma(machineId, expiresAt, firma) {
  const esperada = crypto
    .createHmac('sha256', LICENCIA_SECRET)
    .update(`${machineId}|${expiresAt}`)
    .digest('hex')
  return firma === esperada
}

async function getConfig(clave) {
  const c = await prisma.config.findUnique({ where: { clave } })
  return c?.valor || null
}

export async function obtenerEstadoLicencia() {
  const machineId = generarMachineId()
  const token = await getConfig('licenciaToken')
  const expira = await getConfig('licenciaExpira')
  let valida = false
  let expiraEn = null
  let vencePronto = false
  let diasRestantes = null

  if (token && expira) {
    valida = validarFirma(machineId, expira, token)
    if (valida) {
      expiraEn = expira
      const dias = Math.ceil((new Date(expira) - new Date()) / (1000 * 60 * 60 * 24))
      diasRestantes = dias
      vencePronto = dias <= 15 && dias >= 0
    }
  }

  return { machineId, valida, expiraEn, vencePronto, diasRestantes }
}