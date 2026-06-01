'use client'
import { forwardRef } from 'react'

const ProformaCarta = forwardRef(({ proforma, config }, ref) => {

  function formatearFecha(fecha) {
    if (!fecha) return '—'
    return new Date(fecha).toLocaleDateString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  const subtotal = proforma?.detalles?.reduce((sum, d) => sum + d.subtotal, 0) || 0
  const iva      = proforma?.iva || 0
  const total    = proforma?.total || 0

  return (
    <div ref={ref} style={{
      width: '216mm',
      minHeight: '279mm',
      padding: '20mm',
      fontFamily: 'Arial, sans-serif',
      fontSize: '12px',
      color: '#1e293b',
      background: '#fff',
      boxSizing: 'border-box'
    }}>
      <style>{`
        @media print {
          @page { size: letter; margin: 0; }
          body * { visibility: hidden; }
          .carta-print, .carta-print * { visibility: visible; }
          .carta-print {
            position: absolute;
            left: 0; top: 0;
            width: 216mm;
            min-height: 279mm;
            padding: 20mm;
          }
        }
      `}</style>

      <div className="carta-print">
        {/* ── CABECERA ─────────────────────────────────── */}
        <div style={{
          display: 'flex', justifyContent: 'space-between',
          alignItems: 'flex-start', marginBottom: '30px',
          paddingBottom: '20px', borderBottom: '3px solid #1e293b'
        }}>
          {/* Logo y datos del negocio */}
          <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
            {config?.logo && (
              <img src={config.logo} alt="logo"
                style={{ width: '80px', height: '80px', objectFit: 'contain' }}
              />
            )}
            <div>
              <div style={{ fontSize: '22px', fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                {config?.nombre || 'Mi Pulpería'}
              </div>
              {config?.slogan && (
                <div style={{ fontSize: '12px', color: '#64748b', fontStyle: 'italic', marginBottom: '4px' }}>
                  {config.slogan}
                </div>
              )}
              {config?.direccion && <div style={{ fontSize: '11px', color: '#475569' }}>📍 {config.direccion}</div>}
              {config?.telefono && <div style={{ fontSize: '11px', color: '#475569' }}>📞 {config.telefono}</div>}
              {config?.ruc && <div style={{ fontSize: '11px', color: '#475569' }}>RUC: {config.ruc}</div>}
            </div>
          </div>

          {/* Título PROFORMA */}
          <div style={{ textAlign: 'right' }}>
            <div style={{
              fontSize: '28px', fontWeight: 900,
              color: '#7c3aed', textTransform: 'uppercase',
              letterSpacing: '2px'
            }}>
              PROFORMA
            </div>
            <div style={{
              fontSize: '18px', fontWeight: 700,
              color: '#475569', marginBottom: '8px'
            }}>
              {proforma?.numero}
            </div>
            <div style={{
              display: 'inline-block',
              padding: '4px 12px', borderRadius: '20px',
              background: proforma?.estado === 'aprobada' ? '#dcfce7' :
                          proforma?.estado === 'rechazada' ? '#fee2e2' : '#fef9c3',
              color: proforma?.estado === 'aprobada' ? '#16a34a' :
                     proforma?.estado === 'rechazada' ? '#dc2626' : '#ca8a04',
              fontSize: '12px', fontWeight: 700, textTransform: 'uppercase'
            }}>
              {proforma?.estado || 'pendiente'}
            </div>
          </div>
        </div>
        {/* ── DATOS DE LA PROFORMA ─────────────────────── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '20px', marginBottom: '30px'
        }}>
          {/* Cliente */}
          <div style={{
            background: '#f8fafc', borderRadius: '10px',
            padding: '16px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
              Para:
            </div>
            <div style={{ fontSize: '15px', fontWeight: 700 }}>
              {proforma?.cliente?.nombre || 'Cliente General'}
            </div>
            {proforma?.cliente?.telefono && (
              <div style={{ fontSize: '12px', color: '#475569', marginTop: '4px' }}>
                📞 {proforma.cliente.telefono}
              </div>
            )}
            {proforma?.cliente?.cedula && (
              <div style={{ fontSize: '12px', color: '#475569' }}>
                🪪 {proforma.cliente.cedula}
              </div>
            )}
            {proforma?.cliente?.direccion && (
              <div style={{ fontSize: '12px', color: '#475569' }}>
                📍 {proforma.cliente.direccion}
              </div>
            )}
          </div>

          {/* Detalles de la proforma */}
          <div style={{
            background: '#f8fafc', borderRadius: '10px',
            padding: '16px', border: '1px solid #e2e8f0'
          }}>
            <div style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px', letterSpacing: '1px' }}>
              Detalles:
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Fecha emisión:</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>{formatearFecha(proforma?.creadoEn)}</span>
            </div>
            {proforma?.validoHasta && (
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <span style={{ fontSize: '12px', color: '#64748b' }}>Válido hasta:</span>
                <span style={{ fontSize: '12px', fontWeight: 600, color: '#dc2626' }}>
                  {formatearFecha(proforma.validoHasta)}
                </span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: '12px', color: '#64748b' }}>Moneda:</span>
              <span style={{ fontSize: '12px', fontWeight: 600 }}>Córdobas (C$)</span>
            </div>
          </div>
        </div>

        {/* ── TABLA DE PRODUCTOS ───────────────────────── */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '24px' }}>
          <thead>
            <tr style={{ background: '#1e293b', color: 'white' }}>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700, borderRadius: '8px 0 0 0' }}>
                #
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: 700 }}>
                Descripción
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'center', fontSize: '12px', fontWeight: 700 }}>
                Cantidad
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700 }}>
                Precio Unit.
              </th>
              <th style={{ padding: '12px 16px', textAlign: 'right', fontSize: '12px', fontWeight: 700, borderRadius: '0 8px 0 0' }}>
                Subtotal
              </th>
            </tr>
          </thead>
          <tbody>
            {proforma?.detalles?.map((d, i) => (
              <tr key={i} style={{
                background: i % 2 === 0 ? '#f8fafc' : 'white',
                borderBottom: '1px solid #e2e8f0'
              }}>
                <td style={{ padding: '12px 16px', fontSize: '12px', color: '#64748b' }}>
                  {i + 1}
                </td>
                <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600 }}>
                  {d.producto?.nombre}
                  {d.producto?.codigo && (
                    <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: 400 }}>
                      Código: {d.producto.codigo}
                    </div>
                  )}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'center', fontSize: '13px' }}>
                  {d.cantidad}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px' }}>
                  C$ {d.precio?.toFixed(2)}
                </td>
                <td style={{ padding: '12px 16px', textAlign: 'right', fontSize: '13px', fontWeight: 700 }}>
                  C$ {d.subtotal?.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── TOTALES ──────────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '24px' }}>
          <div style={{ width: '280px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Subtotal:</span>
              <span style={{ fontSize: '13px', fontWeight: 600 }}>C$ {subtotal.toFixed(2)}</span>
            </div>
            {iva > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid #e2e8f0' }}>
                <span style={{ fontSize: '13px', color: '#64748b' }}>IVA (15%):</span>
                <span style={{ fontSize: '13px', fontWeight: 600 }}>C$ {iva.toFixed(2)}</span>
              </div>
            )}
            <div style={{
              display: 'flex', justifyContent: 'space-between',
              padding: '12px 16px', marginTop: '8px',
              background: '#7c3aed', borderRadius: '8px', color: 'white'
            }}>
              <span style={{ fontSize: '16px', fontWeight: 700 }}>TOTAL:</span>
              <span style={{ fontSize: '20px', fontWeight: 900 }}>C$ {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* ── NOTA ─────────────────────────────────────── */}
        {proforma?.nota && (
          <div style={{
            background: '#fef9c3', borderRadius: '8px',
            padding: '12px 16px', marginBottom: '24px',
            border: '1px solid #fde047'
          }}>
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#ca8a04', marginBottom: '4px' }}>
              📝 Observaciones:
            </div>
            <div style={{ fontSize: '12px', color: '#1e293b' }}>{proforma.nota}</div>
          </div>
        )}

        {/* ── PIE ──────────────────────────────────────── */}
        <div style={{
          borderTop: '2px solid #e2e8f0', paddingTop: '20px',
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: '20px', marginTop: 'auto'
        }}>
          <div>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '40px' }}>
              Esta cotización es válida por los términos indicados arriba.
              No constituye una factura oficial.
            </div>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '8px', fontSize: '11px', color: '#64748b' }}>
              Firma del cliente
            </div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '11px', color: '#64748b', marginBottom: '40px' }}>
              {config?.mensajePie || '¡Gracias por su preferencia!'}
            </div>
            <div style={{ borderTop: '1px solid #1e293b', paddingTop: '8px', fontSize: '11px', color: '#64748b' }}>
              Autorizado por: {config?.nombre || 'La empresa'}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})

ProformaCarta.displayName = 'ProformaCarta'
export default ProformaCarta