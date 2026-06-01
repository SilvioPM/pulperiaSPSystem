'use client'
import { useAuth } from '@/app/context/AuthContext'
import AuthGuard from './AuthGuard'
import Sidebar from './Sidebar'
import MobileNav from './MobileNav'

export default function AppShell({ children }) {
  const { user } = useAuth()

  return (
    <AuthGuard>
      {user ? (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '24px', overflowY: 'auto', paddingBottom: '80px' }}>
            {children}
          </main>
          <MobileNav />
        </div>
      ) : (
        children
      )}
    </AuthGuard>
  )
}
