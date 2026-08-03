'use client'

import { useEffect, useState } from 'react'

export default function GlobalError({ error, reset }) {
  const [contador, setContador] = useState(5)
  const [recargando, setRecargando] = useState(false)

  useEffect(() => {
    if ('caches' in window) {
      caches.keys().then(keys => Promise.all(keys.map(k => caches.delete(k)))).catch(() => {})
    }
    const t = setInterval(() => setContador(c => {
      if (c <= 1) { clearInterval(t); return 0 }
      return c - 1
    }), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (contador === 0 && !recargando) {
      setRecargando(true)
      window.location.reload()
    }
  }, [contador, recargando])

  return (
    <html lang="es">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#0f172a', color: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
        <div style={{ textAlign: 'center', padding: '24px', maxWidth: '420px' }}>
          <div style={{ fontSize: '40px', marginBottom: '12px' }}>🔄</div>
          <div style={{ fontSize: '18px', fontWeight: 700, marginBottom: '8px' }}>Cargando de nuevo...</div>
          <div style={{ fontSize: '13px', color: '#94a3b8', marginBottom: '16px' }}>
            Ocurrió un error al cargar la aplicación. Se limpió el caché y la página se recargará automáticamente.
          </div>
          <button onClick={() => { setRecargando(true); window.location.reload() }}
            style={{ padding: '10px 20px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: 700, cursor: 'pointer', fontSize: '14px' }}>
            Recargar ahora ({contador})
          </button>
        </div>
      </body>
    </html>
  )
}
