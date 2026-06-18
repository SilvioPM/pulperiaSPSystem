import { numeroALetras, generarXmlDgi } from '../../lib/facturaDgi'

describe('numeroALetras', () => {
  it('converts 0', () => {
    expect(numeroALetras(0)).toBe('CERO CÓRDOBAS CON 00/100')
  })

  it('converts 1', () => {
    expect(numeroALetras(1)).toBe('UN CÓRDOBAS CON 00/100')
  })

  it('converts 15', () => {
    expect(numeroALetras(15)).toBe('QUINCE CÓRDOBAS CON 00/100')
  })

  it('converts 100', () => {
    expect(numeroALetras(100)).toBe('CIEN CÓRDOBAS CON 00/100')
  })

  it('converts 101', () => {
    expect(numeroALetras(101)).toBe('CIENTO UN CÓRDOBAS CON 00/100')
  })

  it('converts 1000', () => {
    expect(numeroALetras(1000)).toBe('UN MIL CÓRDOBAS CON 00/100')
  })

  it('converts 450.50 with decimals', () => {
    expect(numeroALetras(450.50)).toBe('CUATROCIENTOS CINCUENTA CÓRDOBAS CON 50/100')
  })

  it('handles large numbers', () => {
    const result = numeroALetras(1500000)
    expect(result).toContain('MILLÓN')
    expect(result).toContain('CÓRDOBAS')
  })
})

describe('generarXmlDgi', () => {
  const factura = {
    numero: 'F001-001',
    creadoEn: '2026-06-05T10:30:00Z',
    metodoPago: 'efectivo',
    pagoCon: 500,
    subtotal: 400,
    descuento: 0,
    iva: 50,
    total: 450,
    cliente: { nombre: 'Test Cliente', direccion: 'Managua', cedula: '001-010201-0000X' },
    detalles: [
      { cantidad: 2, precio: 100, subtotal: 200, producto: { codigo: '001', nombre: 'Arroz' } },
    ],
  }

  const config = {
    ruc: 'J0310000212345',
    nrc: '123456',
    cai: 'A1B2C3D4E5F6G7H8I9J0',
    nombre: 'Mi Pulpería',
    direccion: 'Managua',
    telefono: '8888-8888',
    tasaCambio: '36.5',
  }

  it('generates valid XML structure', () => {
    const xml = generarXmlDgi(factura, config)
    expect(xml).toContain('<?xml version="1.0"')
    expect(xml).toContain('<FacturaElectronica')
    expect(xml).toContain('<RUC>J0310000212345</RUC>')
    expect(xml).toContain('<NRC>123456</NRC>')
    expect(xml).toContain('<CAI>A1B2C3D4E5F6G7H8I9J0</CAI>')
    expect(xml).toContain('<NumeroFactura>F001-001</NumeroFactura>')
  })

  it('includes payment details', () => {
    const xml = generarXmlDgi(factura, config)
    expect(xml).toContain('<MetodoPago>efectivo</MetodoPago>')
    expect(xml).toContain('<Moneda>NIO</Moneda>')
  })

  it('handles mixed payments in XML', () => {
    const withMixed = {
      ...factura,
      detallesPago: JSON.stringify([
        { metodo: 'efectivo', monto: '300' },
        { metodo: 'tarjeta', monto: '150' },
      ]),
    }
    const xml = generarXmlDgi(withMixed, config)
    expect(xml).toContain('<Tipo>efectivo</Tipo>')
    expect(xml).toContain('<Tipo>tarjeta</Tipo>')
  })
})
