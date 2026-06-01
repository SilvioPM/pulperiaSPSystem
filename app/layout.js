import './globals.css'
import { AuthProvider } from './context/AuthContext'
import AppShell from './components/AppShell'

export const metadata = {
  title: 'Pulpería System',
  description: 'Sistema de facturación para pulpería',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
