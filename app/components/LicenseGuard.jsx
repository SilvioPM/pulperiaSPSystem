'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'

let cacheLicencia = null

export default function LicenseGuard({ children }) {
  const { user } = useAuth()
  const [licencia, setLicencia] = useState(cacheLicencia)
  const [cargado, setCargado] = useState(!!cacheLicencia)

  useEffect(() => {
    if (cacheLicencia) return
    fetch('/api/licencia').then(r => r.json()).then(d => {
      cacheLicencia = d
      setLicencia(d)
      setCargado(true)
    }).catch(() => {
      const fallback = { valida: false }
      cacheLicencia = fallback
      setLicencia(fallback)
      setCargado(true)
    })
  }, [])

  if (!cargado || !user) return children

  const invalida = !licencia?.valida

  return (
    <>
      {invalida && (
        <div style={{
          background: 'linear-gradient(90deg, #991b1b, #b91c1c)',
          color: '#fff', textAlign: 'center', padding: '10px 16px',
          fontSize: '14px', fontWeight: 500, zIndex: 1000
        }}>
          ⚠️ Sistema sin licencia — <a href="/licencia" style={{ color: '#fde68a', textDecoration: 'underline' }}>
            Instalar licencia
          </a>
        </div>
      )}
      {children}
    </>
  )
}