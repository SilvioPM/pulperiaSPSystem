const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== LIMPIEZA DE BASE DE DATOS ===')
  console.log('Se preservara: Config (licencia), Usuarios\n')

  const args = process.argv.slice(2)
  const soloTransacciones = args.includes('--solo-transacciones')

  if (args.length === 0 || args.includes('--help')) {
    console.log('MODOS:')
    console.log('  --solo-transacciones    Limpia facturas, compras, caja, proformas, gastos,')
    console.log('                          movimientos. Conserva: productos, clientes,')
    console.log('                          proveedores, categorias, unidades de medida.')
    console.log('  (sin flag)              Limpia TODO excepto Config y Usuarios')
    console.log('                          (pide confirmacion)\n')
    if (args.includes('--help')) process.exit(0)
  }

  if (!soloTransacciones) {
    console.log('⚠️   LIMPIEZA COMPLETA (solo se preservan Config y Usuarios)')
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout })
    const respuesta = await new Promise(resolve => {
      rl.question('¿Estas seguro? (escribi "SI" para confirmar): ', resolve)
    })
    rl.close()
    if (respuesta !== 'SI') {
      console.log('Operacion cancelada.')
      process.exit(0)
    }
  }

  console.log('\nLimpiando...\n')

  const paso = async (nombre, fn) => {
    await fn()
    console.log(`  ✓ ${nombre}`)
  }

  // Orden inverso por claves foraneas

  await paso('Arqueos de caja', () => prisma.arqueoDetalle.deleteMany())
  await paso('Movimientos de caja', () => prisma.movimientoCaja.deleteMany())
  await paso('Abonos de compras', () => prisma.abonoCompra.deleteMany())
  await paso('Abonos de facturas', () => prisma.abono.deleteMany())
  await paso('Detalles de factura', () => prisma.detalleFac.deleteMany())
  await paso('Detalles de compra', () => prisma.detalleCompra.deleteMany())
  await paso('Detalles de proforma', () => prisma.detalleProforma.deleteMany())
  await paso('Facturas', () => prisma.factura.deleteMany())
  await paso('Compras', () => prisma.compra.deleteMany())
  await paso('Proformas', () => prisma.proforma.deleteMany())
  await paso('Movimientos de inventario', () => prisma.movInventario.deleteMany())
  await paso('Gastos', () => prisma.gasto.deleteMany())
  await paso('Sesiones de carrito', () => prisma.cartSession.deleteMany())
  await paso('Auditoria', () => prisma.auditoria.deleteMany())

  await paso('Caja', () => prisma.caja.deleteMany())

  if (soloTransacciones) {
    await paso('Stock reiniciado a 0', () => prisma.producto.updateMany({ data: { stock: 0 } }))
  } else {
    // Limpieza completa: borrar maestros
    await paso('Codigos de producto', () => prisma.productoCodigo.deleteMany())
    await paso('Productos', () => prisma.producto.deleteMany())
    await paso('Categorias', () => prisma.categoria.deleteMany())
    await paso('Clientes', () => prisma.cliente.deleteMany())
    await paso('Proveedores', () => prisma.proveedor.deleteMany())
    await paso('Unidades de medida', () => prisma.unidadMedida.deleteMany())
  }

  console.log('\n✅ Limpieza completada.')
  console.log('   Config (licencia) y Usuarios preservados.')
}

main()
  .catch(e => {
    console.error('ERROR:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())