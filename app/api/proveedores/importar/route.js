import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(req) {
  try {
    const body = await req.json()
    const { proveedores } = body

    if (!Array.isArray(proveedores) || proveedores.length === 0) {
      return NextResponse.json({ error: 'Enviá un array de proveedores' }, { status: 400 })
    }

    let creados = 0, actualizados = 0, errores = []

    for (const p of proveedores) {
      if (!p.nombre) { errores.push({ fila: errores.length + 1, error: 'nombre requerido' }); continue }
      try {
        const nombre = p.nombre.trim().replace(/^["']|["']$/g, '')
        let contacto = (p.contacto || '').toString().trim().replace(/^["']|["']$/g, '') || null
        let telefono = (p.telefono || '').toString().trim().replace(/^["']|["']$/g, '') || null
        let email = (p.email || '').toString().trim().replace(/^["']|["']$/g, '') || null
        let direccion = (p.direccion || '').toString().trim().replace(/^["']|["']$/g, '') || null
        const saldoInicialCxp = parseFloat(p.saldoInicialCxp) || 0

        const existente = await prisma.proveedor.findFirst({
          where: { nombre: { equals: nombre, mode: 'insensitive' } }
        })

        if (existente) {
          await prisma.proveedor.update({
            where: { id: existente.id },
            data: { contacto, telefono, email, direccion, saldoInicialCxp }
          })
          actualizados++
        } else {
          await prisma.proveedor.create({
            data: { nombre, contacto, telefono, email, direccion, saldoInicialCxp }
          })
          creados++
        }
      } catch (e) {
        errores.push({ fila: errores.length + 1, error: e.message })
      }
    }

    return NextResponse.json({ creados, actualizados, errores, total: proveedores.length })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
