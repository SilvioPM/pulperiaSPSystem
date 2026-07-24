'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import TecladoVirtual from '@/app/components/TecladoVirtual'

const TecladoVirtualContext = createContext()

export function useTecladoVirtual() {
  return useContext(TecladoVirtualContext)
}

export function TecladoVirtualProvider({ children }) {
  const [visible, setVisible] = useState(false)
  const [keyboardHeight, setKeyboardHeight] = useState(0)
  const [tipo, setTipo] = useState('letras')
  const [ultimoTipo, setUltimoTipo] = useState('letras')
  const [posY, setPosY] = useState(0)
  const posYRef = useRef(0)
  const inputRef = useRef(null)
  const esTactilRef = useRef(false)

  useEffect(() => {
    esTactilRef.current = navigator.maxTouchPoints > 0
  }, [])

  const onChange = useCallback((valor) => {
    if (inputRef.current) {
      const tag = inputRef.current.tagName?.toLowerCase()
      const proto = tag === 'textarea' ? window.HTMLTextAreaElement.prototype : window.HTMLInputElement.prototype
      const nativeSetter = Object.getOwnPropertyDescriptor(proto, 'value').set
      nativeSetter.call(inputRef.current, valor)
      inputRef.current.dispatchEvent(new Event('input', { bubbles: true }))
    }
  }, [])

  useEffect(() => {
    if (!esTactilRef.current) return

    function handleFocus(e) {
      const el = e.target
      const tag = el.tagName?.toLowerCase()
      const type = (el.type || '').toLowerCase()

      if (el.hasAttribute('data-no-teclado-virtual')) return
      if (el.closest('[data-no-teclado-virtual]')) return
      if (el.hasAttribute('data-teclado-numerico')) return
      if (el.closest('[data-teclado-numerico]')) return

      const esTexto = (tag === 'input' && (type === 'text' || type === 'tel' || type === 'email' || type === 'url' || type === 'search' || type === 'password')) ||
                      tag === 'textarea'

      const esNumero = tag === 'input' && (type === 'number' || type === 'tel')

      if (!esTexto && !esNumero) return

      const nuevoTipo = esNumero ? 'numeros' : ultimoTipo || 'letras'
      setTipo(nuevoTipo)
      setUltimoTipo(nuevoTipo)
      inputRef.current = el
      setVisible(true)

      const rect = el.getBoundingClientRect()
      const newPosY = rect.top + rect.height
      if (newPosY !== posYRef.current) {
        posYRef.current = newPosY
        setPosY(newPosY)
      }

      el.setAttribute('inputmode', 'none')
      el.setAttribute('autocomplete', 'off')
    }

    function handleBlur(e) {
      const el = e.target
      const related = e.relatedTarget
      if (related && (related.closest('.teclado-virtual-container') || related.hasAttribute('data-tecla'))) return
      setTimeout(() => {
        if (inputRef.current && document.body.contains(inputRef.current) && (document.activeElement === inputRef.current || document.activeElement?.closest?.('.teclado-virtual-container'))) return
        if (!document.activeElement || document.activeElement === document.body || !document.body.contains(inputRef.current)) {
          setVisible(false)
          inputRef.current = null
        }
      }, 150)
    }

    function handleVisibility() { if (document.hidden) { setVisible(false); inputRef.current = null } }

    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)
    document.addEventListener('visibilitychange', handleVisibility)
    return () => {
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [ultimoTipo])

  function cerrar() {
    setVisible(false)
    if (inputRef.current) {
      inputRef.current.removeAttribute('inputmode')
      inputRef.current.blur()
      inputRef.current = null
    }
  }

  function cambiarTipo(nuevo) {
    setTipo(nuevo)
    setUltimoTipo(nuevo)
  }

  return (
    <TecladoVirtualContext.Provider value={{ cerrar, visible, keyboardHeight }}>
      {children}
      {visible && (
        <TecladoVirtual
          inputRef={inputRef}
          onChange={onChange}
          onCerrar={cerrar}
          tipo={tipo}
          cambiarTipo={cambiarTipo}
          posY={posY}
          onHeightChange={setKeyboardHeight}
        />
      )}
    </TecladoVirtualContext.Provider>
  )
}
