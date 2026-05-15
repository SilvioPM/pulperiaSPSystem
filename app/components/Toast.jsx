'use client'
import { useEffect } from 'react'

export default function Toast({ mensaje, tipo = 'exito', onCerrar }) {
  useEffect(() => {
    const timer = setTimeout(() => onCerrar(), 3000)
    return () => clearTimeout(timer)
  }, [])

  const estilos = {
    exito:   { bg: '#dcfce7', color: '#16a34a', borde: '#16a34a', icono: '✅' },
    error:   { bg: '#fee2e2', color: '#dc2626', borde: '#dc2626', icono: '❌' },
    alerta:  { bg: '#fef9c3', color: '#ca8a04', borde: '#fde047', icono: '⚠️' },
    info:    { bg: '#dbeafe', color: '#2563eb', borde: '#2563eb', icono: 'ℹ️' },
  }

  const { bg, color, borde, icono } = estilos[tipo] || estilos.exito

  return (
    <div style={{
      position: 'fixed', bottom: '24px', right: '24px',
      zIndex: 9999, animation: 'slideIn 0.3s ease',
    }}>
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(100px); opacity: 0; }
          to   { transform: translateX(0);     opacity: 1; }
        }
      `}</style>
      <div style={{
        background: bg, border: `1px solid ${borde}`,
        borderLeft: `4px solid ${borde}`,
        borderRadius: '10px', padding: '14px 20px',
        display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        minWidth: '280px', maxWidth: '400px'
      }}>
        <span style={{ fontSize: '20px' }}>{icono}</span>
        <span style={{ fontSize: '14px', fontWeight: 600, color, flex: 1 }}>
          {mensaje}
        </span>
        <button onClick={onCerrar}
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color, fontSize: '18px', lineHeight: 1, opacity: 0.7
          }}>
          ✕
        </button>
      </div>
    </div>
  )
}