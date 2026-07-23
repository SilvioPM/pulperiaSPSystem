import { useState, useCallback } from 'react'

export function useToast() {
  const [toasts, setToasts] = useState([])

  const mostrar = useCallback((mensaje, tipo = 'exito') => {
    setToasts(prev => [...prev, { id: Date.now() + Math.random(), mensaje, tipo }])
  }, [])

  const cerrar = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = toasts.length > 0 ? toasts[0] : null
  const onCerrar = toast ? () => cerrar(toast.id) : () => {}

  return { toast, mostrar, cerrar: () => { if (toast) cerrar(toast.id) } }
}
