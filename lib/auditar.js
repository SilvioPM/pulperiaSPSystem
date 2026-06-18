import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

export async function auditar({ usuario, accion, entidad, detalle }) {
  try {
    await prisma.auditoria.create({
      data: { usuario, accion, entidad, detalle: detalle ? String(detalle) : null }
    })
  } catch (e) {
    console.error('Error al auditar:', e)
  }
}