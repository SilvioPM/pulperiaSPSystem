'use client'
import Link from 'next/link'
import { ShoppingCart, FileText, UserPlus, Wallet, Receipt } from 'lucide-react'

const links = [
  { href: '/pos', label: 'Nueva Venta', desc: 'Cobrar productos en POS', icon: ShoppingCart, gradient: 'linear-gradient(135deg, #16a34a, #15803d)', shadow: 'rgba(22,163,74,0.3)' },
  { href: '/facturas?nueva=1', label: 'Nueva Factura', desc: 'Facturación directa', icon: FileText, gradient: 'linear-gradient(135deg, #2563eb, #1d4ed8)', shadow: 'rgba(37,99,235,0.3)' },
  { href: '/clientes?nuevo=1', label: 'Nuevo Cliente', desc: 'Registrar cliente', icon: UserPlus, gradient: 'linear-gradient(135deg, #7c3aed, #6d28d9)', shadow: 'rgba(124,58,237,0.3)' },
  { href: '/caja', label: 'Ver Caja', desc: 'Abrir / cerrar / revisar', icon: Wallet, gradient: 'linear-gradient(135deg, #d97706, #b45309)', shadow: 'rgba(217,119,6,0.3)' },
  { href: '/gastos?nuevo=1', label: 'Nuevo Gasto', desc: 'Registrar gasto', icon: Receipt, gradient: 'linear-gradient(135deg, #dc2626, #b91c1c)', shadow: 'rgba(220,38,38,0.3)' },
]

export default function AccesosRapidos() {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 32 }}>
      {links.map(l => {
        const Icon = l.icon
        return (
          <Link key={l.href} href={l.href} style={{
            borderRadius: 14, padding: 20, textDecoration: 'none',
            background: l.gradient, color: 'white',
            display: 'flex', alignItems: 'center', gap: 14,
            transition: 'transform 0.25s, box-shadow 0.25s',
            boxShadow: `0 4px 16px ${l.shadow}`,
            minHeight: 72,
          }}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${l.shadow}` }}
            onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = `0 4px 16px ${l.shadow}` }}>
            <Icon size={32} opacity={0.9} />
            <div>
              <div style={{ fontSize: 15, fontWeight: 700 }}>{l.label}</div>
              <div style={{ fontSize: 12, opacity: 0.8, marginTop: 1 }}>{l.desc}</div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}
