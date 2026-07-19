import './globals.css'
import 'react-simple-keyboard/build/css/index.css'
import { AuthProvider } from './context/AuthContext'
import AppShell from './components/AppShell'

export const metadata = {
  title: 'SPSystem',
  description: 'Sistema de facturación',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
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
