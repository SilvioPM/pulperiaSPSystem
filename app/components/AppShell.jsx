'use client'
import { useAuth } from '@/app/context/AuthContext'
import { TecladoVirtualProvider } from '@/app/context/TecladoVirtualContext'
import AuthGuard from './AuthGuard'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'
import LicenseGuard from './LicenseGuard'

export default function AppShell({ children }) {
  const { user } = useAuth()

  return (
    <AuthGuard>
      <TecladoVirtualProvider>
        {user ? (
          <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <main style={{ flex: 1, padding: '24px', overflowY: 'auto', paddingBottom: '80px' }}>
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
