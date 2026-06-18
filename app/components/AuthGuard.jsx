'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

const RUTAS_PUBLICAS = ['/login']
const MODULO_POR_RUTA = {
  '/': 'inicio',
  '/pos': 'pos',
  '/facturas': 'facturas',
  '/compras': 'compras',
  '/productos': 'productos',
  '/clientes': 'clientes',
  '/proveedores': 'proveedores',
  '/inventario': 'inventario',
  '/caja': 'caja',
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

  useEffect(() => { router.prefetch('/'); router.prefetch('/pos') }, [router])

  useEffect(() => {
    if (cargando) return
    if (!user && !RUTAS_PUBLICAS.includes(pathname)) {
      router.replace('/login')
      return
    }
    if (user && pathname === '/login') {
      router.replace(user.esAdmin ? '/' : '/pos')
      return
    }
    const modulo = MODULO_POR_RUTA[pathname]
    if (modulo && !tieneAcceso(modulo)) {
      router.replace('/')
    }
  }, [cargando, user, pathname, router, tieneAcceso])

  if (cargando) {
    return <div style={{ display:'flex', justifyContent:'center', alignItems:'center', minHeight:'100vh', color:'#666' }}>Cargando...</div>
  }

  if (!user && !RUTAS_PUBLICAS.includes(pathname)) return null
  if (pathname === '/login') return children

  return children
}
