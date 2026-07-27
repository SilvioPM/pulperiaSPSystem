'use client'
import { useState, useEffect, useCallback, useRef } from 'react'

export default function TecladoVirtual({ inputRef, onChange, onCerrar, tipo: tipoInicial, cambiarTipo, posY, onHeightChange }) {
  const [mayus, setMayus] = useState(false)
  const [modo, setModo] = useState(tipoInicial === 'numeros' ? 'num' : 'letras')
  const [tema, setTema] = useState('claro')
  const [area, setArea] = useState({ left: 0, width: 0 })
  const [phone, setPhone] = useState(false)

  // Ref para tracking local del valor, evita depender del DOM (React 19 lo resetea)
  const ultimoValor = useRef('')

  useEffect(() => {
    setTema(document.documentElement.getAttribute('data-theme') === 'oscuro' ? 'oscuro' : 'claro')
    const mq = window.matchMedia('(max-width: 640px)')
    setPhone(mq.matches)
    const handler = e => setPhone(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const main = document.getElementById('main-content-area')
    function medir() {
      if (main) {
        const r = main.getBoundingClientRect()
        setArea({ left: r.left, width: r.width })
      } else {
        setArea({ left: 0, width: window.innerWidth })
      }
    }
    medir()
    if (main) {
      const ro = new ResizeObserver(medir)
      ro.observe(main)
      window.addEventListener('scroll', medir, { passive: true })
      return () => { ro.disconnect(); window.removeEventListener('scroll', medir) }
    }
    window.addEventListener('resize', medir)
    return () => window.removeEventListener('resize', medir)
  }, [])

  useEffect(() => {
    if (posY > 0) {
      const el = document.activeElement
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [posY])

  // Sincroniza ultimoValor cuando cambia el input enfocado
  useEffect(() => {
    const el = inputRef?.current
    if (el) {
      ultimoValor.current = el.value || ''
      const handler = () => { ultimoValor.current = el.value || '' }
      el.addEventListener('input', handler)
      return () => el.removeEventListener('input', handler)
    }
  }, [inputRef?.current])

  const bg = 'rgba(30,41,59,0.75)'
  const keyBg = 'rgba(51,65,85,0.80)'
  const keyBorder = '#475569'
  const accent = '#16a34a'

  const KH = phone ? 48 : 54
  const KS = phone ? 4 : 4
  const KF = phone ? 17 : 18
  const KWF = phone ? 13 : 14
  const KW_BASE = phone ? 42 : 52

  function pulsar(tecla) {
    if (!inputRef?.current) return
    if (!document.body.contains(inputRef.current)) { onCerrar(); return }
    const el = inputRef.current
    const cursor = el.selectionStart ?? ultimoValor.current.length
    const valor = ultimoValor.current
    if (tecla === '{backspace}') {
      if (cursor > 0) {
        ultimoValor.current = valor.slice(0, cursor - 1) + valor.slice(cursor)
        onChange(ultimoValor.current, cursor - 1)
      }
    } else if (tecla === '{space}') {
      ultimoValor.current = valor.slice(0, cursor) + ' ' + valor.slice(cursor)
      onChange(ultimoValor.current, cursor + 1)
    } else if (tecla === '{done}') {
      onCerrar()
    } else if (tecla === '{shift}') {
      setMayus(prev => !prev)
    } else if (tecla === '{letters}') {
      setModo('letras')
      setMayus(false)
      cambiarTipo('letras')
    } else if (tecla === '{numbers}' || tecla === '{symbols}') {
      setModo('num')
      cambiarTipo('numeros')
    } else {
      ultimoValor.current = valor.slice(0, cursor) + tecla + valor.slice(cursor)
      onChange(ultimoValor.current, cursor + 1)
    }
    // El input mantiene el foco porque onMouseDown previene el default
  }

  function k({ t, a, green, gray, wide }) {
    const w = wide || KW_BASE
    if (!t) return <div style={{ width: w, height: KH }} />
    const isGreen = green
    const isGray = gray
    const bgKey = isGreen ? accent : isGray ? '#475569' : keyBg
    const colorKey = isGreen ? '#fff' : '#f1f5f9'
    const sizeKey = a ? KWF : KF
    return (
      <button data-tecla="true"
        onMouseDown={e => e.preventDefault()}
        onClick={() => pulsar(a || t)}
        style={{
          width: w, height: KH, margin: KS, borderRadius: phone ? 8 : 10,
          border: 'none', background: bgKey, color: colorKey,
          fontSize: sizeKey, fontWeight: 700, cursor: 'pointer',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: isGreen ? `0 2px 8px ${accent}66` : '0 1px 3px rgba(0,0,0,0.1)',
          touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none',
          transition: 'all 0.1s', WebkitTapHighlightColor: 'transparent',
          backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)',
          whiteSpace: 'nowrap', padding: '0 4px',
        }}>
        {t}
      </button>
    )
  }

  const FILAS_LETRAS = [
    ['q', 'w', 'e', 'r', 't', 'y', 'u', 'i', 'o', 'p', 'ñ'],
    ['a', 's', 'd', 'f', 'g', 'h', 'j', 'k', 'l'],
    ['z', 'x', 'c', 'v', 'b', 'n', 'm', ',', '.'],
  ]
  const FILAS_LETRAS_SHIFT = FILAS_LETRAS.map(f => f.map(l => l.toUpperCase()))

  const TECLAS_NUMPAD = [
    ['7', '8', '9'],
    ['4', '5', '6'],
    ['1', '2', '3'],
    ['0', '.'],
  ]

  const NUM_SYMBOLS = [
    ['1','2','3','4','5','6','7','8','9','0'],
    ['-','/',':',';','(',')','@','&','₡','"'],
    ['.',',','?','!',"'",'%','*','+','='],
  ]

  const containerRef = useRef(null)

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(entries => {
      for (const entry of entries) {
        onHeightChange?.(entry.contentRect.height)
      }
    })
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [onHeightChange])

  return (
    <div ref={containerRef} className="teclado-virtual-container" style={{
      position: 'fixed', bottom: 0, left: area.left, width: area.width, zIndex: 9999,
      background: bg,
      backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      borderTop: `1px solid ${keyBorder}`,
      padding: phone ? '6px 4px 10px' : '8px 8px 12px',
      boxShadow: '0 -4px 24px rgba(0,0,0,0.1)',
    }}>
      {modo === 'letras' ? (
        <div style={{ display: 'flex', gap: phone ? 4 : 8, maxWidth: phone ? '100%' : 860, margin: '0 auto' }}>
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            {(mayus ? FILAS_LETRAS_SHIFT : FILAS_LETRAS).map((fila, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'center', width: '100%' }}>
                {i === 2 && k({ t: '⇧', a: '{shift}', gray: mayus })}
                {fila.map(t => k({ t }))}
                {i === 2 && k({ t: '⌫', a: '{backspace}', gray: true })}
              </div>
            ))}
            <div style={{ display: 'flex', marginTop: phone ? 0 : 4 }}>
              {k({ t: '123', a: '{numbers}', gray: true, wide: phone ? 60 : 72 })}
              {k({ t: 'Espacio', a: '{space}', wide: phone ? 140 : 200 })}
              {k({ t: 'Listo', a: '{done}', green: true, wide: phone ? 64 : 88 })}
            </div>
          </div>
          {!phone && (
            <div style={{
              display: 'flex', flexDirection: 'column', justifyContent: 'center',
              borderLeft: `1px solid ${keyBorder}`, paddingLeft: 6,
            }}>
              {TECLAS_NUMPAD.map((fila, i) => (
                <div key={i} style={{ display: 'flex' }}>
                  {fila.map(t => k({ t, wide: 56 }))}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: phone ? '100%' : 540, margin: '0 auto' }}>
          {NUM_SYMBOLS.map((fila, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'center', flexWrap: 'nowrap' }}>
              {fila.map(t => k({ t, wide: phone ? Math.min(42, (area.width - 20) / 10) : 48 }))}
            </div>
          ))}
          <div style={{ display: 'flex', marginTop: phone ? 2 : 4 }}>
            {k({ t: 'ABC', a: '{letters}', gray: true, wide: phone ? 64 : 80 })}
            {k({ t: '⌫', a: '{backspace}', gray: true, wide: phone ? 60 : 72 })}
            {k({ t: 'Espacio', a: '{space}', wide: phone ? 120 : 160 })}
            {k({ t: 'Listo', a: '{done}', green: true, wide: phone ? 64 : 80 })}
          </div>
        </div>
      )}
    </div>
  )
}