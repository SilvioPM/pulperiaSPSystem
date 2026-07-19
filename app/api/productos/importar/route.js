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

const venta2Common = {
  unidadVenta2: String(fila['UnidadVenta2'] || '').trim() || null,
  precioVenta2: parseFloat(fila['PrecioVenta2'] || 0),
  costoVenta2:  parseFloat(fila['CostoVenta2'] || 0),
  factorVenta2: parseFloat(fila['FactorVenta2'] || 1),
}
const venta3Common = {
  unidadVenta3: String(fila['UnidadVenta3'] || '').trim() || null,
  precioVenta3: parseFloat(fila['PrecioVenta3'] || 0),
  costoVenta3:  parseFloat(fila['CostoVenta3'] || 0),
  factorVenta3: parseFloat(fila['FactorVenta3'] || 1),
}
const venta4Common = {
  unidadVenta4: String(fila['UnidadVenta4'] || '').trim() || null,
  precioVenta4: parseFloat(fila['PrecioVenta4'] || 0),
  costoVenta4:  parseFloat(fila['CostoVenta4'] || 0),
  factorVenta4: parseFloat(fila['FactorVenta4'] || 1),
}
const mayoristaCommon = {
  precioMayor: parseFloat(fila['PrecioMayor'] || 0),
  cantidadMinimaMayor: parseFloat(fila['CantidadMinimaMayor'] || 0),
}
const fechaVenc = fila['FechaVencimiento'] ? new Date(fila['FechaVencimiento']) : null
const stockImport = parseInt(fila['Stock'] || 0)

const nombreProd = String(fila['Nombre'] || '').trim()
const codigoProd = String(fila['Codigo'] || '').trim()
const esGenerico = String(fila['EsGenerico'] || '').toUpperCase() === 'TRUE'

let productoId = null
if (codigoProd) {
  const prod = await prisma.producto.upsert({
    where: { codigo: codigoProd },
    update: {
      nombre:      nombreProd,
      precio:      parseFloat(fila['Precio'] || 0),
      costo:       parseFloat(fila['Costo']  || 0),
      stock:       stockImport,
      stockMinimo: parseInt(fila['StockMinimo'] || 5),
      unidad:      String(fila['Unidad'] || 'unidad').trim(),
      categoriaId: categoria.id,
      esGenerico,
      ...venta2Common,
      ...venta3Common,
      ...venta4Common,
      ...mayoristaCommon
    },
    create: {
      nombre:      nombreProd,
      codigo:      codigoProd,
      precio:      parseFloat(fila['Precio'] || 0),
      costo:       parseFloat(fila['Costo']  || 0),
      stock:       stockImport,
      stockMinimo: parseInt(fila['StockMinimo'] || 5),
      unidad:      String(fila['Unidad'] || 'unidad').trim(),
      categoriaId: categoria.id,
      esGenerico,
      ...venta2Common,
      ...venta3Common,
      ...venta4Common,
      ...mayoristaCommon
    }
  })
  productoId = prod.id
} else if (nombreProd) {
  const existente = await prisma.producto.findFirst({ where: { nombre: { equals: nombreProd, mode: 'insensitive' } } })
  if (existente) {
    await prisma.producto.update({
      where: { id: existente.id },
      data: {
        precio:      parseFloat(fila['Precio'] || 0),
        costo:       parseFloat(fila['Costo']  || 0),
        stock:       stockImport,
        stockMinimo: parseInt(fila['StockMinimo'] || 5),
        unidad:      String(fila['Unidad'] || 'unidad').trim(),
        categoriaId: categoria.id,
        esGenerico,
        ...venta2Common,
        ...venta3Common,
        ...venta4Common,
        ...mayoristaCommon
      }
    })
    productoId = existente.id
  } else {
    const prod = await prisma.producto.create({
      data: {
        nombre:      nombreProd,
        codigo:      null,
        precio:      parseFloat(fila['Precio'] || 0),
        costo:       parseFloat(fila['Costo']  || 0),
        stock:       stockImport,
        stockMinimo: parseInt(fila['StockMinimo'] || 5),
        unidad:      String(fila['Unidad'] || 'unidad').trim(),
        categoriaId: categoria.id,
        esGenerico,
        ...venta2Common,
        ...venta3Common,
        ...venta4Common,
        ...mayoristaCommon
      }
    })
    productoId = prod.id
  }
}
if (productoId && fechaVenc) {
  const venc = new Date(fechaVenc)
  venc.setHours(23, 59, 59, 999)
  await prisma.producto.update({
    where: { id: productoId },
    data: { fechaVencimiento: venc }
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