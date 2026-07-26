const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function main() {
  console.log('=== LIMPIEZA DE BASE DE DATOS ===')
  console.log('Se preservará: Config (licencia), Usuarios\n')

  const args = process.argv.slice(2)
  const conservarMaestros = args.includes('--conservar-maestros')
  const soloTransacciones = args.includes('--solo-transacciones')

  if (args.length === 0) {
    console.log('MODOS:')
    console.log('  --solo-transacciones    Limpia facturas, compras, movimientos, caja, proformas, gastos')
    console.log('                          Conserva: productos, clientes, proveedores, categorías')
    console.log('  --conservar-maestros    Lo mismo + conserva productos, clientes, proveedores, cat.')
    console.log('  (sin flag)              Limpia TODO excepto Config y Usuarios\n')
  }

  if (!soloTransacciones && !conservarMaestros) {
    console.log('⚠️   LIMPIEZA COMPLETA (solo se preservan Config y Usuarios)')
    const rl = require('readline').createInterface({ input: process.stdin, output: process.stdout })
    const respuesta = await new Promise(resolve => {
      rl.question('¿Estás seguro? (escribí "SI" para confirmar): ', resolve)
    })
    rl.close()
    if (respuesta !== 'SI') {
      console.log('Operación cancelada.')
      process.exit(0)
    }
  }

  console.log('\nLimpiando...\n')

  // Orden inverso por claves foráneas
  if (soloTransacciones || conservarMaestros) {
    await prisma.abono.deleteMany()
    console.log('  ✓ Abonos')
    await prisma.cuentaXCobrar.deleteMany()
    console.log('  ✓ Cuentas por cobrar')
    await prisma.detalleFactura.deleteMany()
    console.log('  ✓ Detalles de factura')
    await prisma.factura.deleteMany()
    console.log('  ✓ Facturas')
    await prisma.detalleCompra.deleteMany()
    console.log('  ✓ Detalles de compra')
    await prisma.compra.deleteMany()
    console.log('  ✓ Compras')
    await prisma.detalleProforma.deleteMany()
    console.log('  ✓ Detalles de proforma')
    await prisma.proforma.deleteMany()
    console.log('  ✓ Proformas')
    await prisma.gasto.deleteMany()
    console.log('  ✓ Gastos')
    await prisma.movInventario.deleteMany()
    console.log('  ✓ Movimientos de inventario')
    await prisma.movCaja.deleteMany()
    console.log('  ✓ Movimientos de caja')
    await prisma.cierreCaja.deleteMany()
    console.log('  ✓ Cierres de caja')
    await prisma.caja.deleteMany()
    console.log('  ✓ Caja')
    await prisma.cartSession.deleteMany()
    console.log('  ✓ Sesiones de carrito')
    await prisma.respaldo.deleteMany()
    console.log('  ✓ Respaldos')
    await prisma.auditoria.deleteMany()
    console.log('  ✓ Auditoría')

    // Resetear stock
    await prisma.producto.updateMany({ data: { stock: 0 } })
    console.log('  ✓ Stock reiniciado a 0')
  }

  if (!soloTransacciones && !conservarMaestros) {
    // Limpieza completa
    await prisma.abono.deleteMany()
    await prisma.cuentaXCobrar.deleteMany()
    await prisma.detalleFactura.deleteMany()
    await prisma.factura.deleteMany()
    await prisma.detalleCompra.deleteMany()
    await prisma.compra.deleteMany()
    await prisma.detalleProforma.deleteMany()
    await prisma.proforma.deleteMany()
    await prisma.gasto.deleteMany()
    await prisma.movInventario.deleteMany()
    await prisma.movCaja.deleteMany()
    await prisma.cierreCaja.deleteMany()
    await prisma.caja.deleteMany()
    await prisma.cartSession.deleteMany()
    await prisma.respaldo.deleteMany()
    await prisma.auditoria.deleteMany()
    await prisma.productoCodigo.deleteMany()
    await prisma.producto.deleteMany()
    await prisma.categoria.deleteMany()
    await prisma.cliente.deleteMany()
    await prisma.proveedor.deleteMany()
    await prisma.producto.deleteMany()
    console.log('  ✓ Productos, categorías, clientes, proveedores')
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