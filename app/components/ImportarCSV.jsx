'use client'
import { useState, useRef } from 'react'
import * as XLSX from 'xlsx'
import * as Icons from 'lucide-react'

export default function ImportarCSV({ onCerrar, onImportados, endpoint, columnas, titulo }) {
  const [archivo, setArchivo] = useState(null)
  const [importando, setImportando] = useState(false)
  const [resultado, setResultado] = useState(null)
  const fileRef = useRef(null)

  function descargarPlantilla() {
    const ws = XLSX.utils.aoa_to_sheet([
      columnas.map(c => c.label),
      columnas.map(c => {
        if (c.clave === 'nombre') return 'Ejemplo'
        if (c.clave === 'saldoInicial' || c.clave === 'saldoInicialCxp') return 150.50
        if (c.clave === 'limiteCredito') return 500
        return ''
      })
    ])

    ws['!cols'] = columnas.map(c => {
      let wch = Math.max(c.label.length * 2, 14)
      if (c.clave === 'saldoInicial' || c.clave === 'saldoInicialCxp' || c.clave === 'limiteCredito') wch = 18
      return { wch }
    })

    const range = XLSX.utils.decode_range(ws['!ref'])
    for (let C = range.s.c; C <= range.e.c; C++) {
      const addr = XLSX.utils.encode_cell({ r: 0, c: C })
      if (!ws[addr]) continue
      ws[addr].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '2563EB' } },
        alignment: { horizontal: 'center' }
      }
      const dataAddr = XLSX.utils.encode_cell({ r: 1, c: C })
      if (ws[dataAddr] && typeof ws[dataAddr].v === 'number') {
        ws[dataAddr].s = { numFmt: '#,##0.00' }
      }
    }

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, 'Plantilla')
    XLSX.writeFile(wb, 'plantilla_importar.xlsx')
  }

  function handleFile(e) {
    const file = e.target.files[0]
    if (!file) return
    setArchivo(file)
    setResultado(null)
  }

  function normHeader(h) {
    return h.replace(/\s*\*$/, '').replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '').trim().toLowerCase()
  }

  async function importar() {
    if (!archivo) return
    setImportando(true)
    try {
      let datos = []
      const ext = archivo.name.split('.').pop().toLowerCase()

      if (ext === 'xlsx') {
        const buf = await archivo.arrayBuffer()
        const wb = XLSX.read(buf, { type: 'array' })
        const ws = wb.Sheets[wb.SheetNames[0]]
        const aoa = XLSX.utils.sheet_to_json(ws, { header: 1, defval: '' })
        if (aoa.length < 2) { setResultado({ error: 'El archivo está vacío o solo tiene encabezados' }); return }
        const encabezados = aoa[0].map(h => normHeader(String(h)))
        for (let i = 1; i < aoa.length; i++) {
          const vals = aoa[i]
          if (vals.length === 0 || vals.every(v => !String(v).trim())) continue
          const obj = {}
          encabezados.forEach((h, idx) => { obj[h] = String(vals[idx] || '').trim() })
          datos.push(obj)
        }
      } else {
        const texto = await archivo.text()
        const lineas = texto.split(/\r?\n/).filter(Boolean)
        if (lineas.length < 2) { setResultado({ error: 'El archivo está vacío o solo tiene encabezados' }); return }

        const encabezados = parseLinea(lineas[0]).map(h => normHeader(h))
        for (let i = 1; i < lineas.length; i++) {
          const vals = parseLinea(lineas[i])
          if (vals.length === 0 || vals.every(v => !v.trim())) continue
          const obj = {}
          encabezados.forEach((h, idx) => { obj[h] = (vals[idx] || '').trim() })
          datos.push(obj)
        }
      }

      const lookup = {}
      columnas.forEach(c => {
        const normalizado = normHeader(c.label)
        lookup[normalizado] = c.clave
        lookup[c.clave] = c.clave
      })

      const mapeados = datos.map(d => {
        const obj = {}
        for (const headerKey of Object.keys(d)) {
          const clave = lookup[headerKey.toLowerCase()]
          if (clave) {
            const val = d[headerKey]
            obj[clave] = val !== undefined && val !== null && val !== '' ? String(val).trim() : ''
          }
        }
        if (!obj.nombre) {
          for (const k of Object.keys(d)) {
            if (k === 'nombre' || d.nombre) { obj.nombre = d.nombre; break }
          }
          if (!obj.nombre) obj.nombre = Object.values(d).find(v => v) || ''
        }
        return obj
      })

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(endpoint.includes('clientes') ? { clientes: mapeados } : { proveedores: mapeados })
      })

      const resJson = await res.json()
      setResultado(resJson)
      if (resJson.creados > 0 || resJson.actualizados > 0) {
        setTimeout(() => { onImportados && onImportados() }, 1500)
      }
    } catch (e) {
      setResultado({ error: e.message })
    } finally {
      setImportando(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 60 }}>
      <div className="card" style={{ width: '540px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 700 }}>{titulo || 'Importar desde CSV'}</h2>
          <button onClick={onCerrar} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: '#94a3b8' }}>✕</button>
        </div>

        <div style={{ marginBottom: '20px', padding: '14px', borderRadius: '8px', background: '#fef9c3', border: '1px solid #eab308', fontSize: '13px', color: '#854d0e' }}>
          <strong>Instrucciones:</strong>
          <ol style={{ margin: '8px 0 0 16px', padding: 0 }}>
            <li>Descargá la plantilla con el botón de abajo</li>
            <li>Llenala con tus datos (una fila por cliente/proveedor)</li>
            <li>Seleccioná el archivo y dale click a Importar</li>
            <li>Los que ya existen se actualizarán automáticamente</li>
          </ol>
        </div>

        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <button onClick={descargarPlantilla}
            style={{
              padding: '10px 24px', borderRadius: '8px', border: '2px dashed #3b82f6',
              background: '#eff6ff', cursor: 'pointer', fontSize: '14px', fontWeight: 600, color: '#2563eb'
            }}>
            <Icons.Download size={16} /> Descargar plantilla CSV
          </button>
        </div>

        {!resultado && (
          <>
            <div style={{
              border: '2px dashed #cbd5e1', borderRadius: '10px', padding: '30px',
              textAlign: 'center', cursor: 'pointer', background: archivo ? '#f0fdf4' : '#fafafa',
              borderColor: archivo ? '#16a34a' : '#cbd5e1', marginBottom: '20px'
            }} onClick={() => fileRef.current?.click()}>
              <input ref={fileRef} type="file" accept=".csv,.xlsx" onChange={handleFile} style={{ display: 'none' }} />
              <div style={{ fontSize: '40px', marginBottom: '8px' }}>{archivo ? <Icons.CheckCircle size={16} /> : <Icons.FileText size={16} />}</div>
              <div style={{ fontWeight: 600, fontSize: '14px', color: archivo ? '#16a34a' : '#475569' }}>
                {archivo ? archivo.name : 'Hacé click para seleccionar archivo CSV'}
              </div>
              {archivo && <div style={{ fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>{(archivo.size / 1024).toFixed(1)} KB</div>}
            </div>

            <button onClick={importar} disabled={!archivo || importando}
              className="btn-verde"
              style={{ width: '100%', padding: '12px', opacity: !archivo || importando ? 0.5 : 1, cursor: !archivo || importando ? 'not-allowed' : 'pointer' }}>
              {importando ? <><Icons.Loader size={16} /> Importando...</> : <><Icons.Rocket size={16} /> Importar</>}
            </button>
          </>
        )}

        {resultado && (
          <div>
            {resultado.error ? (
              <div style={{ padding: '16px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', color: '#b91c1c', marginBottom: '16px' }}>
                <Icons.XCircle size={16} /> {resultado.error}
              </div>
            ) : (
              <div style={{ marginBottom: '16px' }}>
                <div style={{ padding: '16px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #86efac', marginBottom: '12px' }}>
                  <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', flexWrap: 'wrap' }}>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: '#16a34a' }}>{resultado.creados}</div>
                      <div style={{ fontSize: '12px', color: '#15803d' }}>Creados</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: '#2563eb' }}>{resultado.actualizados}</div>
                      <div style={{ fontSize: '12px', color: '#1d4ed8' }}>Actualizados</div>
                    </div>
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ fontSize: '28px', fontWeight: 700, color: '#64748b' }}>{resultado.total}</div>
                      <div style={{ fontSize: '12px', color: '#475569' }}>Totales</div>
                    </div>
                  </div>
                </div>
                {resultado.errores?.length > 0 && (
                  <div style={{ padding: '12px', borderRadius: '8px', background: '#fef2f2', border: '1px solid #fca5a5', fontSize: '13px', color: '#b91c1c', marginBottom: '12px' }}>
                    <strong>Errores ({resultado.errores.length}):</strong>
                    {resultado.errores.map((e, i) => <div key={i}>• {e.error}</div>)}
                  </div>
                )}
              </div>
            )}
            <button onClick={() => { setArchivo(null); setResultado(null); if (fileRef.current) fileRef.current.value = '' }}
              style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #e2e8f0', background: 'white', cursor: 'pointer', fontWeight: 600 }}>
              Importar otro archivo
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

function parseLinea(linea) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < linea.length; i++) {
    const ch = linea[i]
    if (ch === '"') {
      if (inQuotes && i + 1 < linea.length && linea[i + 1] === '"') {
        current += '"'; i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (ch === ',' && !inQuotes) {
      result.push(current); current = ''
    } else {
      current += ch
    }
  }
  result.push(current)
  return result
}
