'use client'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function TarjetaAcceso({ href, icon: Icon, label, desc, gradient, shadow }) {
  return (
    <Link href={href} style={{
      borderRadius: 14, padding: 20, textDecoration: 'none',
      background: gradient || 'linear-gradient(135deg, #16a34a, #15803d)',
      color: 'white', display: 'flex', alignItems: 'center', gap: 14,
      transition: 'transform 0.25s, box-shadow 0.25s',
      boxShadow: shadow || '0 4px 16px rgba(22,163,74,0.3)',
      minHeight: 72, position: 'relative',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 10px 28px ${shadow || 'rgba(22,163,74,0.3)'}` }}
      onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = shadow || '0 4px 16px rgba(22,163,74,0.3)' }}>
      {Icon && <Icon size={32} opacity={0.9} />}
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 700 }}>{label}</div>
        {desc && <div style={{ fontSize: 12, opacity: 0.8, marginTop: 1 }}>{desc}</div>}
      </div>
      <ArrowRight size={20} opacity={0.6} style={{ flexShrink: 0 }} />
    </Link>
  )
}
