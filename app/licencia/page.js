'use client'
import { useState, useEffect } from 'react'
import AuthGuard from '@/app/components/AuthGuard'

export default function LicenciaPage() {
  const [licencia, setLicencia] = useState(null)
  const [arrastrando, setArrastrando] = useState(false)
  const [mensaje, setMensaje] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => { cargarEstado() }, [])

  async function cargarEstado() {
    setCargando(true)
    try {
      const res = await fetch('/api/licencia')
      const data = await res.json()
      setLicencia(data)
    } catch { setLicencia({ valida: false }) }
    setCargando(false)
  }

  async function instalarArchivo(file) {
    setMensaje('')
    setError('')
    const formData = new FormData()
    formData.append('archivo', file)
    try {
      const res = await fetch('/api/licencia', { method: 'POST', body: formData })
      const data = await res.json()
      if (res.ok) {
        setMensaje(`Licencia instalada correctamente — válida hasta ${data.expiraEn}`)
        cargarEstado()
      } else {
        setError(data.error || 'Error al instalar licencia')
      }
    } catch {
      setError('Error de conexión al instalar licencia')
    }
  }

  function handleDrop(e) {
    e.preventDefault()
    setArrastrando(false)
    const file = e.dataTransfer.files[0]
    if (file && file.name.endsWith('.lic')) instalarArchivo(file)
    else setError('Solo se aceptan archivos .lic')
  }

  if (cargando) {
    return (
      <AuthGuard modulos={['configuracion']}>
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>Cargando...</div>
      </AuthGuard>
    )
  }

  return (
    <AuthGuard modulos={['configuracion']}>
      <div style={{ padding: '24px', maxWidth: '600px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '24px' }}>
          Licencia del Sistema
        </h1>

        {licencia?.valida ? (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac', borderRadius: '12px',
            padding: '20px', marginBottom: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#166534' }}>✅ Licencia activa</div>
            <div style={{ color: '#15803d', marginTop: '4px' }}>
              Válida hasta: <strong>{licencia.expiraEn}</strong>
            </div>
            {licencia.vencePronto && (
              <div style={{ color: '#d97706', marginTop: '8px', fontWeight: 500 }}>
                ⚠️ La licencia vence pronto, solicite renovación
              </div>
            )}
          </div>
        ) : (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '12px',
            padding: '20px', marginBottom: '24px'
          }}>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#991b1b' }}>❌ Sin licencia</div>
            <div style={{ color: '#b91c1c', marginTop: '4px' }}>
              Debe instalar una licencia para usar el sistema
            </div>
          </div>
        )}

        <div style={{
          background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '20px', marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#1e293b', marginBottom: '12px' }}>
            Instalar licencia
          </h2>

          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px', background: '#f8fafc', padding: '12px', borderRadius: '8px', fontFamily: 'monospace', wordBreak: 'break-all' }}>
            Machine ID: {licencia?.machineId || '—'}
          </div>

          <div
            onDragOver={e => { e.preventDefault(); setArrastrando(true) }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={handleDrop}
            style={{
              border: `2px dashed ${arrastrando ? '#16a34a' : '#cbd5e1'}`,
              borderRadius: '12px', padding: '40px 20px', textAlign: 'center',
              background: arrastrando ? '#f0fdf4' : '#fafafa',
              transition: 'all 0.2s', cursor: 'pointer'
            }}
            onClick={() => document.getElementById('input-licencia').click()}
          >
            <div style={{ fontSize: '14px', color: '#64748b' }}>
              {arrastrando ? 'Suelte el archivo aquí' : 'Arrastre el archivo .lic o haga clic para seleccionarlo'}
            </div>
            <input id="input-licencia" type="file" accept=".lic" hidden
              onChange={e => { const f = e.target.files[0]; if (f) instalarArchivo(f) }}
            />
          </div>

          {mensaje && <div style={{ color: '#15803d', marginTop: '12px', fontSize: '14px' }}>{mensaje}</div>}
          {error && <div style={{ color: '#dc2626', marginTop: '12px', fontSize: '14px' }}>{error}</div>}
        </div>

        <div style={{ fontSize: '13px', color: '#94a3b8', textAlign: 'center' }}>
          Para obtener su licencia, envíe el Machine ID a su proveedor del sistema
        </div>
      </div>
    </AuthGuard>
  )
}