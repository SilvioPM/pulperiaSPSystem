'use client'
import { forwardRef } from 'react'
import * as Icons from 'lucide-react'

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
      padding: '3mm',
      fontFamily: 'monospace',
      fontSize: '11px',
      color: '#000',
      background: '#fff',
      boxSizing: 'border-box',
    }}>

      {/* ── Estilos solo para impresión ── */}
      <style>{`
        @media print {
          @page {
            size: 80mm auto;
            margin: 0;
          }
          html, body {
            margin: 0 !important;
            padding: 0 !important;
            height: auto;
          }
          body * { visibility: hidden; }
          .recibo-print, .recibo-print * { visibility: visible; }
          .recibo-print {
            position: absolute;
            left: 0; top: 0;
            width: 74mm;
            padding: 3mm;
          }
        }
      `}      </style>

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
            <div style={{ fontSize: '11px' }}><Icons.MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {config.direccion}</div>
          )}
          {config?.telefono && (
            <div style={{ fontSize: '11px' }}><Icons.Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {config.telefono}</div>
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
              <span style={{ flex: 1, textAlign: 'center' }}>{d.cantidad} {d.unidadVenta || ''}</span>
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
          {/* ── Pago ── */}
          {(() => {
            let dp = null
            try { dp = factura?.detallesPago ? (typeof factura.detallesPago === 'string' ? JSON.parse(factura.detallesPago) : factura.detallesPago) : null } catch {}
            if (dp && dp.length > 1) {
              return (
                <div style={{ borderTop: '1px dashed #000', paddingTop: '4px', marginTop: '4px' }}>
                  <div style={{ fontWeight: 'bold', marginBottom: '2px' }}>Pagos:</div>
                  {dp.map((p, i) => {
                    const tasa = parseFloat(config?.tasaCambio || 0) || 0
                    const enCordobas = p.metodo === 'dolares' && tasa > 0 ? parseFloat(p.monto || 0) * tasa : null
                    return (
                      <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10px' }}>
                        <span style={{ textTransform: 'capitalize' }}>{p.metodo === 'efectivo' ? 'Efectivo' : p.metodo === 'dolares' ? 'Dólares' : p.metodo}</span>
                        <span>{enCordobas !== null ? `C$ ${enCordobas.toFixed(2)}` : `C$ ${parseFloat(p.monto || 0).toFixed(2)}`}</span>
                      </div>
                    )
                  })}
                </div>
              )
            }
            if (factura?.metodoPago === 'dolares') {
              return (
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
              )
            }
            return (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '4px' }}>
                <span>Pagó con:</span>
                <span>C$ {factura?.pagoCon?.toFixed(2)}</span>
              </div>
            )
          })()}
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold' }}>
            <span>Cambio:</span>
            <span>C$ {factura?.cambio?.toFixed(2)}</span>
          </div>
        </div>

        {/* Pie del ticket */}
        <div style={{ textAlign: 'center', fontSize: '11px' }}>
          {config?.mensajePie || '¡Gracias por su compra!'}
          {config?.ciudad && (
            <div style={{ marginTop: '4px' }}><Icons.MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {config.ciudad}</div>
          )}
        </div>
        <div style={{ borderTop: '1px dashed #ccc', margin: '12px 0 8px' }} />
        <div style={{ height: '30px' }} />
      </div>
    </div>
  )
})

FacturaRecibo.displayName = 'FacturaRecibo'
export default FacturaRecibo