'use client'
import { forwardRef } from 'react'

const ReportePDF = forwardRef(({ config, titulo, columnas, datos, formatearFila }, ref) => {
  const fecha = new Date().toLocaleDateString('es-NI', { day: '2-digit', month: 'long', year: 'numeric' })

  return (
    <div ref={ref} style={{
      width: '210mm', padding: '15mm 20mm',
      fontFamily: 'Arial, sans-serif', fontSize: '12px',
      color: '#000', background: '#fff'
    }}>
      <style>{`
        @media print {
          @page { size: A4 landscape; margin: 15mm 20mm; }
          body * { visibility: hidden; }
          .reporte-print, .reporte-print * { visibility: visible; }
          .reporte-print { position: absolute; left: 0; top: 0; width: 210mm; }
        }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
        th { background: #f0f0f0; font-weight: 700; }
        tr:nth-child(even) { background: #fafafa; }
      `}</style>

      <div className="reporte-print">
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '2px solid #333', paddingBottom: '12px' }}>
          {config?.logo && (
            <img src={config.logo} alt="Logo" style={{ width: '64px', height: '64px', objectFit: 'contain' }} />
          )}
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700 }}>{config?.nombre || 'Mi Pulpería'}</div>
            {config?.direccion && <div style={{ fontSize: '11px', color: '#555' }}>{config.direccion}</div>}
            {config?.telefono && <div style={{ fontSize: '11px', color: '#555' }}>Tel: {config.telefono}</div>}
            {config?.ruc && <div style={{ fontSize: '11px', color: '#555' }}>RUC: {config.ruc}</div>}
          </div>
        </div>
        <div style={{ textAlign: 'center', marginBottom: '16px' }}>
          <div style={{ fontSize: '16px', fontWeight: 700 }}>{titulo}</div>
          <div style={{ fontSize: '11px', color: '#555' }}>Generado el: {fecha}</div>
        </div>

        <table>
          <thead>
            <tr>
              {columnas.map(col => (
                <th key={col.key} style={{ textAlign: col.align || 'left' }}>{col.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {datos.length === 0 ? (
              <tr><td colSpan={columnas.length} style={{ textAlign: 'center', padding: '20px', color: '#999' }}>Sin datos</td></tr>
            ) : (
              datos.map((fila, i) => (
                <tr key={i}>
                  {columnas.map(col => (
                    <td key={col.key} style={{ textAlign: col.align || 'left' }}>
                      {formatearFila ? formatearFila(fila, col.key) : (fila[col.key] ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div style={{ marginTop: '20px', textAlign: 'center', fontSize: '10px', color: '#999', borderTop: '1px solid #ccc', paddingTop: '8px' }}>
          {config?.mensajePie || '¡Gracias por su preferencia!'}
        </div>
      </div>
    </div>
  )
})

ReportePDF.displayName = 'ReportePDF'
export default ReportePDF
