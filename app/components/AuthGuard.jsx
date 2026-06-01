'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

const RUTAS_PUBLICAS = ['/login']
const MODULO_POR_RUTA = {
  '/': 'inicio',
  '/facturas': 'facturas',
  '/compras': 'compras',
  '/productos': 'productos',
  '/clientes': 'clientes',
  '/proveedores': 'proveedores',
  '/inventario': 'inventario',
  '/cuentas-cobrar': 'cuentas-cobrar',
  '/deudas': 'deudas',
  '/proformas': 'proformas',
  '/reportes': 'reportes',
  '/configuracion': 'configuracion',
  '/usuarios': 'usuarios',
}

export default function AuthGuard({ children }) {
  const { user, cargando, tieneAcceso } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (cargando) return
    if (!user && !RUTAS_PUBLICAS.includes(pathname)) {
      router.push('/login')
      return
    }
    if (user && pathname === '/login') {
      router.push('/')
      return
    }
    const modulo = MODULO_POR_RUTA[pathname]
    if (modulo && !tieneAcceso(modulo)) {
      router.push('/')
    }
  }, [cargando, user, pathname, router, tieneAcceso])

  if (cargando) {
    return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', color:'#666' }}>Cargando...</div>
  }

  if (!user && !RUTAS_PUBLICAS.includes(pathname)) return null
  if (pathname === '/login') return children

  return children
}
