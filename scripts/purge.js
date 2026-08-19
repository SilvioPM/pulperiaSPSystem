#!/usr/bin/env node
// Script de purga/retención de datos antiguos
// Uso: node scripts/purge.js [--dry-run]
// Configurable via variables de entorno:
//   PURGE_AUDITORIA_DIAS=180     (6 meses default)
//   PURGE_MOVINVENTARIO_DIAS=365 (1 año default)
//   PURGE_CARTSESSION_DIAS=7     (7 días default)

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DIAS_AUDITORIA = parseInt(process.env.PURGE_AUDITORIA_DIAS || '180')
const DIAS_MOVINVENTARIO = parseInt(process.env.PURGE_MOVINVENTARIO_DIAS || '365')
const DIAS_CARTSESSION = parseInt(process.env.PURGE_CARTSESSION_DIAS || '7')
const DRY_RUN = process.argv.includes('--dry-run')

async function main() {
  console.log('=== Iniciando purga de datos antiguos ===')
  console.log(`Modo: ${DRY_RUN ? 'DRY-RUN (sin borrar)' : 'EJECUCIÓN REAL'}`)
  console.log(`Retención: Auditoria=${DIAS_AUDITORIA}d, MovInventario=${DIAS_MOVINVENTARIO}d, CartSession=${DIAS_CARTSESSION}d`)

  const ahora = new Date()
  const corteAuditoria = new Date(ahora.getTime() - DIAS_AUDITORIA * 24 * 60 * 60 * 1000)
  const corteMovInventario = new Date(ahora.getTime() - DIAS_MOVINVENTARIO * 24 * 60 * 60 * 1000)
  const corteCartSession = new Date(ahora.getTime() - DIAS_CARTSESSION * 24 * 60 * 60 * 1000)

  try {
    // 1. Purgar Auditoria
    const whereAuditoria = { createdAt: { lt: corteAuditoria } }
    const countAuditoria = await prisma.auditoria.count({ where: whereAuditoria })
    console.log(`\nAuditoria: ${countAuditoria} registros > ${DIAS_AUDITORIA} días`)
    if (!DRY_RUN && countAuditoria > 0) {
      const result = await prisma.auditoria.deleteMany({ where: whereAuditoria })
      console.log(`  Eliminados: ${result.count}`)
    } else if (DRY_RUN) {
      console.log(`  [DRY-RUN] Se eliminarían ${countAuditoria}`)
    }

    // 2. Purgar MovInventario (solo movimientos de ajuste/manual, no ventas/compras)
    // Conservamos los de tipo 'entrada'/'salida' por ventas/compras (tienen motivo que empieza con 'Venta'/'Compra'/'Anulación')
    const whereMovInventario = {
      createdAt: { lt: corteMovInventario },
      NOT: {
        motivo: {
          startsWith: 'Venta',
        },
      },
    }
    // También excluir 'Compra' y 'Anulación'
    const whereMovInventario2 = {
      createdAt: { lt: corteMovInventario },
      motivo: {
        not: {
          in: ['Venta', 'Compra', 'Anulación', 'Factura'],
        },
      },
    }
    // Simplificar: borrar solo los que NO tienen motivo de venta/compra/anulación
    const whereMov = {
      createdAt: { lt: corteMovInventario },
      motivo: {
        not: { startsWith: 'Venta ' },
      },
    }
    // Usar raw query para lógica compleja
    const countMov = await prisma.movInventario.count({
      where: {
        createdAt: { lt: corteMovInventario },
        NOT: [
          { motivo: { startsWith: 'Venta' } },
          { motivo: { startsWith: 'Compra' } },
          { motivo: { startsWith: 'Anulación' } },
          { motivo: { startsWith: 'Factura' } },
        ],
      },
    })
    console.log(`\nMovInventario (ajustes manuales): ${countMov} registros > ${DIAS_MOVINVENTARIO} días`)
    if (!DRY_RUN && countMov > 0) {
      const result = await prisma.movInventario.deleteMany({
        where: {
          createdAt: { lt: corteMovInventario },
          NOT: [
            { motivo: { startsWith: 'Venta' } },
            { motivo: { startsWith: 'Compra' } },
            { motivo: { startsWith: 'Anulación' } },
            { motivo: { startsWith: 'Factura' } },
          ],
        },
      })
      console.log(`  Eliminados: ${result.count}`)
    } else if (DRY_RUN) {
      console.log(`  [DRY-RUN] Se eliminarían ${countMov}`)
    }

    // 3. Purgar CartSession antiguas (tickets en espera abandonados)
    const countCart = await prisma.cartSession.count({
      where: { creadoEn: { lt: corteCartSession } },
    })
    console.log(`\nCartSession: ${countCart} registros > ${DIAS_CARTSESSION} días`)
    if (!DRY_RUN && countCart > 0) {
      const result = await prisma.cartSession.deleteMany({ where: { creadoEn: { lt: corteCartSession } } })
      console.log(`  Eliminados: ${result.count}`)
    } else if (DRY_RUN) {
      console.log(`  [DRY-RUN] Se eliminarían ${countCart}`)
    }

    console.log('\n=== Purga completada ===')
  } catch (error) {
    console.error('Error en purga:', error)
    process.exit(1)
  } finally {
    await prisma.$disconnect()
  }
}

main()