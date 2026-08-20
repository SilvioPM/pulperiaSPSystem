import { NextResponse } from 'next/server'
import { obtenerEstadoLicencia, validarFirma } from '@/lib/licencia'
import { prisma } from '@/lib/prisma'

export async function GET() {
  const estado = await obtenerEstadoLicencia()
  return NextResponse.json(estado)
}

export async function POST(req) {
  try {
    const formData = await req.formData()
    const archivo = formData.get('archivo')

    if (!archivo) {
      return NextResponse.json({ error: 'No se envió el archivo de licencia' }, { status: 400 })
    }

    const raw = await archivo.text()
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

    const estado = await obtenerEstadoLicencia()
    if (machineId !== estado.machineId) {
      return NextResponse.json({ error: 'Esta licencia no corresponde a este equipo' }, { status: 400 })
    }

    if (!validarFirma(machineId, expiresAt, firma)) {
      return NextResponse.json({ error: 'Firma de licencia inválida' }, { status: 400 })
    }

    if (new Date(expiresAt) < new Date()) {
      return NextResponse.json({ error: 'La licencia ya expiró' }, { status: 400 })
    }

    await prisma.config.upsert({
      where: { clave: 'licenciaToken' },
      update: { valor: firma },
      create: { clave: 'licenciaToken', valor: firma }
    })
    await prisma.config.upsert({
      where: { clave: 'licenciaExpira' },
      update: { valor: expiresAt },
      create: { clave: 'licenciaExpira', valor: expiresAt }
    })

    return NextResponse.json({ ok: true, expiraEn: expiresAt })
  } catch (e) {
    console.error('Error al cargar licencia:', e)
    return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 })
  }
}