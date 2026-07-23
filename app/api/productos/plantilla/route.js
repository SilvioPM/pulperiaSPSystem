import { NextResponse } from 'next/server'
import Excel from 'exceljs'

export async function GET() {
  const workbook = new Excel.Workbook()
  const sheet = workbook.addWorksheet('Productos')

  const headers = [
    'Nombre', 'Codigo', 'Precio', 'Costo', 'Stock', 'StockMinimo',
    'Unidad', 'Categoria',
    'UnidadVenta2', 'PrecioVenta2', 'CostoVenta2', 'FactorVenta2',
    'UnidadVenta3', 'PrecioVenta3', 'CostoVenta3', 'FactorVenta3',
    'UnidadVenta4', 'PrecioVenta4', 'CostoVenta4', 'FactorVenta4',
    'EsGenerico', 'PrecioMayor', 'CantidadMinimaMayor', 'FechaVencimiento',
    'CodigosAlias'
  ]
  sheet.addRow(headers)

  sheet.addRow(['Ejemplo Arroz', 'AR001', 15, 12, 100, 10, 'libra', 'Granos', 'quintal', 1200, 1000, 100, '', 0, 0, 1, '', 0, 0, 1, 'FALSE', 13, 12, '2026-12-31', '7501234567, 7501234568'])

  sheet.getRow(1).font = { bold: true }

  const buffer = await workbook.xlsx.writeBuffer()
  return new NextResponse(buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename=plantilla_productos.xlsx'
    }
  })
}
