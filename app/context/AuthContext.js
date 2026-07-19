'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const MODULOS = [
  { id: 'inicio', label: 'Inicio', path: '/', icono: 'Home' },
  { id: 'pos', label: 'POS', path: '/pos', icono: 'ShoppingCart' },
  { id: 'facturas', label: 'Facturas', path: '/facturas', icono: 'FileText' },
  { id: 'compras', label: 'Compras', path: '/compras', icono: 'Package' },
  { id: 'productos', label: 'Productos', path: '/productos', icono: 'Tags' },
  { id: 'clientes', label: 'Clientes', path: '/clientes', icono: 'Users' },
  { id: 'proveedores', label: 'Proveedores', path: '/proveedores', icono: 'Building2' },
  { id: 'inventario', label: 'Inventario', path: '/inventario', icono: 'ClipboardList' },
  { id: 'caja', label: 'Caja', path: '/caja', icono: 'DollarSign' },
  { id: 'cuentas-cobrar', label: 'CXC', path: '/cuentas-cobrar', icono: 'Wallet' },
  { id: 'deudas', label: 'CXP', path: '/deudas', icono: 'CreditCard' },
  { id: 'proformas', label: 'Proformas', path: '/proformas', icono: 'FileEdit' },
  { id: 'gastos', label: 'Gastos', path: '/gastos', icono: 'Wallet' },
  { id: 'reportes', label: 'Reportes', path: '/reportes', icono: 'BarChart3' },
  { id: 'configuracion', label: 'Configuración', path: '/configuracion', icono: 'Settings' },
  { id: 'usuarios', label: 'Usuarios', path: '/usuarios', icono: 'User' },
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

  async function login(username, password, recordar = true) {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password, recordar }),
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
