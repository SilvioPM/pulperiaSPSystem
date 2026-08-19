'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function LicenciaBloqueada({ motivo, diasRestantes }) {
  const router = useRouter()

  useEffect(() => {
    // Intentar ir a la página de licencia para cargar una nueva
    const timer = setTimeout(() => {
      router.push('/licencia')
    }, 5000)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fef2f2',
      padding: '24px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'white',
        borderRadius: '12px',
        padding: '32px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        textAlign: 'center',
        border: '2px solid #ef4444'
      }}>
        <div style={{
          width: '80px',
          height: '80px',
          borderRadius: '50%',
          background: '#fef2f2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px',
          border: '3px solid #ef4444'
        }}>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h1 style={{ margin: '0 0 12px', fontSize: '24px', color: '#991b1b' }}>Licencia Inválida o Expirada</h1>

        <p style={{ margin: '0 0 24px', color: '#6b7280', lineHeight: 1.6 }}>
          {motivo === 'expirada'
            ? 'Su licencia ha expirado. El sistema no puede funcionar sin una licencia válida.'
            : motivo === 'invalida'
            ? 'La licencia instalada no es válida para este equipo.'
            : 'No se encontró una licencia válida.'}
        </p>

        {diasRestantes !== null && diasRestantes < 0 && (
          <p style={{ margin: '0 0 24px', color: '#ef4444', fontWeight: 600 }}>
            Expiró hace {Math.abs(diasRestantes)} día(s)
          </p>
        )}

        {diasRestantes !== null && diasRestantes > 0 && diasRestantes <= 15 && (
          <p style={{ margin: '0 0 24px', color: '#f59e0b', fontWeight: 600 }}>
            La licencia vence en {diasRestantes} día(s)
          </p>
        )}

        <div style={{
          background: '#f9fafb',
          borderRadius: '8px',
          padding: '16px',
          marginBottom: '24px',
          textAlign: 'left',
          fontSize: '14px',
          color: '#374151'
        }}>
          <p style={{ margin: '0 0 8px', fontWeight: 600 }}>Para resolverlo:</p>
          <ol style={{ margin: 0, paddingLeft: '20px', lineHeight: 2 }}>
            <li>Contacte a su proveedor del sistema</li>
            <li>Envíe el <strong>Machine-ID</strong> que aparece en la página de Licencia</li>
            <li>Cargue el nuevo archivo <code>.lic</code> que le envíen</li>
          </ol>
        </div>

        <button
          onClick={() => router.push('/licencia')}
          style={{
            width: '100%',
            padding: '14px',
            background: '#ef4444',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: 600,
            cursor: 'pointer'
          }}
        >
          Ir a Cargar Licencia
        </button>

        <p style={{ margin: '16px 0 0', fontSize: '12px', color: '#9ca3af' }}>
          Redirigiendo automáticamente en 5 segundos...
        </p>
      </div>
    </div>
  )
}