import { obtenerEstadoLicencia } from '@/lib/licencia'
import { redirect } from 'next/navigation'

export default async function LicenseGate({ children }) {
  const estado = await obtenerEstadoLicencia()

  if (!estado.valida) {
    const motivo = estado.expiraEn && new Date(estado.expiraEn) < new Date() ? 'expirada' : 'invalida'
    redirect(`/licencia-bloqueada?motivo=${motivo}&dias=${estado.diasRestantes ?? 0}`)
  }

  return children
}