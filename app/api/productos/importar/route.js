import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import * as XLSX from 'xlsx'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const archivo  = formData.get('archivo')

    if (!archivo) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    // Convertimos el archivo a buffer para que xlsx lo pueda leer
    const buffer   = await archivo.arrayBuffer()
    const workbook = XLSX.read(buffer, { type: 'array' })

    // Tomamos la primera hoja del Excel
    const hoja     = workbook.Sheets[workbook.SheetNames[0]]
    const filas    = XLSX.utils.sheet_to_json(hoja)

    const resultados = { exitosos: 0, fallidos: 0, errores: [] }

    for (const fila of filas) {
      try {
        // Buscamos la categoría por nombre
        const nombreCat = String(fila['Categoria'] || fila['Categoría'] || '').trim()
        let categoria   = await prisma.categoria.findFirst({
          where: { nombre: { equals: nombreCat } }
        })

        // Si la categoría no existe, la creamos automáticamente
        if (!categoria && nombreCat) {
          categoria = await prisma.categoria.create({
            data: { nombre: nombreCat }
          })
        }

        if (!categoria) {
          resultados.fallidos++
          resultados.errores.push(`Fila "${fila['Nombre']}": Categoría vacía`)
          continue
        }

        // Si tiene código, usamos upsert para evitar duplicados
if (fila['Codigo'] && String(fila['Codigo']).trim()) {
  await prisma.producto.upsert({
    where: { codigo: String(fila['Codigo']).trim() },
    update: {
      nombre:      String(fila['Nombre'] || '').trim(),
      precio:      parseFloat(fila['Precio'] || 0),
      costo:       parseFloat(fila['Costo']  || 0),
      stock:       parseInt(fila['Stock']    || 0),
      stockMinimo: parseInt(fila['StockMinimo'] || 5),
      unidad:      String(fila['Unidad'] || 'unidad').trim(),
      categoriaId: categoria.id
    },
    create: {
      nombre:      String(fila['Nombre'] || '').trim(),
      codigo:      String(fila['Codigo']).trim(),
      precio:      parseFloat(fila['Precio'] || 0),
      costo:       parseFloat(fila['Costo']  || 0),
      stock:       parseInt(fila['Stock']    || 0),
      stockMinimo: parseInt(fila['StockMinimo'] || 5),
      unidad:      String(fila['Unidad'] || 'unidad').trim(),
      categoriaId: categoria.id
    }
  })
} else {
  // Sin código, siempre creamos nuevo
  await prisma.producto.create({
    data: {
      nombre:      String(fila['Nombre'] || '').trim(),
      codigo:      null,
      precio:      parseFloat(fila['Precio'] || 0),
      costo:       parseFloat(fila['Costo']  || 0),
      stock:       parseInt(fila['Stock']    || 0),
      stockMinimo: parseInt(fila['StockMinimo'] || 5),
      unidad:      String(fila['Unidad'] || 'unidad').trim(),
      categoriaId: categoria.id
    }
  })
}
        resultados.exitosos++

      } catch (err) {
        resultados.fallidos++
        resultados.errores.push(`Fila "${fila['Nombre']}": ${err.message}`)
      }
    }

    return NextResponse.json(resultados)

  } catch (error) {
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 })
  }
}