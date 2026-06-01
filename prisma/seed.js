const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

async function main() {
  const existing = await prisma.usuario.findUnique({ where: { username: 'admin' } })
  if (existing) {
    console.log('Admin user already exists')
    return
  }

  const password = await bcrypt.hash('admin123', 10)
  await prisma.usuario.create({
    data: {
      username: 'admin',
      password,
      nombre: 'Administrador',
      esAdmin: true,
      rol: 'admin',
      modulos: '[]',
    },
  })
  console.log('Admin user created: admin / admin123')
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
