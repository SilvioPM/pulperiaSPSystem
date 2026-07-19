'use client'
import { forwardRef } from 'react'
import * as Icons from 'lucide-react'

const AbonoRecibo = forwardRef(({ config, tipo, numero, entidad, montoOriginal, abonoMonto, saldoPendiente, nota }, ref) => {

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
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          body * { visibility: hidden; }
          .recibo-print, .recibo-print * { visibility: visible; }
          .recibo-print { position: absolute; left: 0; top: 0; width: 80mm; }
        }
      `}</style>

      <div className="recibo-print">
        <div style={{ textAlign: 'center', marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          {config?.logo && (
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '6px' }}>
              <img src={config.logo} alt="logo"
                style={{ width: '70px', height: '70px', objectFit: 'contain', display: 'block' }} />
            </div>
          )}
          <div style={{ fontSize: '16px', fontWeight: 'bold', textTransform: 'uppercase' }}>
            {config?.nombre || 'Mi Pulpería'}
          </div>
          {config?.slogan && <div style={{ fontSize: '11px', fontStyle: 'italic' }}>{config.slogan}</div>}
          {config?.direccion && <div style={{ fontSize: '11px' }}><Icons.MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {config.direccion}</div>}
          {config?.telefono && <div style={{ fontSize: '11px' }}><Icons.Phone size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {config.telefono}</div>}
        </div>

        <div style={{ textAlign: 'center', marginBottom: '8px' }}>
          <div style={{ fontSize: '14px', fontWeight: 'bold' }}>RECIBO DE ABONO</div>
          <div style={{ fontSize: '11px', color: '#666' }}>{tipo === 'cxc' ? 'Cuenta por Cobrar' : 'Cuenta por Pagar'}</div>
        </div>

        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>{tipo === 'cxc' ? 'Factura' : 'Compra'}:</span>
            <span>{numero}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>{tipo === 'cxc' ? 'Cliente' : 'Proveedor'}:</span>
            <span>{entidad}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold' }}>Fecha:</span>
            <span>{formatearFecha(new Date())}</span>
          </div>
        </div>

        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Monto original:</span>
            <span>C$ {montoOriginal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span>Abono realizado:</span>
            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>- C$ {abonoMonto.toFixed(2)}</span>
          </div>
          {nota && (
            <div style={{ fontSize: '11px', marginBottom: '4px', color: '#666' }}>
              Nota: {nota}
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '14px', fontWeight: 'bold', marginTop: '4px',
            borderTop: '1px solid #000', paddingTop: '4px'
          }}>
            <span>Saldo pendiente:</span>
            <span>C$ {saldoPendiente.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>
          {config?.mensajePie || '¡Gracias!'}
          {config?.ciudad && <div style={{ marginTop: '4px' }}><Icons.MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {config.ciudad}</div>}
        </div>
        <div style={{ borderTop: '1px dashed #ccc', margin: '12px 0 8px' }} />
        <div style={{ height: '30px' }} />
      </div>
    </div>
  )
})

AbonoRecibo.displayName = 'AbonoRecibo'
export default AbonoRecibo
