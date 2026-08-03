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

  function tamanoMonto(monto) {
    const s = `C$ ${monto.toFixed(2)}`.length
    if (s > 18) return '9px'
    if (s > 15) return '10px'
    if (s > 12) return '11px'
    return null
  }

  const estiloValor = { textAlign: 'right', wordBreak: 'break-word', minWidth: 0, marginLeft: '6px' }
  const estiloMonto = monto => ({ ...estiloValor, whiteSpace: 'nowrap', fontSize: tamanoMonto(monto) })

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
      <style>{`
        @media print {
          @page { size: 80mm auto; margin: 0; }
          html, body { margin: 0 !important; padding: 0 !important; height: auto; }
          body * { visibility: hidden; }
          .recibo-print, .recibo-print * { visibility: visible; }
          .recibo-print { position: absolute; left: 0; top: 0; width: 74mm; padding: 3mm; }
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
          <div style={{ fontSize: '11px' }}>{tipo === 'cxc' ? 'Cuenta por Cobrar' : 'Cuenta por Pagar'}</div>
        </div>

        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>{tipo === 'cxc' ? 'Factura' : 'Compra'}:</span>
            <span style={{ ...estiloValor, textAlign: 'right' }}>{numero}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>{tipo === 'cxc' ? 'Cliente' : 'Proveedor'}:</span>
            <span style={estiloValor}>{entidad}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontWeight: 'bold', flexShrink: 0 }}>Fecha:</span>
            <span style={{ ...estiloValor, whiteSpace: 'nowrap' }}>{formatearFecha(new Date())}</span>
          </div>
        </div>

        <div style={{ marginBottom: '8px', borderBottom: '1px dashed #000', paddingBottom: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ flexShrink: 0 }}>Monto original:</span>
            <span style={estiloMonto(montoOriginal)}>C$ {montoOriginal.toFixed(2)}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ flexShrink: 0 }}>Abono realizado:</span>
            <span style={{ ...estiloMonto(abonoMonto), fontWeight: 'bold' }}>- C$ {abonoMonto.toFixed(2)}</span>
          </div>
          {nota && (
            <div style={{ fontSize: '10px', marginBottom: '4px', wordBreak: 'break-word' }}>
              Nota: {nota}
            </div>
          )}
          <div style={{
            display: 'flex', justifyContent: 'space-between',
            fontSize: '13px', fontWeight: 'bold', marginTop: '4px',
            borderTop: '1px solid #000', paddingTop: '4px'
          }}>
            <span style={{ flexShrink: 0 }}>Saldo pendiente:</span>
            <span style={{ ...estiloMonto(saldoPendiente), fontSize: tamanoMonto(saldoPendiente) || '13px' }}>C$ {saldoPendiente.toFixed(2)}</span>
          </div>
        </div>

        <div style={{ textAlign: 'center', fontSize: '11px' }}>
          {config?.mensajePie || '¡Gracias!'}
          {config?.ciudad && <div style={{ marginTop: '4px' }}><Icons.MapPin size={12} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> {config.ciudad}</div>}
        </div>
        <div style={{ borderTop: '1px dashed #000', margin: '12px 0 8px' }} />
        <div style={{ height: '30px' }} />
      </div>
    </div>
  )
})

AbonoRecibo.displayName = 'AbonoRecibo'
export default AbonoRecibo
