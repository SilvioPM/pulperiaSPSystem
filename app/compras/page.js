'use client'
import { useState, useEffect } from 'react'
import Toast from '../components/Toast'
import { useToast } from '../hooks/useToast'

export default function Compras() {
  const [compras, setCompras]         = useState([])
  const [proveedores, setProveedores] = useState([])
  const [productos, setProductos]     = useState([])
  const [mostrarForm, setMostrarForm] = useState(false)
  const [compraVer, setCompraVer]     = useState(null)
  const [mostrarAbono, setMostrarAbono] = useState(false)
  const [formAbono, setFormAbono]     = useState({ monto: '', nota: '' })
  const [carrito, setCarrito]         = useState([])
  const [filtro, setFiltro]           = useState('todas')
  const [form, setForm] = useState({
    proveedorId: '', esCredito: false, nota: ''
  })
  const { toast, mostrar, cerrar } = useToast()
  const [buscarProducto, setBuscarProducto]   = useState('')
  const [mostrarNuevoProd, setMostrarNuevoProd] = useState(false)
  const [categorias, setCategorias]           = useState([])
  const [formProd, setFormProd] = useState({
     nombre: '', codigo: '', precio: '0', costo: '0',
     stock: '0', stockMinimo: '5',
     unidadBase: 'unidad', unidadCompra: 'unidad',
     factorConversion: '1', precioMayor: '0', categoriaId: ''
  })

  useEffect(() => { cargarTodo() }, [])

 async function cargarTodo() {
  try {
    const [cRes, pRes, prRes, catRes] = await Promise.all([
      fetch('/api/compras'),
      fetch('/api/productos'),
      fetch('/api/proveedores'),
      fetch('/api/categorias')
    ])
    const [c, p, pr, cat] = await Promise.all([
      cRes.json(), pRes.json(), prRes.json(), catRes.json()
    ])
    setCompras(Array.isArray(c) ? c : [])
    setProductos(Array.isArray(p) ? p : [])
    setProveedores(Array.isArray(pr) ? pr : [])
    setCategorias(Array.isArray(cat) ? cat : [])
  } catch { setCompras([]) }
}

async function crearProductoRapido(e) {
  e.preventDefault()
  try {
    const res  = await fetch('/api/productos', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formProd)
    })
    const data = await res.json()
    if (res.ok) {
      mostrar(`Producto "${data.nombre}" creado`, 'exito')
      setMostrarNuevoProd(false)
      setFormProd({
        nombre: '', codigo: '', precio: '0', costo: '0',
        stock: '0', stockMinimo: '5',
        unidadBase: 'unidad', unidadCompra: 'unidad',
        factorConversion: '1', precioMayor: '0', categoriaId: ''
      })
      await cargarTodo()
      // Auto-agregar el producto recién creado al carrito
      agregarProducto(data)
    } else {
      mostrar(data.error, 'error')
    }
  } catch { mostrar('Error al crear producto', 'error') }
}

  function agregarProducto(producto) {
    setCarrito(prev => {
      const existe = prev.find(i => i.productoId === producto.id)
      if (existe) return prev
      return [...prev, {
        productoId: producto.id,
        nombre:     producto.nombre,
        unidad:     producto.unidadCompra || producto.unidadBase || 'unidad',
        cantidad:   1,
        costo:      producto.costo || 0,
        subtotal:   producto.costo || 0
      }]
    })
  }

  function actualizarDetalle(productoId, campo, valor) {
    setCarrito(prev => prev.map(i => {
      if (i.productoId !== productoId) return i
      const actualizado = { ...i, [campo]: parseFloat(valor) || 0 }
      actualizado.subtotal = actualizado.cantidad * actualizado.costo
      return actualizado
    }))
  }

  const subtotal = carrito.reduce((sum, i) => sum + i.subtotal, 0)
  const total    = subtotal

  async function guardarCompra() {
    if (!form.proveedorId) return mostrar('Seleccioná un proveedor', 'alerta')
    if (carrito.length === 0) return mostrar('Agregá productos a la compra', 'alerta')

    try {
      const res  = await fetch('/api/compras', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proveedorId: parseInt(form.proveedorId),
          esCredito:   form.esCredito,
          subtotal, iva: 0, total,
          nota:        form.nota,
          detalles:    carrito
        })
      })
      const data = await res.json()
      if (res.ok) {
        mostrar(`Compra ${data.numero} registrada exitosamente`, 'exito')
        setMostrarForm(false)
        setCarrito([])
        setForm({ proveedorId: '', esCredito: false, nota: '' })
        cargarTodo()
      } else {
        mostrar(data.error, 'error')
      }
    } catch { mostrar('Error al guardar compra', 'error') }
  }

  async function registrarAbono(e) {
    e.preventDefault()
    try {
      const res  = await fetch('/api/abonos-compra', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ compraId: compraVer.id, monto: parseFloat(formAbono.monto), nota: formAbono.nota })
      })
      const data = await res.json()
      if (res.ok) {
        mostrar('Abono registrado exitosamente', 'exito')
        setMostrarAbono(false)
        setFormAbono({ monto: '', nota: '' })
        setCompraVer(null)
        cargarTodo()
      } else {
        mostrar(data.error, 'error')
      }
    } catch { mostrar('Error al registrar abono', 'error') }
  }

  const comprasFiltradas = compras.filter(c =>
    filtro === 'todas'   ? true :
    filtro === 'credito' ? c.esCredito && c.saldoPendiente > 0 :
    filtro === 'pagadas' ? !c.esCredito || c.saldoPendiente <= 0 : true
  )

  const totalPendiente = compras.filter(c => c.esCredito).reduce((sum, c) => sum + c.saldoPendiente, 0)

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 700, color: '#1e293b' }}>🛒 Compras</h1>
          <p style={{ color: '#64748b', fontSize: '14px' }}>Registro de compras a proveedores</p>
        </div>
        <button className="btn-verde" onClick={() => setMostrarForm(true)}>+ Nueva Compra</button>
      </div>

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="card" style={{ borderLeft: '4px solid #2563eb' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total compras</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#2563eb' }}>{compras.length}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #dc2626' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Cuentas pendientes</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#dc2626' }}>C$ {totalPendiente.toFixed(2)}</div>
        </div>
        <div className="card" style={{ borderLeft: '4px solid #16a34a' }}>
          <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Total invertido</div>
          <div style={{ fontSize: '26px', fontWeight: 700, color: '#16a34a' }}>
            C$ {compras.reduce((sum, c) => sum + c.total, 0).toFixed(2)}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: '#f1f5f9', padding: '4px', borderRadius: '10px', width: 'fit-content' }}>
        {[
          { key: 'todas',   label: `📋 Todas (${compras.length})`                                      },
          { key: 'credito', label: `⏳ Pendientes (${compras.filter(c => c.esCredito && c.saldoPendiente > 0).length})` },
          { key: 'pagadas', label: `✅ Pagadas`                                                          },
        ].map(t => (
          <button key={t.key} onClick={() => setFiltro(t.key)}
            style={{
              padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer',
              fontWeight: 600, fontSize: '13px',
              background: filtro === t.key ? 'white' : 'transparent',
              color: filtro === t.key ? '#1e293b' : '#64748b',
              boxShadow: filtro === t.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #e2e8f0' }}>
              {['# Compra', 'Fecha', 'Proveedor', 'Total', 'Pendiente', 'Tipo', 'Acciones'].map(h => (
                <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '13px', fontWeight: 600, color: '#475569' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {comprasFiltradas.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>No hay compras</td></tr>
            ) : (
              comprasFiltradas.map((c, i) => (
                <tr key={c.id} style={{ borderBottom: '1px solid #f1f5f9', background: i % 2 === 0 ? 'white' : '#fafafa' }}>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#2563eb' }}>{c.numero}</td>
                  <td style={{ padding: '12px 16px', fontSize: '13px', color: '#64748b' }}>
                    {new Date(c.creadoEn).toLocaleDateString('es-NI')}
                  </td>
                  <td style={{ padding: '12px 16px', fontWeight: 600 }}>{c.proveedor?.nombre}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: '#16a34a' }}>C$ {c.total.toFixed(2)}</td>
                  <td style={{ padding: '12px 16px', fontWeight: 700, color: c.saldoPendiente > 0 ? '#dc2626' : '#16a34a' }}>
                    C$ {c.saldoPendiente.toFixed(2)}
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <span style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: 700,
                      background: c.esCredito ? '#fee2e2' : '#dcfce7',
                      color: c.esCredito ? '#dc2626' : '#16a34a'
                    }}>
                      {c.esCredito ? '📋 Crédito' : '💵 Contado'}
                    </span>
                  </td>
                  <td style={{ padding: '12px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setCompraVer(c)}
                        style={{ padding: '6px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontSize: '13px' }}>
                        👁️
                      </button>
                      {c.saldoPendiente > 0 && (
                        <button onClick={() => { setCompraVer(c); setMostrarAbono(true) }}
                          style={{ padding: '6px 12px', borderRadius: '6px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer', fontSize: '13px', fontWeight: 600 }}>
                          💰 Abonar
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal nueva compra */}
      {mostrarForm && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div style={{ background: 'white', borderRadius: '16px', padding: '24px', width: '900px', maxHeight: '90vh', overflowY: 'auto', display: 'flex', gap: '20px' }}>

            {/* Panel izquierdo — productos */}
<div style={{ flex: 1 }}>
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
    <h3 style={{ fontWeight: 700 }}>📦 Productos</h3>
    <button onClick={() => setMostrarNuevoProd(true)}
      style={{
        padding: '6px 12px', borderRadius: '8px', border: 'none',
        background: '#7c3aed', color: 'white', cursor: 'pointer',
        fontSize: '13px', fontWeight: 600
      }}>
      ➕ Nuevo producto
    </button>
  </div>

  <input type="text" placeholder="🔍 Buscar producto..."
    value={buscarProducto}
    onChange={e => setBuscarProducto(e.target.value)}
    style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', marginBottom: '12px', outline: 'none' }}
  />

  <div style={{ maxHeight: '460px', overflowY: 'auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', alignContent: 'start' }}>
    {productos
      .filter(p => p.nombre.toLowerCase().includes(buscarProducto.toLowerCase()) ||
                   p.codigo?.includes(buscarProducto))
      .map(p => (
        <div key={p.id} onClick={() => agregarProducto(p)}
          style={{
            padding: '10px', borderRadius: '8px',
            border: carrito.find(i => i.productoId === p.id)
              ? '2px solid #16a34a' : '1px solid #e2e8f0',
            cursor: 'pointer', background: carrito.find(i => i.productoId === p.id)
              ? '#dcfce7' : 'white'
          }}>
          <div style={{ fontSize: '13px', fontWeight: 600 }}>{p.nombre}</div>
          <div style={{ fontSize: '11px', color: '#64748b' }}>
            Stock: {p.stock} {p.unidadBase}
          </div>
          <div style={{ fontSize: '11px', color: '#16a34a', fontWeight: 600 }}>
            Costo actual: C$ {p.costo}
          </div>
          {p.unidadCompra !== p.unidadBase && (
            <div style={{ fontSize: '11px', color: '#7c3aed' }}>
              1 {p.unidadCompra} = {p.factorConversion} {p.unidadBase}s
            </div>
          )}
        </div>
      ))
    }
    {productos.filter(p => p.nombre.toLowerCase().includes(buscarProducto.toLowerCase())).length === 0 && (
      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '20px', color: '#94a3b8' }}>
        <div style={{ fontSize: '13px', marginBottom: '8px' }}>No se encontró el producto</div>
        <button onClick={() => {
          setFormProd(prev => ({ ...prev, nombre: buscarProducto }))
          setMostrarNuevoProd(true)
        }}
          style={{
            padding: '8px 16px', borderRadius: '8px', border: 'none',
            background: '#7c3aed', color: 'white', cursor: 'pointer',
            fontSize: '13px', fontWeight: 600
          }}>
          ➕ Crear "{buscarProducto}"
        </button>
      </div>
    )}
  </div>
</div>

            {/* Detalle */}
            <div style={{ width: '360px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <h3 style={{ fontWeight: 700 }}>🛒 Detalle de compra</h3>
                <button onClick={() => { setMostrarForm(false); setCarrito([]) }}
                  style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
              </div>

              {/* Proveedor */}
              <div>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Proveedor *</label>
                <select value={form.proveedorId} onChange={e => setForm({...form, proveedorId: e.target.value})}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                  <option value="">Seleccioná proveedor...</option>
                  {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
              </div>

              {/* Tipo de pago */}
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setForm({...form, esCredito: false})}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid',
                    borderColor: !form.esCredito ? '#16a34a' : '#e2e8f0',
                    background: !form.esCredito ? '#dcfce7' : 'white',
                    color: !form.esCredito ? '#16a34a' : '#64748b',
                    cursor: 'pointer', fontWeight: 700
                  }}>
                  💵 Contado
                </button>
                <button onClick={() => setForm({...form, esCredito: true})}
                  style={{
                    flex: 1, padding: '10px', borderRadius: '8px', border: '2px solid',
                    borderColor: form.esCredito ? '#dc2626' : '#e2e8f0',
                    background: form.esCredito ? '#fee2e2' : 'white',
                    color: form.esCredito ? '#dc2626' : '#64748b',
                    cursor: 'pointer', fontWeight: 700
                  }}>
                  📋 Crédito
                </button>
              </div>

              {/* Items del carrito */}
              <div style={{ flex: 1, maxHeight: '300px', overflowY: 'auto' }}>
                {carrito.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '20px', color: '#94a3b8', fontSize: '13px' }}>
                    Tocá un producto para agregarlo
                  </div>
                ) : (
                  carrito.map(item => (
                    <div key={item.productoId} style={{ padding: '10px 0', borderBottom: '1px solid #f1f5f9' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '13px', fontWeight: 600 }}>{item.nombre}</span>
                        <button onClick={() => setCarrito(prev => prev.filter(i => i.productoId !== item.productoId))}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', fontSize: '16px' }}>✕</button>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#64748b' }}>Cantidad ({item.unidad})</label>
                          <input type="number" step="0.5" value={item.cantidad}
                            onChange={e => actualizarDetalle(item.productoId, 'cantidad', e.target.value)}
                            style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                          />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#64748b' }}>Costo por {item.unidad}</label>
                          <input type="number" step="0.01" value={item.costo}
                            onChange={e => actualizarDetalle(item.productoId, 'costo', e.target.value)}
                            style={{ width: '100%', padding: '6px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
                          />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', fontSize: '13px', fontWeight: 700, marginTop: '4px', color: '#16a34a' }}>
                        C$ {item.subtotal.toFixed(2)}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Total */}
              <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '10px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '20px', fontWeight: 700, color: '#1e293b' }}>
                  <span>TOTAL</span>
                  <span>C$ {total.toFixed(2)}</span>
                </div>
              </div>

              {/* Nota */}
              <input value={form.nota} onChange={e => setForm({...form, nota: e.target.value})}
                placeholder="📝 Nota (opcional)"
                style={{ width: '100%', padding: '8px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '13px', outline: 'none' }}
              />

              <button onClick={guardarCompra}
                className="btn-verde" style={{ padding: '14px', fontSize: '15px' }}>
                💾 Registrar Compra
              </button>
            </div>

            {/* Modal crear producto rápido */}
            {mostrarNuevoProd && (
              <div style={{
                position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)',
                display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100
              }}>
                <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
                    <h2 style={{ fontSize: '18px', fontWeight: 700 }}>➕ Nuevo Producto</h2>
                    <button onClick={() => setMostrarNuevoProd(false)}
                      style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
                  </div>

                  <form onSubmit={crearProductoRapido}>
                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Nombre *</label>
                      <input required value={formProd.nombre}
                        onChange={e => setFormProd({...formProd, nombre: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                      />
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Unidad base</label>
                        <select value={formProd.unidadBase}
                          onChange={e => setFormProd({...formProd, unidadBase: e.target.value})}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                          <option value="unidad">Unidad</option>
                          <option value="libra">Libra</option>
                          <option value="kilo">Kilo</option>
                          <option value="litro">Litro</option>
                        </select>
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Unidad compra</label>
                        <select value={formProd.unidadCompra}
                          onChange={e => setFormProd({...formProd, unidadCompra: e.target.value})}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                          <option value="unidad">Unidad</option>
                          <option value="quintal">Quintal</option>
                          <option value="galón">Galón</option>
                          <option value="docena">Docena</option>
                          <option value="caja">Caja</option>
                        </select>
                      </div>
                    </div>

                    {formProd.unidadCompra !== formProd.unidadBase && (
                      <div style={{ marginBottom: '14px' }}>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                          ¿Cuántas {formProd.unidadBase}s tiene 1 {formProd.unidadCompra}?
                        </label>
                        <input type="number" step="0.001" value={formProd.factorConversion}
                          onChange={e => setFormProd({...formProd, factorConversion: e.target.value})}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                        />
                      </div>
                    )}

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                          Precio venta por {formProd.unidadBase} (C$)
                        </label>
                        <input type="number" step="0.01" value={formProd.precio}
                          onChange={e => setFormProd({...formProd, precio: e.target.value})}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>
                          Costo por {formProd.unidadCompra} (C$)
                        </label>
                        <input type="number" step="0.01" value={formProd.costo}
                          onChange={e => setFormProd({...formProd, costo: e.target.value})}
                          style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '14px' }}>
                      <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Categoría</label>
                      <select value={formProd.categoriaId}
                        onChange={e => setFormProd({...formProd, categoriaId: e.target.value})}
                        style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}>
                        <option value="">Sin categoría</option>
                        {categorias.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                      </select>
                    </div>

                    <div style={{
                      background: '#dbeafe', borderRadius: '8px', padding: '10px',
                      fontSize: '13px', color: '#2563eb', marginBottom: '16px'
                    }}>
                      💡 El stock inicial será 0. Se actualizará cuando registres la compra.
                    </div>

                    <div style={{ display: 'flex', gap: '12px' }}>
                      <button type="button" onClick={() => setMostrarNuevoProd(false)}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                        Cancelar
                      </button>
                      <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                        💾 Crear y agregar a compra
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal ver compra */}
      {compraVer && !mostrarAbono && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{compraVer.numero}</h2>
              <button onClick={() => setCompraVer(null)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ marginBottom: '16px', fontSize: '14px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div><strong>Proveedor:</strong> {compraVer.proveedor?.nombre}</div>
              <div><strong>Fecha:</strong> {new Date(compraVer.creadoEn).toLocaleDateString('es-NI')}</div>
              <div><strong>Tipo:</strong> {compraVer.esCredito ? '📋 Crédito' : '💵 Contado'}</div>
              {compraVer.nota && <div><strong>Nota:</strong> {compraVer.nota}</div>}
            </div>

            <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '16px' }}>
              <thead>
                <tr style={{ background: '#f8fafc' }}>
                  {['Producto', 'Cant.', 'Unidad', 'Costo', 'Subtotal'].map(h => (
                    <th key={h} style={{ padding: '8px', textAlign: 'left', fontSize: '12px', color: '#64748b' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {compraVer.detalles?.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '8px', fontSize: '13px', fontWeight: 600 }}>{d.producto?.nombre}</td>
                    <td style={{ padding: '8px', fontSize: '13px' }}>{d.cantidad}</td>
                    <td style={{ padding: '8px', fontSize: '13px' }}>{d.unidad}</td>
                    <td style={{ padding: '8px', fontSize: '13px' }}>C$ {d.costo?.toFixed(2)}</td>
                    <td style={{ padding: '8px', fontSize: '13px', fontWeight: 700 }}>C$ {d.subtotal?.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div style={{ borderTop: '2px solid #e2e8f0', paddingTop: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700 }}>
                <span>Total</span><span>C$ {compraVer.total?.toFixed(2)}</span>
              </div>
              {compraVer.saldoPendiente > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: '#dc2626', marginTop: '8px' }}>
                  <span>Saldo pendiente</span><span>C$ {compraVer.saldoPendiente?.toFixed(2)}</span>
                </div>
              )}
            </div>

            {compraVer.abonosCompra?.length > 0 && (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, marginBottom: '8px' }}>Abonos realizados:</div>
                {compraVer.abonosCompra.map(a => (
                  <div key={a.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', padding: '6px 0', borderBottom: '1px solid #f1f5f9' }}>
                    <span style={{ color: '#64748b' }}>{new Date(a.creadoEn).toLocaleDateString('es-NI')} {a.nota && `— ${a.nota}`}</span>
                    <span style={{ fontWeight: 600, color: '#16a34a' }}>C$ {a.monto?.toFixed(2)}</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', gap: '10px' }}>
              {compraVer.saldoPendiente > 0 && (
                <button onClick={() => setMostrarAbono(true)}
                  className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  💰 Registrar Abono
                </button>
              )}
              <button onClick={() => setCompraVer(null)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal abono */}
      {mostrarAbono && compraVer && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}>
          <div className="card" style={{ width: '400px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 700 }}>💰 Abonar a {compraVer.numero}</h2>
              <button onClick={() => { setMostrarAbono(false); setFormAbono({ monto: '', nota: '' }) }}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
            </div>

            <div style={{ background: '#fee2e2', borderRadius: '10px', padding: '14px', marginBottom: '20px' }}>
              <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '4px' }}>Saldo pendiente con {compraVer.proveedor?.nombre}</div>
              <div style={{ fontSize: '24px', fontWeight: 700, color: '#dc2626' }}>C$ {compraVer.saldoPendiente?.toFixed(2)}</div>
            </div>

            <form onSubmit={registrarAbono}>
              <div style={{ marginBottom: '16px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Monto (C$) *</label>
                <input required type="number" step="0.01" max={compraVer.saldoPendiente}
                  value={formAbono.monto} onChange={e => setFormAbono({...formAbono, monto: e.target.value})}
                  placeholder={`Máx: C$ ${compraVer.saldoPendiente?.toFixed(2)}`}
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
                <button type="button"
                  onClick={() => setFormAbono({...formAbono, monto: compraVer.saldoPendiente?.toString()})}
                  style={{ marginTop: '8px', padding: '6px 12px', borderRadius: '6px', border: '1px solid #16a34a', background: '#dcfce7', color: '#16a34a', cursor: 'pointer', fontSize: '12px', fontWeight: 600 }}>
                  ✅ Pagar todo
                </button>
              </div>
              <div style={{ marginBottom: '24px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#475569', display: 'block', marginBottom: '6px' }}>Nota (opcional)</label>
                <input value={formAbono.nota} onChange={e => setFormAbono({...formAbono, nota: e.target.value})}
                  placeholder="Ej: Pago parcial..."
                  style={{ width: '100%', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '14px', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => { setMostrarAbono(false); setFormAbono({ monto: '', nota: '' }) }}
                  style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
                  Cancelar
                </button>
                <button type="submit" className="btn-verde" style={{ flex: 2, padding: '12px' }}>
                  💰 Registrar Abono
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {toast && <Toast mensaje={toast.mensaje} tipo={toast.tipo} onCerrar={cerrar} />}
    </div>
  )
}