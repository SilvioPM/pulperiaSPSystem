'use client'
import { useState, useEffect } from 'react'
import AuthGuard from '@/app/components/AuthGuard'

const ACCIONES = ['', 'crear', 'editar', 'anular', 'eliminar', 'login', 'logout']
const ENTIDADES = ['', 'producto', 'usuario', 'factura', 'config', 'cliente', 'compra', 'proforma']

export default function AuditoriaPage() {
  const [rows, setRows] = useState([])
  const [total, setTotal] = useState(0)
  const [pagina, setPagina] = useState(1)
  const [totalPaginas, setTotalPaginas] = useState(1)
  const [usuarios, setUsuarios] = useState([])
  const [filtros, setFiltros] = useState({ usuario: '', accion: '', entidad: '', desde: '', hasta: '' })
  const [busquedaUsuario, setBusquedaUsuario] = useState('')
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    fetch('/api/usuarios').then(r => r.json()).then(d => setUsuarios(d || [])).catch(() => {})
    cargar()
  }, [pagina])

  function cargar() {
    setCargando(true)
    const params = new URLSearchParams({ pagina, limite: 50 })
    if (busquedaUsuario) params.set('usuario', busquedaUsuario)
    else if (filtros.usuario) params.set('usuario', filtros.usuario)
    if (filtros.accion) params.set('accion', filtros.accion)
    if (filtros.entidad) params.set('entidad', filtros.entidad)
    if (filtros.desde) params.set('desde', filtros.desde)
    if (filtros.hasta) params.set('hasta', filtros.hasta)
    fetch(`/api/auditoria?${params}`)
      .then(r => r.json())
      .then(d => {
        setRows(d.rows || [])
        setTotal(d.total || 0)
        setTotalPaginas(d.totalPaginas || 1)
      })
      .catch(() => {})
      .finally(() => setCargando(false))
  }

  function buscar() {
    setPagina(1)
    cargar()
  }

  function limpiar() {
    setFiltros({ usuario: '', accion: '', entidad: '', desde: '', hasta: '' })
    setBusquedaUsuario('')
    setPagina(1)
  }

  const badgeAccion = (a) => ({
    crear: { bg: '#dcfce7', color: '#166534' },
    editar: { bg: '#dbeafe', color: '#1e40af' },
    anular: { bg: '#fef3c7', color: '#92400e' },
    eliminar: { bg: '#fce4ec', color: '#b91c1c' },
    login: { bg: '#e0f2fe', color: '#0369a1' },
    logout: { bg: '#f1f5f9', color: '#475569' },
  }[a] || { bg: '#f1f5f9', color: '#334155' })

  return (
    <AuthGuard modulos={['configuracion']}>
      <div style={{ padding: '24px' }}>
        <h1 style={{ fontSize: '22px', fontWeight: 700, color: '#1e293b', marginBottom: '24px' }}>
          Auditoría del Sistema
        </h1>

        <div style={{
          display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'end',
          background: '#fff', padding: '16px', borderRadius: '12px', marginBottom: '20px',
          border: '1px solid #e2e8f0'
        }}>
          {[
            { key: 'usuario', placeholder: 'Usuario', options: usuarios.map(u => u.username).filter(Boolean) },
            { key: 'accion', placeholder: 'Acción', options: ACCIONES },
            { key: 'entidad', placeholder: 'Entidad', options: ENTIDADES },
          ].map(c => (
            <div key={c.key}>
              <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>
                {c.placeholder}
              </label>
              {c.options ? (
                <div style={{ display: 'flex', gap: '4px' }}>
                  <select value={filtros[c.key]} onChange={e => setFiltros({ ...filtros, [c.key]: e.target.value })}
                    style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', minWidth: '130px' }}>
                    <option value="">Todos</option>
                    {c.key === 'usuario' && (
                      <optgroup label="— Usuarios del sistema —">
                        {c.options.map(o => <option key={o} value={o}>{o}</option>)}
                      </optgroup>
                    )}
                    {c.key !== 'usuario' && c.options.map(o => <option key={o} value={o}>{o || 'Todas'}</option>)}
                  </select>
                  {c.key === 'usuario' && (
                    <input value={busquedaUsuario} onChange={e => setBusquedaUsuario(e.target.value)}
                      placeholder="Buscar texto..." style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px', width: '140px' }}
                    />
                  )}
                </div>
              ) : (
                <input value={filtros[c.key]} onChange={e => setFiltros({ ...filtros, [c.key]: e.target.value })}
                  placeholder={c.placeholder} style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
                />
              )}
            </div>
          ))}
          <div>
            <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>Desde</label>
            <input type="date" value={filtros.desde} onChange={e => setFiltros({ ...filtros, desde: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <div>
            <label style={{ fontSize: '12px', color: '#64748b', marginBottom: '4px', display: 'block' }}>Hasta</label>
            <input type="date" value={filtros.hasta} onChange={e => setFiltros({ ...filtros, hasta: e.target.value })}
              style={{ padding: '8px 12px', border: '1px solid #e2e8f0', borderRadius: '8px', fontSize: '14px' }}
            />
          </div>
          <button onClick={buscar} style={{
            padding: '8px 20px', background: '#16a34a', color: '#fff', border: 'none',
            borderRadius: '8px', cursor: 'pointer', fontWeight: 500, height: '36px'
          }}>Buscar</button>
          <button onClick={limpiar} style={{
            padding: '8px 16px', background: '#fff', color: '#64748b', border: '1px solid #e2e8f0',
            borderRadius: '8px', cursor: 'pointer', fontWeight: 500, height: '36px'
          }}>Limpiar</button>
        </div>

        {cargando ? (
          <div style={{ textAlign: 'center', color: '#64748b', padding: '40px' }}>Cargando...</div>
        ) : rows.length === 0 ? (
          <div style={{ textAlign: 'center', color: '#94a3b8', padding: '40px' }}>No se encontraron registros</div>
        ) : (
          <>
            <div style={{ overflowX: 'auto', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e2e8f0', background: '#f8fafc' }}>
                    <th style={thStyle}>#</th>
                    <th style={thStyle}>Usuario</th>
                    <th style={thStyle}>Acción</th>
                    <th style={thStyle}>Entidad</th>
                    <th style={thStyle}>Detalle</th>
                    <th style={thStyle}>Fecha</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r, i) => {
                    const s = badgeAccion(r.accion)
                    return (
                      <tr key={r.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                        <td style={tdStyle}>{(pagina - 1) * 50 + i + 1}</td>
                        <td style={tdStyle}>
                          <span style={{ fontWeight: 500 }}>{r.usuario}</span>
                        </td>
                        <td style={tdStyle}>
                          <span style={{
                            display: 'inline-block', padding: '2px 10px', borderRadius: '999px',
                            fontSize: '12px', fontWeight: 500, background: s.bg, color: s.color
                          }}>{r.accion}</span>
                        </td>
                        <td style={{ ...tdStyle, textTransform: 'capitalize' }}>{r.entidad}</td>
                        <td style={{ ...tdStyle, maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: '#475569', fontSize: '13px' }}>
                          {r.detalle || '—'}
                        </td>
                        <td style={tdStyle}>
                          <span style={{ fontSize: '12px', color: '#64748b' }}>
                            {new Date(r.createdAt).toLocaleString('es-NI')}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
              <span style={{ fontSize: '13px', color: '#64748b' }}>Total: {total} registros</span>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <button disabled={pagina <= 1} onClick={() => setPagina(p => p - 1)}
                  style={btnPag(pagina <= 1)}>← Anterior</button>
                <span style={{ fontSize: '13px', color: '#475569' }}>{pagina} / {totalPaginas}</span>
                <button disabled={pagina >= totalPaginas} onClick={() => setPagina(p => p + 1)}
                  style={btnPag(pagina >= totalPaginas)}>Siguiente →</button>
              </div>
            </div>
          </>
        )}
      </div>
    </AuthGuard>
  )
}

const thStyle = { padding: '10px 12px', textAlign: 'left', fontWeight: 600, color: '#475569', fontSize: '12px', textTransform: 'uppercase', letterSpacing: '0.5px' }
const tdStyle = { padding: '10px 12px' }
const btnPag = (disabled) => ({
  padding: '6px 14px', borderRadius: '8px', border: '1px solid #e2e8f0',
  background: disabled ? '#f1f5f9' : '#fff', color: disabled ? '#cbd5e1' : '#475569',
  cursor: disabled ? 'not-allowed' : 'pointer', fontSize: '13px'
})