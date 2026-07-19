'use client'
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import TecladoVirtual from '@/app/components/TecladoVirtual'

const TecladoVirtualContext = createContext()

export function useTecladoVirtual() {
  return useContext(TecladoVirtualContext)
}

export function TecladoVirtualProvider({ children }) {
  const [visible, setVisible] = useState(false)
  const [inputActivo, setInputActivo] = useState('')
  const [tipo, setTipo] = useState('letras')
  const [ultimoTipo, setUltimoTipo] = useState('letras')
  const [posY, setPosY] = useState(0)
  const inputRef = useRef(null)
  const esTactilRef = useRef(false)

  useEffect(() => {
    esTactilRef.current = navigator.maxTouchPoints > 0
  }, [])

  const onChange = useCallback((valor) => {
    setInputActivo(valor)
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
      setInputActivo(el.value || '')
      inputRef.current = el
      setVisible(true)

      const rect = el.getBoundingClientRect()
      setPosY(rect.top + rect.height)

      el.setAttribute('inputmode', 'none')
      el.setAttribute('autocomplete', 'off')
    }

    function handleBlur(e) {
      const el = e.target
      const related = e.relatedTarget
      if (related && (related.closest('.teclado-virtual-container') || related.hasAttribute('data-tecla'))) return
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          setVisible(false)
          inputRef.current = null
        }
      }, 150)
    }

    document.addEventListener('focusin', handleFocus)
    document.addEventListener('focusout', handleBlur)
    return () => {
      document.removeEventListener('focusin', handleFocus)
      document.removeEventListener('focusout', handleBlur)
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
    <TecladoVirtualContext.Provider value={{ cerrar }}>
      {children}
      {visible && (
        <TecladoVirtual
          inputActivo={inputActivo}
          onChange={onChange}
          onCerrar={cerrar}
          tipo={tipo}
          cambiarTipo={cambiarTipo}
          posY={posY}
        />
      )}
    </TecladoVirtualContext.Provider>
  )
}
