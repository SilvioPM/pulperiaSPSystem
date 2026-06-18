import { render, screen } from '@testing-library/react'
import FacturaRecibo from '../components/FacturaRecibo'

describe('FacturaRecibo', () => {
  const mockFactura = {
    numero: 'F001-001',
    creadoEn: '2026-06-05T10:30:00Z',
    metodoPago: 'efectivo',
    pagoCon: 500,
    cambio: 50,
    subtotal: 400,
    descuento: 0,
    iva: 50,
    total: 450,
    cliente: { nombre: 'Juan Pérez' },
    detalles: [
      { id: 1, cantidad: 2, precio: 100, subtotal: 200, producto: { nombre: 'Arroz' } },
      { id: 2, cantidad: 1, precio: 200, subtotal: 200, producto: { nombre: 'Frijoles' } },
    ],
  }

  it('renders factura header and data', () => {
    render(<FacturaRecibo factura={mockFactura} config={{ nombre: 'Mi Pulpería', tasaCambio: 36.5 }} />)
    expect(screen.getByText(/F001-001/)).toBeInTheDocument()
    expect(screen.getByText(/Juan Pérez/)).toBeInTheDocument()
    expect(screen.getByText(/Arroz/)).toBeInTheDocument()
    expect(screen.getByText(/Frijoles/)).toBeInTheDocument()
  })

  it('shows total amount', () => {
    render(<FacturaRecibo factura={mockFactura} config={{}} />)
    expect(screen.getByText(/C\$ 450\.00/)).toBeInTheDocument()
  })

  it('shows discount when present', () => {
    const withDiscount = { ...mockFactura, descuento: 25, total: 425 }
    render(<FacturaRecibo factura={withDiscount} config={{}} />)
    expect(screen.getByText(/- C\$ 25\.00/)).toBeInTheDocument()
  })

  it('shows mixed payment details', () => {
    const mixedPayment = {
      ...mockFactura,
      detallesPago: JSON.stringify([
        { metodo: 'efectivo', monto: '300', moneda: 'C$' },
        { metodo: 'tarjeta', monto: '150', moneda: 'C$' },
      ]),
    }
    render(<FacturaRecibo factura={mixedPayment} config={{}} />)
    expect(screen.getByText('Pagos:')).toBeInTheDocument()
  })

  it('shows default footer message', () => {
    render(<FacturaRecibo factura={mockFactura} config={{}} />)
    expect(screen.getByText(/¡Gracias por su compra!/)).toBeInTheDocument()
  })
})
