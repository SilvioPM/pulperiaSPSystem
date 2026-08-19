import LicenseGate from '../components/LicenseGate'

export const metadata = {
  title: 'SPSystem Móvil',
  manifest: '/manifest-movil.json',
}

export default function MovilLayout({ children }) {
  return <LicenseGate>{children}</LicenseGate>
}
