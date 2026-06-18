import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'
import crypto from 'crypto'
import os from 'os'
import fs from 'fs'
import path from 'path'

const prisma = new PrismaClient()
const LICENCIA_SECRET = process.env.APP_LICENSE_SECRET

let cachedMachineId = null
let cacheTime = 0
function generarMachineId() {
  if (cachedMachineId && Date.now() - cacheTime < 60000) return cachedMachineId

  const dataDir = process.env.SPSYSTEM_DATA_DIR || path.join(process.cwd(), 'data')
  const machineIdFile = path.join(dataDir, 'machine-id')

  // Intentar leer ID persistido (Docker volume / instalación portable)
  try {
    if (fs.existsSync(machineIdFile)) {
      cachedMachineId = fs.readFileSync(machineIdFile, 'utf8').trim()
      cacheTime = Date.now()
      return cachedMachineId
    }
  } catch {}

  // Generar desde hardware del host
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

  // Persistir para que sobreviva a reinicios del contenedor
  try {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })
    fs.writeFileSync(machineIdFile, cachedMachineId)
  } catch {}

  return cachedMachineId
}

function validarFirma(machineId, expiresAt, firma) {
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

async function setConfig(clave, valor) {
  await prisma.config.upsert({
    where: { clave },
    update: { valor },
    create: { clave, valor }
  })
}

export async function GET() {
  const machineId = generarMachineId()
  const token = await getConfig('licenciaToken')
  const expira = await getConfig('licenciaExpira')
  let valida = false
  let expiraEn = null
  let vencePronto = false

  if (token && expira) {
    valida = validarFirma(machineId, expira, token)
    if (valida) {
      expiraEn = expira
      const dias = Math.ceil((new Date(expira) - new Date()) / (1000 * 60 * 60 * 24))
      vencePronto = dias <= 15 && dias >= 0
    }
  }

  return NextResponse.json({ machineId, valida, expiraEn, vencePronto })
}

export async function POST(req) {
  try {
    const formData = await req.formData()
    const archivo = formData.get('archivo')

    if (!archivo) {
      return NextResponse.json({ error: 'No se envió el archivo de licencia' }, { status: 400 })
    }

    const raw = await archivo.text()
    // Limpia posibles BOM y caracteres basura (PowerShell UTF-16)
    const texto = raw.replace(/^\uFEFF/, '').replace(/\0/g, '').trim()
    let licencia
    try {
      licencia = JSON.parse(texto)
    } catch (e) {
      console.error('Error parseando licencia:', texto.slice(0, 300), e.message)
      return NextResponse.json({ error: `Archivo de licencia inválido — JSON mal formado` }, { status: 400 })
    }

    const { machineId, expiresAt, firma } = licencia
    if (!machineId || !expiresAt || !firma) {
      return NextResponse.json({ error: 'El archivo no contiene todos los campos requeridos' }, { status: 400 })
    }

    const actualMachineId = generarMachineId()
    if (machineId !== actualMachineId) {
      return NextResponse.json({ error: 'Esta licencia no corresponde a este equipo' }, { status: 400 })
    }

    if (!validarFirma(machineId, expiresAt, firma)) {
      return NextResponse.json({ error: 'Firma de licencia inválida' }, { status: 400 })
    }

    if (new Date(expiresAt) < new Date()) {
      return NextResponse.json({ error: 'La licencia ya expiró' }, { status: 400 })
    }

    await setConfig('licenciaToken', firma)
    await setConfig('licenciaExpira', expiresAt)

    return NextResponse.json({ ok: true, expiraEn: expiresAt })
  } catch (e) {
    console.error('Error al cargar licencia:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}