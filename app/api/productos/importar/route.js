import { prisma } from '@/lib/prisma'
import { NextResponse } from 'next/server'
import Excel from 'exceljs'

export async function POST(request) {
  try {
    const formData = await request.formData()
    const archivo  = formData.get('archivo')

    if (!archivo) {
      return NextResponse.json({ error: 'No se recibió archivo' }, { status: 400 })
    }

    const buffer   = Buffer.from(await archivo.arrayBuffer())
    const workbook = new Excel.Workbook()
    await workbook.xlsx.load(buffer)
    const worksheet = workbook.worksheets[0]

    const filas = []
    const rowCount = worksheet.rowCount
    if (rowCount > 1) {
      const headers = []
      worksheet.getRow(1).eachCell((cell, col) => { headers[col] = cell.value })
      for (let i = 2; i <= rowCount; i++) {
        const row = worksheet.getRow(i)
        const obj = {}
        row.eachCell((cell, col) => { obj[headers[col]] = cell.value })
        filas.push(obj)
      }
    }

    const resultados = { exitosos: 0, fallidos: 0, errores: [] }

    for (const fila of filas) {
      try {
        const nombreCat = String(fila['Categoria'] || fila['Categoría'] || '').trim()
        let categoria   = await prisma.categoria.findFirst({
          where: { nombre: { equals: nombreCat } }
        })

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
    console.error('Error al importar:', error)
    return NextResponse.json({ error: 'Error al procesar el archivo' }, { status: 500 })
  }
}