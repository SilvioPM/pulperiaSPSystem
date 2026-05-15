'use client'

export default function Confirm({ mensaje, onConfirmar, onCancelar, tipo = 'alerta' }) {
  const colores = {
    alerta:  { bg: '#fef9c3', borde: '#fde047', icono: '⚠️', btnColor: '#ca8a04', btnBg: '#fef9c3' },
    peligro: { bg: '#fee2e2', borde: '#dc2626', icono: '🗑️', btnColor: '#dc2626', btnBg: '#fee2e2' },
    info:    { bg: '#dbeafe', borde: '#2563eb', icono: 'ℹ️', btnColor: '#2563eb', btnBg: '#dbeafe' },
  }
  const { bg, borde, icono, btnColor, btnBg } = colores[tipo] || colores.alerta

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999
    }}>
      <div style={{
        background: 'white', borderRadius: '16px', padding: '32px',
        width: '380px', textAlign: 'center',
        boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
      }}>
        <div style={{
          width: '64px', height: '64px', borderRadius: '50%',
          background: bg, border: `2px solid ${borde}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '28px', margin: '0 auto 16px'
        }}>
          {icono}
        </div>
        <p style={{ fontSize: '15px', color: '#1e293b', fontWeight: 600, marginBottom: '24px', lineHeight: 1.5 }}>
          {mensaje}
        </p>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={onCancelar}
            style={{
              flex: 1, padding: '12px', borderRadius: '8px',
              border: '1px solid #e2e8f0', background: 'white',
              cursor: 'pointer', fontWeight: 600, fontSize: '14px', color: '#475569'
            }}>
            Cancelar
          </button>
          <button onClick={onConfirmar}
            style={{
              flex: 1, padding: '12px', borderRadius: '8px',
              border: `1px solid ${borde}`, background: btnBg,
              cursor: 'pointer', fontWeight: 700, fontSize: '14px', color: btnColor
            }}>
            Confirmar
          </button>
        </div>
      </div>
    </div>
  )
}
