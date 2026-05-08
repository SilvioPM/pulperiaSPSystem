import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'

export async function GET() {
  try {
    const configs = await prisma.config.findMany()
    // Convertimos el array en un objeto clave:valor
    const resultado = {}
    configs.forEach(c => { resultado[c.clave] = c.valor })
    return NextResponse.json(resultado)
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener configuración' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = await request.json()
    // Guardamos cada clave por separado usando upsert
    // upsert = "si existe actualizá, si no existe creá"
    const operaciones = Object.entries(body).map(([clave, valor]) =>
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