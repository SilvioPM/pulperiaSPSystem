import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sanitizarEntrada } from '@/lib/sanitizar'

export async function POST(req) {
  try {
    const body = await req.json()
    const { clientes } = body

    if (!Array.isArray(clientes) || clientes.length === 0) {
      return NextResponse.json({ error: 'Enviá un array de clientes' }, { status: 400 })
    }

    // Límite de elementos
    if (clientes.length > 5000) {
      return NextResponse.json({ error: 'Demasiados clientes. Máximo 5000' }, { status: 400 })
    }

    let creados = 0, actualizados = 0, errores = []

    for (const c of clientes) {
      if (!c.nombre) { errores.push({ fila: errores.length + 1, error: 'nombre requerido' }); continue }
      try {
        const sanitizar = (v) => v ? String(v).trim().slice(0, 500) : ''
        const nombre = sanitizar(c.nombre)
        let telefono = sanitizar(c.telefono) || null
        let cedula = sanitizar(c.cedula) || null
        let direccion = sanitizar(c.direccion) || null
        const limiteCredito = parseFloat(c.limiteCredito) || 0
        const saldoInicial = parseFloat(c.saldoInicial) || 0

        const orConditions = [{ nombre: { equals: nombre, mode: 'insensitive' } }]
        if (cedula) orConditions.push({ cedula: { equals: cedula, mode: 'insensitive' } })
        const existente = await prisma.cliente.findFirst({
          where: { OR: orConditions }
        })

        if (existente) {
          await prisma.cliente.update({
            where: { id: existente.id },
            data: { telefono, cedula, direccion, limiteCredito, saldoInicial }
          })
          actualizados++
        } else {
          await prisma.cliente.create({
            data: { nombre, telefono, cedula, direccion, limiteCredito, saldoInicial }
          })
          creados++
        }
      } catch (e) {
        errores.push({ fila: errores.length + 1, error: e.message })
      }
    }

    return NextResponse.json({ creados, actualizados, errores, total: clientes.length })
  } catch (e) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
