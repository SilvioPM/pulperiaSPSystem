const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.proveedor.findFirst({ where: { nombre: 'Test' } })
  .then(r => console.log(r ? 'found: ' + r.nombre : 'not found'))
  .catch(e => console.log('ERR:', e.message))
  .finally(() => p.$disconnect());
