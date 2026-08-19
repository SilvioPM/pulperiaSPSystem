import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import { parseNumber } from '@/lib/number'
import { sanitizarEntrada } from '@/lib/sanitizar'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const buscar = searchParams.get('buscar')
    const page = Math.max(1, parseInt(searchParams.get('page') || 1))
    const limit = Math.min(10000, Math.max(1, parseInt(searchParams.get('limit') || 30)))

    const where = buscar ? { nombre: { contains: buscar, mode: 'insensitive' } } : {}

    const [clientes, total] = await Promise.all([
      prisma.cliente.findMany({
        where,
        orderBy: { nombre: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          _count: { select: { facturas: true } }
        }
      }),
      prisma.cliente.count({ where })
    ])

    const ids = clientes.map(c => c.id)
    const deudas = ids.length > 0
      ? await prisma.factura.groupBy({
          by: ['clienteId'],
          where: { clienteId: { in: ids }, esCredito: true, estado: { not: 'anulada' } },
          _sum: { saldoPendiente: true }
        })
      : []

    const deudaMap = {}
    deudas.forEach(d => { deudaMap[d.clienteId] = d._sum.saldoPendiente || 0 })

    const data = clientes.map(c => ({
      ...c,
      deuda: deudaMap[c.id] || 0
    }))

    return NextResponse.json({
      data,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    })
  } catch (error) {
    return NextResponse.json({ error: 'Error al obtener clientes' }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const body = sanitizarEntrada(await request.json(), 300)

    let codigo = body.codigo || null
    if (!codigo) {
      const ultimo = await prisma.cliente.findFirst({ orderBy: { id: 'desc' }, select: { id: true } })
      const secuencia = (ultimo?.id || 0) + 1
      codigo = `CLT-${String(secuencia).padStart(5, '0')}`
    }

    const cliente = await prisma.cliente.create({
      data: {
        nombre: body.nombre,
        codigo,
        telefono: body.telefono || null,
        cedula: body.cedula || null,
        direccion: body.direccion || null,
        limiteCredito: parseNumber(body.limiteCredito || 0),
        saldoInicial: parseNumber(body.saldoInicial || 0)
      }
    })
    return NextResponse.json(cliente, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Error al crear cliente' }, { status: 500 })
  }
}
