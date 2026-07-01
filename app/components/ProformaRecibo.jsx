'use client'
import { forwardRef } from 'react'

const ProformaRecibo = forwardRef(({ proforma, config }, ref) => {
  function formatearFecha(fecha) {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  return (
    <div ref={ref} style={{
      width: '80mm', padding: '4mm',
      fontFamily: 'monospace', fontSize: '12px',
      color: '#000', background: '#fff'
    }}>
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body * { visibility: hidden; }
          .proforma-print, .proforma-print * { visibility: visible; }
          .proforma-print { position: absolute; left: 0; top: 0; width: 80mm; }
        }
      `}</style>

      <div className="proforma-print">
        {/* Cabecera */}
        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          {config?.logo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '4px' }}>
              <img src={config.logo} alt="logo"
                style={{ width: '60px', height: '60px', objectFit: 'contain' }}
              />
            </div>
          )}
          <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {config?.nombre || 'Mi Pulpería'}
          </div>
          {config?.slogan && <div style={{ fontSize: '11px', fontStyle: 'italic' }}>{config.slogan}</div>}
          {config?.direccion && <div style={{ fontSize: '11px' }}>📍 {config.direccion}</div>}
          {config?.telefono && <div style={{ fontSize: '11px' }}>📞 {config.telefono}</div>}
          {config?.ruc && <div style={{ fontSize: '11px' }}>RUC: {config.ruc}</div>}
        </div>
        {/* Título PROFORMA */}
        <div style={{ textAlign: 'center', fontSize: '14px', fontWeight: 'bold', marginBottom: '8px', padding: '4px', border: '1px dashed #000' }}>
          *** PROFORMA / COTIZACIÓN ***
        </div>

        {/* Datos */}
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>N°:</span>
            <span>{proforma?.numero}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>Fecha:</span>
            <span>{formatearFecha(proforma?.creadoEn)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>Cliente:</span>
            <span>{proforma?.cliente?.nombre || 'General'}</span>
          </div>
          {proforma?.validoHasta && (
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontWeight: 'bold' }}>Válido hasta:</span>
              <span>{formatearFecha(proforma.validoHasta)}</span>
            </div>
          )}
        </div>

        {/* Productos */}
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', marginBottom: '4px' }}>
            <span style={{ flex: 2 }}>Producto</span>
            <span style={{ flex: 1, textAlign: 'center' }}>Cant</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Precio (C$)</span>
            <span style={{ flex: 1, textAlign: 'right' }}>Sub (C$)</span>
          </div>
          {proforma?.detalles?.map((d, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px', fontSize: '11px' }}>
              <span style={{ flex: 2 }}>{d.producto?.nombre}</span>
              <span style={{ flex: 1, textAlign: 'center' }}>{d.cantidad}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>C$ {d.precio?.toFixed(2)}</span>
              <span style={{ flex: 1, textAlign: 'right' }}>C$ {d.subtotal?.toFixed(2)}</span>
            </div>
          ))}
        </div>

        {/* Total */}
        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', fontSize: '16px' }}>
            <span>TOTAL:</span>
            <span>C$ {proforma?.total?.toFixed(2)}</span>
          </div>
          {config?.tasaCambio > 0 && (
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginTop: '4px' }}>
              <span>USD:</span>
              <span>$ {(proforma?.total / Number(config.tasaCambio)).toFixed(2)}</span>
            </div>
          )}
        </div>

        {/* Nota */}
        {proforma?.nota && (
          <div style={{ marginBottom: '8px', fontSize: '11px' }}>
            <strong>Nota:</strong> {proforma.nota}
          </div>
        )}

        {/* Pie */}
        <div style={{ textAlign: 'center', fontSize: '11px' }}>
          <div>Esta es una cotización, no una factura.</div>
          <div style={{ marginTop: '4px' }}>{config?.mensajePie || '¡Gracias por su preferencia!'}</div>
        </div>
      </div>
    </div>
  )
})

ProformaRecibo.displayName = 'ProformaRecibo'
export default ProformaRecibo