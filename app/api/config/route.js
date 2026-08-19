import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const configs = await prisma.config.findMany()
    // Convertimos el array en un objeto clave:valor, minimizando datos sensibles
    const resultado = {}
    configs.forEach(c => {
      // No exponer datos de licencia (token/firma/fechas internas)
      if (c.clave.startsWith('licencia')) return
      resultado[c.clave] = c.valor
    })
    return NextResponse.json(resultado)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
  }
}

const CLAVES_BLOQUEADAS = ['licenciaToken', 'licenciaExpira', 'machineId']

export async function POST(request) {
  try {
    const body = await request.json()
    // Evitar que se sobrescriban claves sensibles vía mass assignment
    const entradas = Object.entries(body).filter(([clave]) =>
      !CLAVES_BLOQUEADAS.some(bloqueada => clave.toLowerCase().includes(bloqueada.toLowerCase()))
    )
    if (entradas.length === 0) {
      return NextResponse.json({ error: 'No hay claves válidas para guardar' }, { status: 400 })
    }
    // Guardamos cada clave por separado usando upsert
    // upsert = "si existe actualizá, si no existe creá"
    const operaciones = entradas.map(([clave, valor]) =>
      prisma.config.upsert({
        where:  { clave },
        update: { valor: String(valor) },
        create: { clave, valor: String(valor) }
      })
    )
    await Promise.all(operaciones)
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: 'Error al guardar configuración' }, { status: 500 })
  }
}