'use client'
import { useState, useEffect } from 'react'
import ImportarCSV from '../components/ImportarCSV'
import * as Icons from 'lucide-react'

export default function Clientes() {
  const [clientes, setClientes]       = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [clienteVer, setClienteVer]   = useState(null)
  const [buscando, setBuscando]       = useState('')
  const [clienteEditando, setClienteEditando] = useState(null)
  const [page, setPage]               = useState(1)
  const [totalPages, setTotalPages]   = useState(1)
  const [totalClientes, setTotalClientes] = useState(0)
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState({
    nombre: '', telefono: '', cedula: '', direccion: '', limiteCredito: '', saldoInicial: ''
  })
  const [mostrarImportar, setMostrarImportar] = useState(false)

  useEffect(() => { cargarClientes(1).finally(() => setCargando(false)) }, [])

  async function cargarClientes(p) {
    const s = buscando ? `&buscar=${encodeURIComponent(buscando)}` : ''
    const res = await fetch(`/api/clientes?page=${p}&limit=30${s}`)
    const data = await res.json()
    setClientes(data.data || data || [])
    setTotalClientes(data.total || 0)
    setTotalPages(data.totalPages || 1)
    setPage(data.page || p)
  }

  async function guardarCliente(e) {
    e.preventDefault()
    const res = await fetch('/api/clientes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form)
    })
    if (res.ok) {
      setMostrarForm(false)
      setForm({ nombre: '', telefono: '', cedula: '', direccion: '', limiteCredito: '', saldoInicial: '' })
      cargarClientes(1)
    } else {
      alert('Error al guardar cliente')
    }
  }

  async function verHistorial(cliente) {
    const res  = await fetch('/api/facturas')
    const data = await res.json()
    const facturasDel = (data.data || data || []).filter(f => f.clienteId === cliente.id)
    setClienteVer({ ...cliente, facturas: facturasDel })
  }

  const clientesFiltrados = clientes

  function formatearFecha(fecha) {
    return new Date(fecha).toLocaleDateString('es-NI', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  if (cargando) return <div style={{ padding: 40, textAlign: 'center', color: '#64748b' }}>Cargando...</div>

  return (
    <div>
      {/* Encabezado */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 10 }}><Icons.Users size={24} /> Clientes</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>{totalClientes} clientes registrados</p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => setMostrarImportar(true)}
            style={{
              padding: '10px 18px', borderRadius: '8px', border: '2px dashed #3b82f6',
              background: '#eff6ff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#2563eb'
            }}>
            <Icons.Download size={16} /> Importar CSV
          </button>
          <button className="btn-verde" onClick={() => setMostrarForm(true)}>
            + Nuevo Cliente
          </button>
        </div>
      </div>

      {/* Buscador */}
      <div className="card" style={{ marginBottom: '20px', padding: '16px' }}>
        <input
          type="text"
          placeholder="Buscar por nombre, teléfono o cédula..."
          value={buscando}
          onChange={e => { setBuscando(e.target.value); if (e.target.value.length >= 2 || !e.target.value) cargarClientes(1) }}
          style={{
            width: '100%', padding: '10px 14px', borderRadius: '8px',
            border: '1px solid #e2e8f0', fontSize: '15px', outline: 'none'
          }}
        />
      </div>

      {/* Tabla de clientes */}
      <div className="card table-wrap" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['Cliente', 'Teléfono', 'Cédula', 'Dirección', 'Límite Crédito', 'Registrado', 'Historial'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clientesFiltrados.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
                  <div style={{ fontSize: '40px', marginBottom: '8px' }}><Icons.Users size={40} /></div>
                  No hay clientes aún. ¡Agregá el primero!
                </td>
              </tr>
            ) : (
              clientesFiltrados.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        width: '36px', height: '36px', borderRadius: '50%',
                        background: '#dbeafe', display: 'flex', alignItems: 'center',
                        justifyContent: 'center', fontWeight: 700, color: '#2563eb', fontSize: '16px'
                      }}>
                        {c.nombre.charAt(0).toUpperCase()}
                      </div>
                      <span style={{ fontWeight: 600, fontSize: '14px' }}>{c.nombre}</span>
                    </div>
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                    {c.telefono || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '14px', color: '#475569' }}>
                    {c.cedula || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {c.direccion || <span style={{ color: '#cbd5e1' }}>—</span>}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', fontWeight: 600, color: c.limiteCredito > 0 ? '#7c3aed' : '#94a3b8' }}>
                    {c.limiteCredito > 0 ? `C$ ${c.limiteCredito.toFixed(2)}` : '—'}
                  </td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {formatearFecha(c.creadoEn)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => verHistorial(c)}
                        style={{
                          padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0',
                          background: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600
                        }}>
                        <Icons.FileText size={16} />
                      </button>
                      <button onClick={() => {
                      setClienteEditando(c)
                      setForm({ nombre: c.nombre, telefono: c.telefono || '', cedula: c.cedula || '', direccion: c.direccion || '', limiteCredito: c.limiteCredito || '', saldoInicial: c.saldoInicial || '' })
                      }}
                        style={{
                          padding: '6px 10px', borderRadius: '6px', border: '1px solid #dbeafe',
                          background: '#dbeafe', cursor: 'pointer', fontSize: '13px', fontWeight: 600, color: '#2563eb'
                        }}>
                        ✏️
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 8, marginTop: 16 }}>
          <button onClick={() => cargarClientes(page - 1)} disabled={page <= 1} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: page <= 1 ? '#f1f5f9' : '#fff',
            cursor: page <= 1 ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, color: page <= 1 ? '#94a3b8' : '#1e293b'
          }}>‹ Anterior</button>
          <span style={{ fontSize: 13, color: '#475569' }}>Pág. {page} de {totalPages} ({totalClientes} clientes)</span>
          <button onClick={() => cargarClientes(page + 1)} disabled={page >= totalPages} style={{
            padding: '8px 16px', borderRadius: 8, border: '1px solid #e2e8f0', background: page >= totalPages ? '#f1f5f9' : '#fff',
            cursor: page >= totalPages ? 'not-allowed' : 'pointer', fontWeight: 600, fontSize: 13, color: page >= totalPages ? '#94a3b8' : '#1e293b'
          }}>Siguiente ›</button>
        </div>
      )}

      {/* Modal nuevo cliente */}
      {mostrarForm && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}><Icons.User size={16} /> Nuevo Cliente</h2>
              <button onClick={() => setMostrarForm(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <form onSubmit={guardarCliente}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Nombre completo *
                </label>
                <input required value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  placeholder="Ej: Juan Pérez"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Teléfono
                  </label>
                  <input value={form.telefono}
                    onChange={e => setForm({...form, telefono: e.target.value})}
                    placeholder="8888-8888"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                    Cédula
                  </label>
                  <input value={form.cedula}
                    onChange={e => setForm({...form, cedula: e.target.value})}
                    placeholder="000-000000-0000X"
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Dirección
                </label>
                <input value={form.direccion}
                  onChange={e => setForm({...form, direccion: e.target.value})}
                  placeholder="Ej: Del mercado 2 cuadras al sur"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Límite de Crédito (C$)
                </label>
                <input type="number" step="0.01" min="0" value={form.limiteCredito}
                  onChange={e => setForm({...form, limiteCredito: e.target.value})}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Saldo inicial (C$) — <span style={{ fontWeight: 400 }}>adeudo anterior del cliente</span>
                </label>
                <input type="number" step="0.01" min="0" value={form.saldoInicial}
                  onChange={e => setForm({...form, saldoInicial: e.target.value})}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setMostrarForm(false)}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  <Icons.Save size={16} /> Guardar Cliente
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal editar cliente */}
      {clienteEditando && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '460px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>✏️ Editar Cliente</h2>
              <button onClick={() => { setClienteEditando(null);                   setForm({ nombre: '', telefono: '', cedula: '', direccion: '', limiteCredito: '', saldoInicial: '' }) }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>
            <form onSubmit={async (e) => {
              e.preventDefault()
              const res = await fetch(`/api/clientes/${clienteEditando.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(form)
              })
              if (res.ok) {
                setClienteEditando(null)
                setForm({ nombre: '', telefono: '', cedula: '', direccion: '', limiteCredito: '', saldoInicial: '' })
                cargarClientes(1)
              } else {
                alert('Error al actualizar cliente')
              }
            }}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Nombre completo *</label>
                <input required value={form.nombre}
                  onChange={e => setForm({...form, nombre: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Teléfono</label>
                  <input value={form.telefono}
                    onChange={e => setForm({...form, telefono: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Cédula</label>
                  <input value={form.cedula}
                    onChange={e => setForm({...form, cedula: e.target.value})}
                    style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                  />
                </div>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Dirección</label>
                <input value={form.direccion}
                  onChange={e => setForm({...form, direccion: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Límite de Crédito (C$)</label>
                <input type="number" step="0.01" min="0" value={form.limiteCredito}
                  onChange={e => setForm({...form, limiteCredito: e.target.value})}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                  Saldo inicial (C$) — <span style={{ fontWeight: 400 }}>adeudo anterior del cliente</span>
                </label>
                <input type="number" step="0.01" min="0" value={form.saldoInicial}
                  onChange={e => setForm({...form, saldoInicial: e.target.value})}
                  placeholder="0.00"
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setClienteEditando(null); setForm({ nombre: '', telefono: '', cedula: '', direccion: '', limiteCredito: '', saldoInicial: '' }) }}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  <Icons.Save size={16} /> Guardar cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal historial de compras */}
      {clienteVer && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50
        }}>
          <div className="card" style={{ width: '520px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: 700 }}><Icons.FileText size={16} /> Historial de {clienteVer.nombre}</h2>
                <p style={{ fontSize: '13px', color: '#64748b' }}>{clienteVer.facturas.length} compras realizadas</p>
              </div>
              <button onClick={() => setClienteVer(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            {/* Total gastado */}
            <div style={{
              background: '#dcfce7', border: '1px solid #16a34a',
              borderRadius: '10px', padding: '16px', marginBottom: '20px',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center'
            }}>
              <span style={{ fontWeight: 600, color: '#15803d' }}>Total gastado</span>
              <span style={{ fontSize: '22px', fontWeight: 700, color: '#16a34a' }}>
                C$ {clienteVer.facturas.reduce((sum, f) => sum + f.total, 0).toFixed(2)}
              </span>
            </div>

            {clienteVer.facturas.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '30px', color: '#94a3b8' }}>
                Este cliente no tiene compras registradas
              </div>
            ) : (
              clienteVer.facturas.map(f => (
                <div key={f.id} style={{
                  border: '1px solid #e2e8f0', borderRadius: '10px',
                  padding: '14px', marginBottom: '10px'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                    <span style={{ fontWeight: 700, color: '#2563eb' }}>{f.numero}</span>
                    <span style={{ fontWeight: 700, color: '#16a34a' }}>C$ {f.total.toFixed(2)}</span>
                  </div>
                  <div style={{ fontSize: '12px', color: '#94a3b8' }}>
                    {formatearFecha(f.creadoEn)} · {f.metodoPago}
                  </div>
                </div>
              ))
            )}

            <button onClick={() => setClienteVer(null)}
              style={{
                width: '100%', marginTop: '12px', padding: '12px', borderRadius: '8px',
                border: 'none', background: '#1e293b', color: 'white',
                cursor: 'pointer', fontWeight: 600
              }}>
              Cerrar
            </button>
          </div>
        </div>
      )}

      {mostrarImportar && (
        <ImportarCSV
          onCerrar={() => setMostrarImportar(false)}
          onImportados={() => { setMostrarImportar(false); cargarClientes(1) }}
          endpoint="/api/clientes/importar"
          titulo="Importar Clientes desde CSV"
          columnas={[
            { clave: 'nombre', label: 'Nombre *' },
            { clave: 'telefono', label: 'Teléfono' },
            { clave: 'cedula', label: 'Cédula' },
            { clave: 'direccion', label: 'Dirección' },
            { clave: 'limiteCredito', label: 'Límite Crédito' },
            { clave: 'saldoInicial', label: 'Saldo Inicial' },
          ]}
        />
      )}
    </div>
  )
}