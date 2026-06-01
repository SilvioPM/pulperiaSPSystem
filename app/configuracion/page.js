'use client'
import { useState, useEffect, useRef } from 'react'

export default function Configuracion() {
  const [config, setConfig] = useState({
    nombre: '', slogan: '', direccion: '',
    telefono: '', ruc: '', ciudad: '', mensajePie: '', logo: '',
    tasaCambio: '', ivaActivo: 'false', tasaIva: '15'
  })
  const [guardado, setGuardado] = useState(false)
  const inputLogo = useRef(null)

  useEffect(() => { cargarConfig() }, [])

  async function cargarConfig() {
    const res = await fetch('/api/config')
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

  function subirLogo(e) {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = (ev) => setConfig(prev => ({ ...prev, logo: ev.target.result }))
    reader.readAsDataURL(file)
  }

  const inputStyle = {
    width: '100%', padding: '10px 12px', borderRadius: '8px',
    border: '1px solid #d1d5db', fontSize: '14px', outline: 'none',
    transition: 'border-color 0.2s', background: '#fff'
  }
  const labelStyle = { fontSize: '13px', fontWeight: 600, color: '#374151', display: 'block', marginBottom: '6px' }

  return (
    <div style={{ maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#1e293b' }}>⚙️ Configuración</h1>
        <p style={{ color: '#64748b', fontSize: '14px' }}>Personalizá los datos del negocio y los impuestos</p>
      </div>

      <form onSubmit={guardarConfig}>
        {/* ── Datos del negocio ── */}
        <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
            <span style={{ fontSize: '24px' }}>🏪</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Datos del negocio</h2>
          </div>

          <div style={{ marginBottom: '24px', textAlign: 'center' }}>
            <div onClick={() => inputLogo.current.click()} style={{
              width: '110px', height: '110px', borderRadius: '16px',
              border: '2px dashed #d1d5db', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', margin: '0 auto 10px',
              overflow: 'hidden', background: '#f9fafb',
              transition: 'border-color 0.2s'
            }}>
              {config.logo
                ? <img src={config.logo} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <span style={{ fontSize: '36px', opacity: 0.4 }}>🏪</span>
              }
            </div>
            <input ref={inputLogo} type="file" accept="image/*" onChange={subirLogo} style={{ display: 'none' }} />
            <button type="button" onClick={() => inputLogo.current.click()}
              style={{ padding: '7px 18px', borderRadius: '8px', border: '1px solid #d1d5db', background: '#fff', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#374151' }}>
              📷 Subir logo
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            {[
              { key: 'nombre', label: 'Nombre del negocio *', placeholder: 'Ej: Pulpería La Bendición', full: true },
              { key: 'slogan', label: 'Slogan', placeholder: 'Ej: Lo mejor del barrio', full: true },
              { key: 'direccion', label: 'Dirección', placeholder: 'Ej: Del parque 1 cuadra al lago', full: true },
              { key: 'ciudad', label: 'Ciudad / Ubicación', placeholder: 'Ej: Managua, Nicaragua', full: true },
              { key: 'telefono', label: 'Teléfono', placeholder: 'Ej: 8888-8888' },
              { key: 'ruc', label: 'RUC / Cédula', placeholder: 'Ej: 001-010190-0001X' },
              { key: 'mensajePie', label: 'Pie de página del ticket', placeholder: 'Ej: ¡Vuelva pronto!', full: true },
              { key: 'tasaCambio', label: 'Tasa de cambio (C$ por $1)', placeholder: 'Ej: 36.50' },
            ].map(campo => (
              <div key={campo.key} style={{ gridColumn: campo.full ? '1 / -1' : undefined, marginBottom: '6px' }}>
                <label style={labelStyle}>{campo.label}</label>
                <input value={config[campo.key]} onChange={e => setConfig({ ...config, [campo.key]: e.target.value })}
                  placeholder={campo.placeholder} style={inputStyle} />
              </div>
            ))}
          </div>
        </div>

        {/* ── IVA ── */}
        <div className="card" style={{ marginBottom: '20px', padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px', paddingBottom: '16px', borderBottom: '2px solid #f1f5f9' }}>
            <span style={{ fontSize: '24px' }}>🧾</span>
            <h2 style={{ fontSize: '18px', fontWeight: 700, margin: 0 }}>Impuestos</h2>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', padding: '14px 16px', background: '#f9fafb', borderRadius: '10px' }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: '#374151' }}>IVA</div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>{config.ivaActivo === 'true' ? 'El IVA se aplicará en el POS y facturas' : 'El IVA está desactivado'}</div>
            </div>
            <label style={{ position: 'relative', display: 'inline-block', width: '48px', height: '26px', cursor: 'pointer' }}>
              <input type="checkbox" checked={config.ivaActivo === 'true'}
                onChange={e => setConfig({ ...config, ivaActivo: e.target.checked ? 'true' : 'false' })}
                style={{ opacity: 0, width: 0, height: 0 }} />
              <span style={{
                position: 'absolute', inset: 0, borderRadius: '26px',
                background: config.ivaActivo === 'true' ? '#16a34a' : '#d1d5db',
                transition: '0.3s',
                boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.15)'
              }}>
                <span style={{
                  position: 'absolute', top: '3px', left: config.ivaActivo === 'true' ? '25px' : '3px',
                  width: '20px', height: '20px', borderRadius: '50%', background: '#fff',
                  transition: '0.3s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                }} />
              </span>
            </label>
          </div>

          {config.ivaActivo === 'true' && (
            <div>
              <label style={labelStyle}>Tasa de IVA (%)</label>
              <input type="number" step="0.01" min="0" max="100"
                value={config.tasaIva} onChange={e => setConfig({ ...config, tasaIva: e.target.value })}
                placeholder="15" style={{ ...inputStyle, maxWidth: '200px' }} />
            </div>
          )}
        </div>

        <button type="submit" className="btn-verde"
          style={{ width: '100%', padding: '14px', fontSize: '15px', borderRadius: '10px' }}>
          {guardado ? '✅ ¡Guardado!' : '💾 Guardar configuración'}
        </button>
      </form>
    </div>
  )
}
