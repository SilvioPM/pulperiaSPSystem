import { NextResponse } from 'next/server'
import Excel from 'exceljs'

export async function GET() {
  const workbook = new Excel.Workbook()
  const sheet = workbook.addWorksheet('Productos')

  const headers = [
    'Nombre', 'Codigo', 'Precio', 'Costo', 'Stock', 'StockMinimo',
    'Unidad', 'Categoria', 'UnidadVenta2', 'PrecioVenta2', 'CostoVenta2', 'FactorVenta2'
  ]
  sheet.addRow(headers)

  sheet.addRow(['Ejemplo Arroz', 'AR001', 15, 12, 100, 10, 'libra', 'Granos', 'quintal', 1200, 1000, 100])

  sheet.getRow(1).font = { bold: true }

  const buffer = await workbook.xlsx.writeBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=plantilla_productos.xlsx'
    }
  })
}
