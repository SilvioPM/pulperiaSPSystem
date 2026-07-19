'use client'
import { useState, useEffect } from 'react'
import Toast from '../components/Toast'
import ImportarCSV from '../components/ImportarCSV'
import { useToast } from '../hooks/useToast'
import * as Icons from 'lucide-react'

export default function Proveedores() {
  const [proveedores, setProveedores]   = useState([])
  const [mostrarForm, setMostrarForm]   = useState(false)
  const [editando, setEditando]         = useState(null)
  const [buscando, setBuscando]         = useState('')
  const [form, setForm] = useState({
    nombre: '', telefono: '', contacto: '', direccion: '', email: '', saldoInicialCxp: ''
  })
  const [cargando, setCargando] = useState(true)
  const [mostrarImportar, setMostrarImportar] = useState(false)
  const { toast, mostrar, cerrar } = useToast()

  useEffect(() => { cargarProveedores().finally(() => setCargando(false)) }, [])

  async function cargarProveedores() {
    try {
      const res  = await fetch('/api/proveedores')
      const data = await res.json()
      setProveedores(Array.isArray(data) ? data : [])
    } catch { setProveedores([]) }
  }

  async function guardar(e) {
    e.preventDefault()
    try {
      const url    = editando ? `/api/proveedores/${editando.id}` : '/api/proveedores'
      const method = editando ? 'PUT' : 'POST'
      const res    = await fetch(url, {
        method, headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      })
      if (res.ok) {
        mostrar(editando ? 'Proveedor actualizado' : 'Proveedor creado', 'exito')
        setMostrarForm(false)
        setEditando(null)
        setForm({ nombre: '', telefono: '', contacto: '', direccion: '', email: '', saldoInicialCxp: '' })
        cargarProveedores()
      } else {
        const data = await res.json()
        mostrar(data.error, 'error')
      }
    } catch { mostrar('Error al guardar proveedor', 'error') }
  }

  async function eliminar(id) {
    try {
      const res = await fetch(`/api/proveedores/${id}`, { method: 'DELETE' })
      if (res.ok) { mostrar('Proveedor eliminado', 'exito'); cargarProveedores() }
    } catch { mostrar('Error al eliminar', 'error') }
  }

  function editar(p) {
    setEditando(p)
    setForm({
      nombre: p.nombre, telefono: p.telefono || '',
      contacto: p.contacto || '', direccion: p.direccion || '', email: p.email || '',
      saldoInicialCxp: p.saldoInicialCxp || ''
    })
    setMostrarForm(true)
  }

  const filtrados = proveedores.filter(p =>
    p.nombre.toLowerCase().includes(buscando.toLowerCase())
  )

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}><Icons.Building2 size={24} /> Proveedores</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{proveedores.length} proveedores registrados</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setMostrarImportar(true)}
            style={{
              padding: '10px 18px', borderRadius: '8px', border: '2px dashed #3b82f6',
              background: '#eff6ff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#2563eb'
            }}>
            <Icons.Download size={16} /> Importar CSV
          </button>
          <button className="btn-verde" onClick={() => { setEditando(null); setForm({ nombre: '', telefono: '', contacto: '', direccion: '', email: '', saldoInicialCxp: '' }); setMostrarForm(true) }}>
            + Nuevo Proveedor
          </button>
        </div>
      </div>

      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <input type="text" placeholder="Buscar proveedor..."
          value={buscando} onChange={e => setBuscando(e.target.value)}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none' }}
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
        {filtrados.length === 0 ? (
          <div className="card" style={{ gridColumn: '1/-1', textAlign: 'center', padding: '60px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}><Icons.Factory size={48} /></div>
            <p style={{ color: '#94a3b8' }}>No hay proveedores aún</p>
          </div>
        ) : (
          filtrados.map(p => (
            <div key={p.id} className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div style={{
                  width: '48px', height: '48px', borderRadius: '12px',
                  background: '#dbeafe', display: 'flex', alignItems: 'center',
                  justifyContent: 'center'
                }}><Icons.Factory size={24} /></div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  <button onClick={() => editar(p)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #dbeafe', background: '#dbeafe', cursor: 'pointer', fontSize: '13px', color: '#2563eb', fontWeight: 600 }}>
                    <Icons.Edit size={16} />
                  </button>
                  <button onClick={() => eliminar(p.id)}
                    style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #fee2e2', background: '#fee2e2', cursor: 'pointer', fontSize: '13px', color: '#dc2626', fontWeight: 600 }}>
                    <Icons.Trash2 size={16} />
                  </button>
                </div>
              </div>
              <div style={{ fontWeight: 700, fontSize: '16px', marginBottom: '8px' }}>{p.nombre}</div>
              {p.contacto  && <div style={{ fontSize: '13px', color: '#64748b' }}><Icons.User size={14} /> {p.contacto}</div>}
              {p.telefono  && <div style={{ fontSize: '13px', color: '#64748b' }}><Icons.Phone size={14} /> {p.telefono}</div>}
              {p.email     && <div style={{ fontSize: '13px', color: '#64748b' }}>✉️ {p.email}</div>}
              {p.direccion && <div style={{ fontSize: '13px', color: '#64748b' }}><Icons.MapPin size={14} /> {p.direccion}</div>}
              {p.saldoInicialCxp > 0 && (
                <div style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', background: '#fef9c3', textAlign: 'center', fontSize: '13px', color: '#854d0e', fontWeight: 600 }}>
                  Saldo inicial: C$ {p.saldoInicialCxp.toFixed(2)}
                </div>
              )}
              <div style={{ marginTop: '8px', padding: '8px', borderRadius: '8px', background: '#f8fafc', textAlign: 'center', fontSize: '13px', color: '#475569' }}>
                {p._count?.compras || 0} compras registradas
              </div>
            </div>
          ))
        )}
      </div>

      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{editando ? <><Icons.Edit size={16} /> Editar</> : <><Icons.Factory size={16} /> Nuevo</>} Proveedor</h2>
              <button onClick={() => setMostrarForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={guardar}>
              {[
                { key: 'nombre',    label: 'Nombre *',         placeholder: 'Ej: Distribuidora López', required: true  },
                { key: 'contacto',  label: 'Persona de contacto', placeholder: 'Ej: Juan López',       required: false },
                { key: 'telefono',  label: 'Teléfono',         placeholder: '8888-8888',               required: false },
                { key: 'email',     label: 'Email',            placeholder: 'correo@ejemplo.com',      required: false },
                { key: 'direccion', label: 'Dirección',        placeholder: 'Dirección del proveedor', required: false },
                { key: 'saldoInicialCxp', label: 'Saldo inicial C$ (adeudo anterior)', placeholder: '0.00', required: false },
              ].map(campo => (
                <div key={campo.key} style={{ marginBottom: '14px' }}>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>{campo.label}</label>
                  <input required={campo.required} value={form[campo.key]}
                    onChange={e => setForm({...form, [campo.key]: e.target.value})}
                    placeholder={campo.placeholder}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              ))}
              <div style={{ display: 'flex', gap: '12px', marginTop: '8px' }}>
                <button type="button" onClick={() => setMostrarForm(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  <Icons.Save size={16} /> {editando ? 'Actualizar' : 'Guardar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {mostrarImportar && (
        <ImportarCSV
          onCerrar={() => setMostrarImportar(false)}
          onImportados={() => { setMostrarImportar(false); cargarProveedores() }}
          endpoint="/api/proveedores/importar"
          titulo="Importar Proveedores desde CSV"
          columnas={[
            { clave: 'nombre', label: 'Nombre *' },
            { clave: 'contacto', label: 'Contacto' },
            { clave: 'telefono', label: 'Teléfono' },
            { clave: 'email', label: 'Email' },
            { clave: 'direccion', label: 'Dirección' },
            { clave: 'saldoInicialCxp', label: 'Saldo Inicial C$' },
          ]}
        />
      )}

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}