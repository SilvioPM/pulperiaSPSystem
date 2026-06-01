'use client'
import { forwardRef } from 'react'

// forwardRef permite que react-to-print acceda a este componente
const FacturaRecibo = forwardRef(({ factura, config }, ref) => {

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  return (
    <div ref={ref} style={{
      width: '80mm',
      padding: '4mm',
      fontFamily: 'monospace',
      fontSize: '12px',
      color: '#000',
      background: '#fff',
    }}>

      {/* ── Estilos solo para impresión ── */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          body * { visibility: hidden; }
          .recibo-print, .recibo-print * { visibility: visible; }
          .recibo-print {
            position: absolute;
            left: 0; top: 0;
            width: 80mm;
          }
        }
      `}</style>

      <div className="recibo-print">
        {/* Cabecera del negocio */}
        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          {config?.logo && (
                <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
                    <img src={config.logo} alt="logo"
                        style={{
                         width: '70px',
                            height: '70px',
                            objectFit: 'contain',
                            display: 'block',
                        }}
                    />
                </div>
            )}
          <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {config?.nombre || 'Mi Pulpería'}
          </div>
          {config?.slogan && (
            <div style={{ fontSize: '11px', fontStyle: 'italic' }}>{config.slogan}</div>
          )}
          {config?.direccion && (
            <div style={{ fontSize: '11px' }}>📍 {config.direccion}</div>
          )}
          {config?.telefono && (
            <div style={{ fontSize: '11px' }}>📞 {config.telefono}</div>
          )}
          {config?.ruc && (
            <div style={{ fontSize: '11px' }}>RUC: {config.ruc}</div>
          )}
        </div>
        {/* Datos de la factura */}
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>Factura:</span>
            <span>{factura?.numero}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>Fecha:</span>
            <span>{formatearFecha(factura?.creadoEn)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>Cliente:</span>
            <span>{factura?.cliente?.nombre || 'General'}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>Pago:</span>
            <span>{factura?.metodoPago}</span>
          </div>
        </div>

        {/* Productos */}
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px', fontSize: '10px' }}>
            <span style={{ flex: 2 }}>Producto</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Cant</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Precio</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Sub</span>
          </div>
          {factura?.detalles?.map(d => (
            <div key={d.id} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '10px' }}>
              <span style={{ flex: 2, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{d.producto?.nombre}</span>
              <span style={{ flex: 1, textAlign: 'center' }}>{d.cantidad}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>{d.precio.toFixed(2)}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>{d.subtotal.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Totales */}
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>Subtotal:</span>
            <span>C$ {factura?.subtotal?.toFixed(2)}</span>
          </div>
          {factura?.descuento > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#dc2626' }}>
              <span>Descuento:</span>
              <span>- C$ {factura.descuento.toFixed(2)}</span>
            </div>
          )}
          {factura?.iva > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', color: '#7c3aed' }}>
              <span>IVA:</span>
              <span>+ C$ {factura.iva.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px', marginTop: '4px' }}>
            <span>TOTAL:</span>
            <span>C$ {factura?.total?.toFixed(2)}</span>
          </div>
          {factura?.metodoPago === 'dolares' ? (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>Pagó con:</span>
                <span>${((factura.pagoCon || 0) / parseFloat(config?.tasaCambio || 1)).toFixed(2)} USD</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                <span>Tasa cambio:</span>
                <span>C$ {parseFloat(config?.tasaCambio || 0).toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Equivale a:</span>
                <span>C$ {factura?.pagoCon?.toFixed(2)}</span>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
              <span>Pagó con:</span>
              <span>C$ {factura?.pagoCon?.toFixed(2)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Cambio:</span>
            <span>C$ {factura?.cambio?.toFixed(2)}</span>
          </div>
        </div>

        {/* Pie del ticket */}
        <div style={{ textAlign: 'center', fontSize: '11px' }}>
          {config?.mensajePie || '¡Gracias por su compra!'}
          {config?.ciudad && (
            <div style={{ marginTop: '4px' }}>📍 {config.ciudad}</div>
          )}
          <div style={{ marginTop: '8px', fontSize: '10px', color: '#666' }}>
            — Vuelva pronto —
          </div>
        </div>
      </div>
    </div>
  )
})

FacturaRecibo.displayName = 'FacturaRecibo'
export default FacturaRecibo