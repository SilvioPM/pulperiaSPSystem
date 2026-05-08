'use client'
import { useState, useEffect, useRef } from 'react'

export default function Configuracion() {
  const [config, setConfig]       = useState({
    nombre: '', slogan: '', direccion: '',
    telefono: '', ruc: '', mensajePie: '', logo: ''
  })
  const [guardado, setGuardado]   = useState(false)
  const inputLogo                 = useRef(null)

  useEffect(() => { cargarConfig() }, [])

  async function cargarConfig() {
    const res  = await fetch('/api/config')
    const data = await res.json()
    setConfig(prev => ({ ...prev, ...data }))
  }

  async function guardarConfig(e) {
    e.preventDefault()
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config)
    })
    if (res.ok) {
      setGuardado(true)
      setTimeout(() => setGuardado(false), 3000)
    }
  }

  // Convertir imagen a base64 para guardarla
  function subirLogo(e) {
    const file   = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => {
      setConfig(prev => ({ ...prev, logo: ev.target.result }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div style={{ maxWidth: '600px' }}>
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>⚙️ Configuración del negocio</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Estos datos aparecerán en todas tus facturas</p>
      </div>

      <form onSubmit={guardarConfig}>
        <div className="card" style={{ marginBottom: '20px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px' }}>🏪 Datos del negocio</h2>

          {/* Logo */}
          <div style={{ marginBottom: '20px', textAlign: 'center' }}>
            <div
              onClick={() => inputLogo.current.click()}
              style={{
                width: '100px', height: '100px', borderRadius: '12px',
                border: '2px dashed #e2e8f0', display: 'flex',
                alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', margin: '0 auto 8px',
                overflow: 'hidden', background: '#f8fafc'
              }}>
              {config.logo
                ? <img src={config.logo} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: '32px' }}>🏪</span>
              }
            </div>
            <input ref={inputLogo} type="file" accept="image/*"
              onChange={subirLogo} style={{ display: 'none' }} />
            <button type="button" onClick={() => inputLogo.current.click()}
              style={{
                padding: '6px 16px', borderRadius: '6px', border: '1px solid #e2e8f0',
                background: 'white', cursor: 'pointer', fontSize: '13px'
              }}>
              📷 Subir logo
            </button>
          </div>

          {[
            { key: 'nombre',     label: 'Nombre del negocio *', placeholder: 'Ej: Pulpería La Bendición' },
            { key: 'slogan',     label: 'Slogan',               placeholder: 'Ej: Lo mejor del barrio' },
            { key: 'direccion',  label: 'Dirección',            placeholder: 'Ej: Del parque 1 cuadra al lago' },
            { key: 'telefono',   label: 'Teléfono',             placeholder: 'Ej: 8888-8888' },
            { key: 'ruc',        label: 'RUC / Cédula',         placeholder: 'Ej: 001-010190-0001X' },
            { key: 'mensajePie', label: 'Mensaje en el ticket', placeholder: 'Ej: ¡Gracias por su compra!' },
          ].map(campo => (
            <div key={campo.key} style={{ marginBottom: '14px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                {campo.label}
              </label>
              <input
                value={config[campo.key]}
                onChange={e => setConfig({ ...config, [campo.key]: e.target.value })}
                placeholder={campo.placeholder}
                style={{
                  width: '100%', padding: '10px', borderRadius: '8px',
                  border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none'
                }}
              />
            </div>
          ))}
        </div>

        <button type="submit" className="btn-verde" style={{ width: '100%', padding: '14px', fontSize: '15px' }}>
          {guardado ? '✅ ¡Guardado!' : '💾 Guardar configuración'}
        </button>
      </form>
    </div>
  )
}