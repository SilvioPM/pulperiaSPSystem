import { useState } from 'react'

export function useToast() {
  const [toast, setToast] = useState(null)

  function mostrar(mensaje, tipo = 'exito') {
    setToast({ mensaje, tipo })
  }

  function cerrar() {
    setToast(null)
  }

  return { toast, mostrar, cerrar }
}