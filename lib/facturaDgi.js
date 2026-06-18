export function generarXmlDgi(factura, config) {
  const fecha = new Date(factura.creadoEn)
  const f = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`
  const h = `${String(fecha.getHours()).padStart(2, '0')}:${String(fecha.getMinutes()).padStart(2, '0')}:${String(fecha.getSeconds()).padStart(2, '0')}`

  const dp = factura.detallesPago ? (typeof factura.detallesPago === 'string' ? JSON.parse(factura.detallesPago) : factura.detallesPago) : null

  return `<?xml version="1.0" encoding="UTF-8"?>
<FacturaElectronica xmlns="http://www.dgi.gob.ni">
  <Encabezado>
    <Emisor>
      <RUC>${config.ruc || ''}</RUC>
      <NRC>${config.nrc || ''}</NRC>
      <Nombre>${config.nombre || ''}</Nombre>
      <Direccion>${config.direccion || ''}</Direccion>
      <Telefono>${config.telefono || ''}</Telefono>
    </Emisor>
    <Receptor>
      <Nombre>${factura.cliente?.nombre || 'Consumidor Final'}</Nombre>
      <Direccion>${factura.cliente?.direccion || ''}</Direccion>
      <Identificacion>${factura.cliente?.cedula || ''}</Identificacion>
    </Receptor>
    <DetalleFactura>
      <NumeroFactura>${factura.numero}</NumeroFactura>
      <CAI>${config.cai || ''}</CAI>
      <FechaEmision>${f}</FechaEmision>
      <HoraEmision>${h}</HoraEmision>
      <CondicionPago>${factura.esCredito ? 'Credito' : 'Contado'}</CondicionPago>
      <MetodoPago>${factura.metodoPago}</MetodoPago>
      <Moneda>NIO</Moneda>
      <TipoCambio>${config.tasaCambio || '1'}</TipoCambio>
    </DetalleFactura>
  </Encabezado>
  <Detalle>
    ${(factura.detalles || []).map(d => `
    <Linea>
      <Codigo>${d.producto?.codigo || ''}</Codigo>
      <Descripcion>${d.producto?.nombre || ''}</Descripcion>
      <Cantidad>${d.cantidad}</Cantidad>
      <UnidadMedida>${d.unidadVenta || 'Unidad'}</UnidadMedida>
      <PrecioUnitario>${d.precio.toFixed(2)}</PrecioUnitario>
      <Descuento>0.00</Descuento>
      <Subtotal>${d.subtotal.toFixed(2)}</Subtotal>
    </Linea>`).join('')}
  </Detalle>
  <Resumen>
    <Subtotal>${factura.subtotal.toFixed(2)}</Subtotal>
    <Descuento>${factura.descuento.toFixed(2)}</Descuento>
    <IVA>${factura.iva.toFixed(2)}</IVA>
    <Total>${factura.total.toFixed(2)}</Total>
    <TotalLetras>${numeroALetras(factura.total)}</TotalLetras>
  </Resumen>
  <Pagos>
    ${dp && dp.length > 0 ? dp.map(p => `
    <Pago>
      <Tipo>${p.metodo}</Tipo>
      <Monto>${parseFloat(p.monto).toFixed(2)}</Monto>
    </Pago>`).join('') : `
    <Pago>
      <Tipo>${factura.metodoPago}</Tipo>
      <Monto>${factura.pagoCon.toFixed(2)}</Monto>
    </Pago>`}
  </Pagos>
</FacturaElectronica>`
}

export function numeroALetras(n) {
  const unidades = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE']
  const decenas = ['', 'DIEZ', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA']
  const especiales = { 11: 'ONCE', 12: 'DOCE', 13: 'TRECE', 14: 'CATORCE', 15: 'QUINCE', 16: 'DIECISÉIS', 17: 'DIECISIETE', 18: 'DIECIOCHO', 19: 'DIECINUEVE' }

  const entero = Math.floor(n)
  const decimal = String(Math.round((n - entero) * 100)).padStart(2, '0')

  function convertir(num) {
    if (num === 0) return 'CERO'
    if (num >= 1000000) return `${convertir(Math.floor(num / 1000000))} MILLÓN${num % 1000000 !== 0 ? ' ' + convertir(num % 1000000) : ''}`
    if (num >= 1000) return `${convertir(Math.floor(num / 1000))} MIL${num % 1000 !== 0 ? ' ' + convertir(num % 1000) : ''}`
    if (num >= 100) {
      const c = Math.floor(num / 100)
      const r = num % 100
      const centenas = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS']
      return `${c === 1 && r === 0 ? 'CIEN' : centenas[c]}${r !== 0 ? ' ' + convertir(r) : ''}`
    }
    if (num >= 20 && num < 30) return num === 20 ? 'VEINTE' : `VEINTI${unidades[num - 20] === 'UN' ? 'UNO' : unidades[num - 20]}`
    if (num >= 30) return `${decenas[Math.floor(num / 10)]}${num % 10 !== 0 ? ' Y ' + unidades[num % 10] : ''}`
    return especiales[num] || unidades[num % 10]
  }

  return `${convertir(entero)} CÓRDOBAS CON ${decimal}/100`
}
