import './globals.css'
import Sidebar from './components/Sidebar'

export const metadata = {
  title: 'Pulpería System',
  description: 'Sistema de facturación para pulpería',
}

export default function RootLayout({ children }) {
  return (
    <html lang="es">
      <body>
        <div style={{ display: 'flex', minHeight: '100vh' }}>
          <Sidebar />
          <main style={{ flex: 1, padding: '24px', overflowY: 'auto' }}>
            {children}
          </main>
        </div>
      </body>
    </html>
  )
}