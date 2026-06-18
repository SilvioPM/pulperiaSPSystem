export async function auditar(usuario, accion, entidad, detalle) {
  try {
    await fetch('/api/auditoria', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ usuario, accion, entidad, detalle })
    })
  } catch (e) {
    console.error('Error al registrar auditoría:', e)
  }
}