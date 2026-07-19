'use client'
import { useState, useEffect, useRef, useMemo } from 'react'
import Keyboard from 'react-simple-keyboard'

export default function TecladoVirtual({ inputActivo, onChange, onCerrar, tipo: tipoInicial, cambiarTipo, posY }) {
  const [layout, setLayout] = useState('default')
  const [mayus, setMayus] = useState(false)
  const [tema, setTema] = useState('claro')
  const containerRef = useRef(null)

  useEffect(() => {
    setTema(document.documentElement.getAttribute('data-theme') === 'oscuro' ? 'oscuro' : 'claro')
  }, [])

  useEffect(() => {
    setLayout(tipoInicial === 'numeros' ? 'num' : 'default')
  }, [tipoInicial])

  useEffect(() => {
    if (posY > 0) {
      const el = document.activeElement
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [posY])

  const layouts = useMemo(() => ({
    default: [
      'q w e r t y u i o p \u00f1',
      'a s d f g h j k l',
      '{shift} z x c v b n m , . {backspace}',
      '{numbers} {space} {symbols} {done}',
    ],
    shift: [
      'Q W E R T Y U I O P \u00d1',
      'A S D F G H J K L',
      '{shift} Z X C V B N M ; : {backspace}',
      '{numbers} {space} {symbols} {done}',
    ],
    num: [
      '1 2 3 4 5 6 7 8 9 0',
      '- / : ; ( ) @ & \u20a1 "',
      '{letters} . , ? ! \' % * + = {backspace}',
      '{space} {done}',
    ],
  }), [])

  const display = useMemo(() => ({
    '{shift}': mayus ? '\u21e9' : '\u21e7',
    '{backspace}': '\u232b',
    '{space}': 'Espacio',
    '{numbers}': '123',
    '{letters}': 'ABC',
    '{symbols}': '#+=',
    '{done}': 'Listo',
  }), [mayus])

  function onKeyPress(btn) {
    if (btn === '{shift}') {
      setMayus(!mayus)
      setLayout(layout === 'default' ? 'shift' : 'default')
    } else if (btn === '{numbers}' || btn === '{letters}') {
      const nuevo = btn === '{numbers}' ? 'num' : 'default'
      setLayout(nuevo)
      setMayus(false)
      cambiarTipo(nuevo === 'num' ? 'numeros' : 'letras')
    } else if (btn === '{symbols}') {
      setLayout('num')
      cambiarTipo('numeros')
    } else if (btn === '{space}') {
      onChange(inputActivo + ' ')
    } else if (btn === '{done}' || btn === '{enter}') {
      onCerrar()
    } else if (btn === '{backspace}') {
      onChange(inputActivo.slice(0, -1))
    } else {
      onChange(inputActivo + btn)
    }
  }

  const isDark = tema === 'oscuro'

  return (
    <div ref={containerRef}
      className="teclado-virtual-container"
      style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 9999,
        background: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(248,250,252,0.85)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderTop: `2px solid ${isDark ? '#334155' : '#cbd5e1'}`,
        boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      }}>
      <style>{`
        .teclado-virtual-container .hg-theme-default {
          font-family: inherit;
          background: transparent !important;
          border: none !important;
          padding: 4px 4px !important;
        }
        .teclado-virtual-container .hg-theme-default .hg-row {
          justify-content: center !important;
        }
        .teclado-virtual-container .hg-theme-default .hg-button {
          height: 42px !important;
          min-width: 30px !important;
          border-radius: 6px !important;
          font-size: 14px !important;
          font-weight: 600 !important;
          margin: 2px !important;
          border: 1px solid ${isDark ? '#475569' : '#cbd5e1'} !important;
          background: ${isDark ? 'rgba(51,65,85,0.9)' : 'rgba(255,255,255,0.9)'} !important;
          color: ${isDark ? '#e2e8f0' : '#1e293b'} !important;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1) !important;
          cursor: pointer !important;
          touch-action: manipulation !important;
          backdrop-filter: blur(4px);
          -webkit-backdrop-filter: blur(4px);
        }
        .teclado-virtual-container .hg-theme-default .hg-button:active {
          background: ${isDark ? 'rgba(71,85,105,0.9)' : 'rgba(226,232,240,0.9)'} !important;
          transform: scale(0.96) !important;
        }
        .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{done}"] {
          background: #16a34a !important;
          color: white !important;
          border-color: #16a34a !important;
          font-weight: 700 !important;
          min-width: 72px !important;
        }
        .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{backspace}"],
        .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{shift}"],
        .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{numbers}"],
        .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{letters}"],
        .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{symbols}"] {
          background: ${isDark ? 'rgba(71,85,105,0.9)' : 'rgba(226,232,240,0.9)'} !important;
          min-width: 46px !important;
        }
        .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{space}"] {
          min-width: 120px !important;
        }
        @media (max-width: 600px) {
          .teclado-virtual-container .hg-theme-default .hg-button {
            height: 36px !important;
            min-width: 24px !important;
            font-size: 11px !important;
            margin: 1.5px !important;
          }
          .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{backspace}"],
          .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{shift}"],
          .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{numbers}"],
          .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{letters}"],
          .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{symbols}"] {
            min-width: 36px !important;
          }
          .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{space}"] {
            min-width: 80px !important;
          }
          .teclado-virtual-container .hg-theme-default .hg-button[data-skbtn="{done}"] {
            min-width: 56px !important;
            font-size: 12px !important;
          }
        }
      `}</style>
      <Keyboard
        baseClass="hg-theme-default"
        layout={layouts}
        display={display}
        layoutName={layout}
        onKeyPress={onKeyPress}
        physicalKeyboardHighlight={false}
        preventMouseDownDefault={true}
        stopMouseDownPropagation={true}
        buttonAttributes={[{ attribute: 'data-tecla', value: 'true' }]}
      />
    </div>
  )
}
