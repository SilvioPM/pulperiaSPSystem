'use client'
import { useState, useEffect } from 'react'
import { useAuth } from '@/app/context/AuthContext'
import { auditar } from '@/lib/auditarClient'

const LISTA_MODULOS = [
  { id: 'inicio', label: 'Inicio (Dashboard)' },
  { id: 'pos', label: 'POS - Vender' },
  { id: 'facturas', label: 'Facturas' },
  { id: 'compras', label: 'Compras' },
  { id: 'productos', label: 'Productos' },
  { id: 'clientes', label: 'Clientes' },
  { id: 'proveedores', label: 'Proveedores' },
  { id: 'inventario', label: 'Inventario' },
  { id: 'caja', label: 'Caja' },
  { id: 'cuentas-cobrar', label: 'CXC' },
  { id: 'deudas', label: 'CXP' },
  { id: 'proformas', label: 'Proformas' },
  { id: 'reportes', label: 'Reportes' },
  { id: 'configuracion', label: 'Configuración' },
  { id: 'usuarios', label: 'Usuarios' },
]

export default function UsuariosPage() {
  const { user } = useAuth()
  const [usuarios, setUsuarios] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editando, setEditando] = useState(null)
  const [form, setForm] = useState({ username: '', password: '', nombre: '', esAdmin: false, rol: 'cajero', modulos: [] })
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => { cargarUsuarios() }, [])

  async function cargarUsuarios() {
    const res = await fetch('/api/usuarios')
    const data = await res.json()
    if (Array.isArray(data)) setUsuarios(data)
  }

  function toggleModulo(id) {
    setForm(prev => ({
      ...prev,
      modulos: prev.modulos.includes(id) ? prev.modulos.filter(m => m !== id) : [...prev.modulos, id]
    }))
  }

  function resetForm() {
    setForm({ username: '', password: '', nombre: '', esAdmin: false, rol: 'cajero', modulos: [] })
    setEditando(null)
    setError('')
  }

  function editar(u) {
    setEditando(u)
    setForm({ username: u.username, password: '', nombre: u.nombre, esAdmin: u.esAdmin, rol: u.rol || 'cajero', modulos: u.modulos || [] })
    setShowForm(true)
  }

  async function guardar(e) {
    e.preventDefault()
    setCargando(true)
    setError('')
    try {
      if (editando) {
        const body = { id: editando.id, nombre: form.nombre, esAdmin: form.esAdmin, rol: form.rol, modulos: form.modulos }
        if (form.username !== editando.username) body.username = form.username
        if (form.password) body.password = form.password
        const res = await fetch('/api/usuarios', { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        auditar(user?.username || user?.nombre, 'editar', 'usuario', `Usuario "${form.username}" editado`)
      } else {
        const res = await fetch('/api/usuarios', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, rol: form.esAdmin ? 'admin' : form.rol }) })
        const data = await res.json()
        if (!res.ok) { setError(data.error); return }
        auditar(user?.username || user?.nombre, 'crear', 'usuario', `Usuario "${form.username}" creado`)
      }
      resetForm()
      setShowForm(false)
      cargarUsuarios()
    } catch (err) {
      setError(err.message)
    } finally {
      setCargando(false)
    }
  }

  if (!user || !user.esAdmin) {
    return <p style={{ color: 'red', textAlign: 'center', marginTop: 40 }}>Acceso denegado. Solo administradores.</p>
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <h1 style={{ margin: 0 }}>Usuarios</h1>
        <button onClick={() => { resetForm(); setShowForm(!showForm) }}
          style={{ padding: '10px 20px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
          {showForm ? 'Cancelar' : 'Nuevo Usuario'}
        </button>
      </div>

      {error && <p style={{ color: 'red', marginBottom: 12 }}>{error}</p>}

      {showForm && (
        <form onSubmit={guardar} style={{ background: '#fff', padding: 24, borderRadius: 8, marginBottom: 20, boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
          <h3>{editando ? 'Editar Usuario' : 'Nuevo Usuario'}</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Username</label>
              <input value={form.username} onChange={e => setForm({ ...form, username: e.target.value })}
                required style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>{editando ? 'Nueva contraseña (dejar vacío si no cambia)' : 'Contraseña'}</label>
              <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })}
                required={!editando} style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Nombre completo</label>
              <input value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })}
                required style={{ width: '100%', padding: 8, border: '1px solid #ccc', borderRadius: 4 }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, paddingTop: 24 }}>
              <input type="checkbox" id="esAdmin" checked={form.esAdmin}
                onChange={e => setForm({ ...form, esAdmin: e.target.checked })} />
              <label htmlFor="esAdmin">Administrador (acceso total)</label>
            </div>
          </div>

          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', marginBottom: 4, fontWeight: 600 }}>Rol</label>
            <select value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}
              disabled={form.esAdmin}
              style={{ width: '100%', maxWidth: 300, padding: 8, border: '1px solid #ccc', borderRadius: 4 }}>
              <option value="cajero">Cajero (solo ver)</option>
              <option value="supervisor">Supervisor (editar)</option>
              <option value="encargado">Encargado (editar)</option>
            </select>
            <p style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
              {form.esAdmin ? 'Los administradores tienen acceso total' : form.rol === 'cajero' ? 'Solo puede ver datos, no crear/editar/eliminar' : 'Puede crear, editar y eliminar en los módulos asignados'}
            </p>
          </div>

          {!form.esAdmin && (
            <div style={{ marginTop: 16 }}>
              <p style={{ fontWeight: 600, marginBottom: 8 }}>Módulos permitidos:</p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {LISTA_MODULOS.filter(m => m.id !== 'usuarios').map(mod => (
                  <label key={mod.id} style={{
                    display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                    background: form.modulos.includes(mod.id) ? '#dbeafe' : '#f3f4f6',
                    borderRadius: 6, cursor: 'pointer', fontSize: 14
                  }}>
                    <input type="checkbox" checked={form.modulos.includes(mod.id)}
                      onChange={() => toggleModulo(mod.id)} />
                    {mod.label}
                  </label>
                ))}
              </div>
            </div>
          )}

          <button type="submit" disabled={cargando}
            style={{ marginTop: 16, padding: '10px 24px', background: '#16a34a', color: '#fff', border: 'none', borderRadius: 6, cursor: 'pointer' }}>
            {cargando ? 'Guardando...' : 'Guardar'}
          </button>
        </form>
      )}

      <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff', borderRadius: 8, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.1)' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            <th style={thStyle}>Username</th>
            <th style={thStyle}>Nombre</th>
            <th style={thStyle}>Rol</th>
            <th style={thStyle}>Módulos</th>
            <th style={thStyle}>Activo</th>
            <th style={thStyle}>Acción</th>
          </tr>
        </thead>
        <tbody>
          {usuarios.map(u => (
            <tr key={u.id} style={{ borderTop: '1px solid #e5e7eb' }}>
              <td style={tdStyle}>{u.username}</td>
              <td style={tdStyle}>{u.nombre}</td>
              <td style={tdStyle}>{u.esAdmin ? 'Admin' : (u.rol === 'supervisor' ? 'Supervisor' : u.rol === 'encargado' ? 'Encargado' : 'Cajero')}</td>
              <td style={tdStyle}>
                {u.esAdmin ? 'Todos' : (u.modulos || []).join(', ')}
              </td>
              <td style={tdStyle}>{u.activo ? '✅' : '❌'}</td>
              <td style={tdStyle}>
                <button onClick={() => editar(u)}
                  style={{ padding: '4px 12px', background: '#2563eb', color: '#fff', border: 'none', borderRadius: 4, cursor: 'pointer' }}>
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const thStyle = { padding: '12px 16px', textAlign: 'left', fontSize: 14, fontWeight: 600, color: '#374151' }
const tdStyle = { padding: '12px 16px', fontSize: 14, color: '#333' }
