'use client'
import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext()

const MODULOS = [
  { id: 'inicio', label: '🏪 Inicio', path: '/' },
  { id: 'facturas', label: '🧾 Facturas', path: '/facturas' },
  { id: 'compras', label: '📦 Compras', path: '/compras' },
  { id: 'productos', label: '🏷️ Productos', path: '/productos' },
  { id: 'clientes', label: '👥 Clientes', path: '/clientes' },
  { id: 'proveedores', label: '🏢 Proveedores', path: '/proveedores' },
  { id: 'inventario', label: '📋 Inventario', path: '/inventario' },
  { id: 'cuentas-cobrar', label: '💰 CXC', path: '/cuentas-cobrar' },
  { id: 'deudas', label: '💸 CXP', path: '/deudas' },
  { id: 'proformas', label: '📝 Proformas', path: '/proformas' },
  { id: 'reportes', label: '📊 Reportes', path: '/reportes' },
  { id: 'configuracion', label: '⚙️ Configuración', path: '/configuracion' },
  { id: 'usuarios', label: '👤 Usuarios', path: '/usuarios' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [cargando, setCargando] = useState(true)

  useEffect(() => {
    const saved = localStorage.getItem('pulperia_user')
    if (saved) {
      try { setUser(JSON.parse(saved)) } catch {}
    }
    setCargando(false)
  }, [])

  function login(userData) {
    localStorage.setItem('pulperia_user', JSON.stringify(userData))
    setUser(userData)
  }

  function logout() {
    localStorage.removeItem('pulperia_user')
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
