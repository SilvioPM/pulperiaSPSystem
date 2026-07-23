'use client'
import { useAuth } from '@/app/context/AuthContext'
import { TecladoVirtualProvider } from '@/app/context/TecladoVirtualContext'
import { usePathname } from 'next/navigation'
import AuthGuard from './AuthGuard'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import LicenseGuard from './LicenseGuard'

export default function AppShell({ children }) {
  const { user } = useAuth()
  const pathname = usePathname()
  const esPos = pathname?.startsWith('/pos')

  return (
    <AuthGuard>
      <TecladoVirtualProvider>
        {user ? (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main id="main-content-area" className="compact-main" style={{
              flex: 1,
              padding: esPos ? '0' : '24px',
              overflow: esPos ? 'hidden' : 'auto',
              paddingBottom: esPos ? '0' : '80px',
              position: 'relative',
              height: esPos ? '100vh' : 'auto',
            }}>
              <LicenseGuard>
                {children}
              </LicenseGuard>
            </main>
            <MobileNav />
          </div>
        ) : (
          children
        )}
      </TecladoVirtualProvider>
    </AuthGuard>
  )
}
