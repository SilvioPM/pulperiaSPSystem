'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const MODULOS = [
  { id: 'inicio', label: '\uD83C\uDFE0 Inicio', path: '/' },
  { id: 'pos', label: '\uD83D\uDED2 POS', path: '/pos' },
  { id: 'facturas', label: '\uD83E\uDDFE Facturas', path: '/facturas' },
  { id: 'compras', label: '\uD83D\uDCE6 Compras', path: '/compras' },
  { id: 'productos', label: '\uD83C\uDFF7\uFE0F Productos', path: '/productos' },
  { id: 'clientes', label: '\uD83D\uDC65 Clientes', path: '/clientes' },
  { id: 'proveedores', label: '\uD83C\uDFE2 Proveedores', path: '/proveedores' },
  { id: 'inventario', label: '\uD83D\uDCCB Inventario', path: '/inventario' },
  { id: 'caja', label: '\uD83D\uDCB5 Caja', path: '/caja' },
  { id: 'cuentas-cobrar', label: '\uD83D\uDCB0 CXC', path: '/cuentas-cobrar' },
  { id: 'deudas', label: '\uD83D\uDCB8 CXP', path: '/deudas' },
  { id: 'proformas', label: '\uD83D\uDCDD Proformas', path: '/proformas' },
  { id: 'reportes', label: '\uD83D\uDCCA Reportes', path: '/reportes' },
  { id: 'configuracion', label: '\u2699\uFE0F Configuración', path: '/configuracion' },
  { id: 'usuarios', label: '\uD83D\uDC64 Usuarios', path: '/usuarios' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)

  // Verificar sesión al cargar
  useEffect(() => {
    async function verificar() {
      try {
        const res = await fetch('/api/auth/me')
        if (res.ok) {
          const data = await res.json()
          if (data.autenticado) {
            setUser(data)
          }
        }
      } catch {
        // Sin sesión
      }
      setCargando(false)
    }
    verificar()
  }, [])

  // Auto-logout por inactividad (30 min)
  useEffect(() => {
    if (!user) return
    let timer
    function reiniciarTimer() {
      clearTimeout(timer)
      timer = setTimeout(() => {
        logout()
        window.location.href = '/login'
      }, 30 * 60 * 1000)
    }
    const eventos = ['mousedown', 'keydown', 'touchstart', 'scroll']
    eventos.forEach(e => window.addEventListener(e, reiniciarTimer))
    reiniciarTimer()
    return () => {
      clearTimeout(timer)
      eventos.forEach(e => window.removeEventListener(e, reiniciarTimer))
    }
  }, [user])

  async function login(username, password) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Error al iniciar sesión')
    setUser({ ...data, autenticado: true })
    return data
  }

  async function logout() {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
    } catch {
      // Ignorar error en logout
    }
    setUser(null)
  }

  function tieneAcceso(moduloId) {
    if (!user) return false
    if (user.esAdmin) return true
    return (user.modulos || []).includes(moduloId)
  }

  function puedeEditar(moduloId) {
    if (!user) return false
    if (user.esAdmin) return true
    if (user.rol === 'supervisor' || user.rol === 'encargado') return true
    return false
  }

  function modulosPermitidos() {
    if (!user) return []
    if (user.esAdmin) return MODULOS
    return MODULOS.filter(m => user.modulos?.includes(m.id))
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, tieneAcceso, puedeEditar, modulosPermitidos, cargando, MODULOS }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
