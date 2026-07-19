'use client'
import { useRef, useEffect } from 'react'
import JsBarcode from 'jsbarcode'
import * as Icons from 'lucide-react'

export default function BarcodeLabel({ codigo, nombre, precio, tamano = 'medio' }) {
  const svgRef = useRef(null)

  useEffect(() => {
    if (svgRef.current && codigo) {
      try {
        JsBarcode(svgRef.current, codigo, {
          format: 'CODE128',
          width: tamano === 'grande' ? 2.5 : tamano === 'chico' ? 1.2 : 1.8,
          height: tamano === 'grande' ? 60 : tamano === 'chico' ? 30 : 45,
          displayValue: true,
          fontSize: tamano === 'chico' ? 10 : 13,
          margin: tamano === 'chico' ? 5 : 8,
          background: '#ffffff',
        })
      } catch {}
    }
  }, [codigo, tamano])

  if (!codigo) return null

  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <svg ref={svgRef} />
      {nombre && <span style={{ fontSize: 12, fontWeight: 600, color: '#1e293b', textAlign: 'center' }}>{nombre}</span>}
      {precio != null && <span style={{ fontSize: 14, fontWeight: 700, color: '#16a34a' }}>C$ {Number(precio).toFixed(2)}</span>}
    </div>
  )
}

export function PrintBarcodeLabel({ codigo, nombre, precio }) {
  const iframeRef = useRef(null)

  function imprimir() {
    if (!codigo) return
    const c = String(codigo)
    const n = nombre || ''
    const p = precio != null ? 'C$ ' + Number(precio).toFixed(2) : ''
    const svg = `<svg id="b"></svg>`
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Etiqueta</title>
<style>
* { margin:0; padding:0; box-sizing:border-box; }
@page { margin:3mm; size:90mm 55mm; }
body { font-family:Arial,sans-serif; text-align:center; padding:5mm; }
.c { border:1px dashed #ccc; padding:4mm; border-radius:4px; }
.n { font-size:13px; font-weight:700; color:#1e293b; margin-bottom:3px; }
.p { font-size:18px; font-weight:800; color:#16a34a; margin-top:3px; }
svg { max-width:100%; height:auto; }
</style></head><body>
<div class="c"><div class="n">${n}</div>${svg}<div class="p">${p}</div></div>
<script src="/jsbarcode.min.js"><\/script>
<script>
try { JsBarcode("#b", "${c}", {format:"CODE128",width:2.5,height:70,displayValue:true,fontSize:16,margin:10,background:"#fff"}); }
catch(e){document.body.innerHTML+='<div style=color:red>Error: '+e.message+'</div>';}
setTimeout(function(){ window.print(); window.close(); }, 200);
<\/script></body></html>`

    const w = window.open('', '_blank', 'width=400,height=300')
    if (!w) return
    w.document.write(html)
    w.document.close()
  }

  return (
    <button onClick={imprimir}
      style={{
        padding: '6px 12px', borderRadius: 6, border: '1px solid #e2e8f0',
        background: '#f8fafc', cursor: 'pointer', fontSize: 12, fontWeight: 600,
        display: 'inline-flex', alignItems: 'center', gap: 6, color: '#1e293b'
      }}>
      <Icons.Printer size={14} /> Imprimir etiqueta
    </button>
  )
}
