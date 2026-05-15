import { useState } from 'react'

export function useConfirm() {
  const [confirm, setConfirm] = useState(null)

  function mostrarConfirm(mensaje, onConfirmar, tipo = 'alerta') {
    setConfirm({ mensaje, onConfirmar, tipo })
  }

  function cerrarConfirm() {
    setConfirm(null)
  }

  return { confirm, mostrarConfirm, cerrarConfirm }
}
