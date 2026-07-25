import './globals.css'
import { AuthProvider } from './context/AuthContext'
import AppShell from './components/AppShell'
import Script from 'next/script'

export const metadata = {
  title: 'SPSystem',
  description: 'Sistema de facturación',
  manifest: '/manifest.json',
  icons: {
    icon: '/icon.svg',
    apple: '/icon.svg',
  },
}

export const viewport = {
  themeColor: '#16a34a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <Script src="/sw-register.js" strategy="afterInteractive" />
        <AuthProvider>
          <AppShell>
            {children}
          </AppShell>
        </AuthProvider>
      </body>
    </html>
  )
}
