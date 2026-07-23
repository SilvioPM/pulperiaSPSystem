const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')

const prisma = new PrismaClient()

const UNIDADES = [
  'Unidad', 'Libras', 'Kilogramos', 'Onzas', 'Gramos',
  'Litros', 'Mililitros', 'Galones', 'Botellas', 'Latas',
  'Paquetes', 'Cajas', 'Bolsa', 'Docena', 'Medio Litro',
  'Cuarto de Galón', 'Barril', 'Rollos', 'Porciones', 'Sacos',
]

const CATEGORIAS = [
  'Abarrotes', 'Bebidas', 'Lácteos', 'Panadería', 'Carnes',
  'Frutas y Verduras', 'Limpieza', 'Higiene Personal', 'Otros',
]

async function main() {
  const adminExists = await prisma.usuario.findUnique({ where: { username: 'admin' } })
  if (!adminExists) {
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
    console.log('Admin user created successfully')
  } else {
    console.log('Admin user already exists')
  }

  for (const nombre of UNIDADES) {
    await prisma.unidadMedida.upsert({
      where: { nombre },
      update: {},
      create: { nombre },
    })
  }
  console.log(`Units: ${UNIDADES.length} created/verified`)

  for (const nombre of CATEGORIAS) {
    const existing = await prisma.categoria.findFirst({ where: { nombre } })
    if (!existing) {
      await prisma.categoria.create({ data: { nombre } })
    }
  }
  console.log(`Categories: ${CATEGORIAS.length} created/verified`)
}

main()
  .catch(e => console.error(e))
  .finally(() => prisma.$disconnect())
