'use client'
import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

export default function RespaldosPage() {
  const [cargando, setCargando] = useState(false)
  const [restaurando, setRestaurando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const fileRef = useRef(null)
  const router = useRouter()
  const { user } = useAuth()

  if (!user?.esAdmin) return <p style={{ color: '#ef4444', textAlign: 'center', marginTop: 40 }}>Solo administradores</p>

  async function descargar() {
    setCargando(true)
    setError('')
    setMensaje('')
    try {
      const res = await fetch('/api/respaldos')
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Error al descargar')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const today = new Date().toISOString().slice(0, 10)
      a.download = `respaldo-${today}.db`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      setMensaje('Respaldo descargado correctamente')
    } catch (e) {
      setError(e.message)
    } finally {
      setCargando(false)
    }
  }

  async function restaurar(e) {
    e.preventDefault()
    const file = fileRef.current?.files?.[0]
    if (!file) {
      setError('Seleccioná un archivo de respaldo')
      return
    }
    if (!confirm('¿Estás seguro? Esta acción reemplazará la base de datos actual. Se cerrará la sesión después de restaurar.')) return

    setRestaurando(true)
    setError('')
    setMensaje('')
    try {
      const formData = new FormData()
      formData.append('archivo', file)
      const res = await fetch('/api/respaldos/restaurar', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al restaurar')
      setMensaje(data.mensaje)
      setTimeout(() => { window.location.href = '/login' }, 2000)
    } catch (e) {
      setError(e.message)
    } finally {
      setRestaurando(false)
    }
  }

  return (
    <div style={{ maxWidth: 500, margin: '0 auto' }}>
      <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: 24, color: '#1e293b' }}>
        💾 Respaldos
      </h1>

      {mensaje && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, background: 'rgba(22,163,74,0.1)',
          border: '1px solid rgba(22,163,74,0.2)', color: '#15803d',
          fontSize: 13, marginBottom: 20, textAlign: 'center'
        }}>{mensaje}</div>
      )}

      {error && (
        <div style={{
          padding: '10px 14px', borderRadius: 10, background: 'rgba(220,38,38,0.1)',
          border: '1px solid rgba(220,38,38,0.2)', color: '#dc2626',
          fontSize: 13, marginBottom: 20, textAlign: 'center'
        }}>{error}</div>
      )}

      <div style={{
        background: '#fff', borderRadius: 12, padding: 24, marginBottom: 20,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>Descargar respaldo</h2>
        <p style={{ fontSize: 13, color: '#64748b', marginBottom: 16 }}>
          Descargá una copia completa de la base de datos actual.
        </p>
        <button onClick={descargar} disabled={cargando}
          style={{
            padding: '10px 24px', borderRadius: 8, border: 'none',
            background: cargando ? '#94a3b8' : '#16a34a',
            color: '#fff', fontSize: 14, fontWeight: 600, cursor: cargando ? 'not-allowed' : 'pointer'
          }}>
          {cargando ? 'Descargando...' : '📥 Descargar respaldo'}
        </button>
      </div>

      <div style={{
        background: '#fff', borderRadius: 12, padding: 24,
        boxShadow: '0 1px 3px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0'
      }}>
        <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 12, color: '#1e293b' }}>Restaurar respaldo</h2>
        <p style={{ fontSize: 13, color: '#ef4444', marginBottom: 16 }}>
          ⚠ Esta acción reemplazará toda la base de datos. Se cerrará la sesión automáticamente.
        </p>
        <form onSubmit={restaurar}>
          <input type="file" ref={fileRef} accept=".db"
            style={{
              display: 'block', marginBottom: 16, fontSize: 14,
              color: '#1e293b', width: '100%'
            }} />
          <button type="submit" disabled={restaurando}
            style={{
              padding: '10px 24px', borderRadius: 8, border: 'none',
              background: restaurando ? '#94a3b8' : '#dc2626',
              color: '#fff', fontSize: 14, fontWeight: 600, cursor: restaurando ? 'not-allowed' : 'pointer'
            }}>
            {restaurando ? 'Restaurando...' : '📤 Restaurar respaldo'}
          </button>
        </form>
      </div>
    </div>
  )
}
