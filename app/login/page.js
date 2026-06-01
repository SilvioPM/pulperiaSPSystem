'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/app/context/AuthContext'

export default function LoginPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [cargando, setCargando] = useState(false)
  const { login } = useAuth()
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setCargando(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error); return }
      login(data)
      router.push('/')
    } catch {
      setError('Error de conexión')
    } finally {
      setCargando(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)',
      position: 'relative', overflow: 'hidden'
    }}>
      {/* Círculos decorativos de fondo */}
      <div style={{
        position: 'absolute', width: '400px', height: '400px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(22,163,74,0.08) 0%, transparent 70%)',
        top: '-100px', right: '-100px'
      }} />
      <div style={{
        position: 'absolute', width: '300px', height: '300px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(37,99,235,0.06) 0%, transparent 70%)',
        bottom: '-80px', left: '-80px'
      }} />
      <div style={{
        position: 'absolute', width: '200px', height: '200px', borderRadius: '50%',
        background: 'radial-gradient(circle, rgba(124,58,237,0.05) 0%, transparent 70%)',
        top: '40%', right: '15%'
      }} />

      <form onSubmit={handleSubmit} style={{
        background: 'rgba(30,41,59,0.95)', padding: '48px 40px 40px',
        borderRadius: '20px', width: '380px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        position: 'relative', backdropFilter: 'blur(10px)'
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{
            width: '80px', height: '80px', borderRadius: '20px',
            background: 'linear-gradient(135deg, #16a34a 0%, #15803d 50%, #166534 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 18px',
            boxShadow: '0 8px 32px rgba(22,163,74,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            position: 'relative'
          }}>
            {/* Brillo superior */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: '40%',
              background: 'linear-gradient(180deg, rgba(255,255,255,0.15) 0%, transparent 100%)',
              borderRadius: '20px 20px 0 0'
            }} />
            <svg width="38" height="38" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ position: 'relative', zIndex: 1 }}>
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
              <line x1="12" y1="10" x2="12" y2="6" />
              <line x1="9" y1="14" x2="15" y2="14" />
            </svg>
          </div>
          <div style={{
            fontSize: '28px', fontWeight: 800, color: '#fff',
            letterSpacing: '-1px', lineHeight: 1
          }}>
            SP<span style={{ color: '#16a34a', fontWeight: 800 }}>System</span>
          </div>
          <div style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            marginTop: '8px'
          }}>
            <span style={{ width: '20px', height: '2px', borderRadius: '2px', background: 'linear-gradient(90deg, transparent, #16a34a)' }} />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: 500, letterSpacing: '2px', textTransform: 'uppercase' }}>
              Pulpería POS
            </span>
            <span style={{ width: '20px', height: '2px', borderRadius: '2px', background: 'linear-gradient(90deg, #16a34a, transparent)' }} />
          </div>
        </div>

        {error && (
          <div style={{
            padding: '10px 14px', borderRadius: '10px', background: 'rgba(220,38,38,0.1)',
            border: '1px solid rgba(220,38,38,0.2)', color: '#fca5a5',
            fontSize: '13px', marginBottom: '20px', textAlign: 'center'
          }}>
            {error}
          </div>
        )}

        <div style={{ marginBottom: '18px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, letterSpacing: '0.3px' }}>
            USUARIO
          </label>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <input value={username} onChange={e => setUsername(e.target.value)} required
              placeholder="Ingresá tu usuario"
              style={{
                width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.6)',
                color: '#e2e8f0', fontSize: '14px', outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.background = 'rgba(15,23,42,0.8)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(15,23,42,0.6)' }} />
          </div>
        </div>

        <div style={{ marginBottom: '28px' }}>
          <label style={{ display: 'block', marginBottom: '6px', color: '#94a3b8', fontSize: '13px', fontWeight: 600, letterSpacing: '0.3px' }}>
            CONTRASEÑA
          </label>
          <div style={{ position: 'relative' }}>
            <svg style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#475569' }} width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0110 0v4" />
            </svg>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required
              placeholder="Ingresá tu contraseña"
              style={{
                width: '100%', padding: '12px 12px 12px 40px', borderRadius: '10px',
                border: '1px solid rgba(255,255,255,0.08)', background: 'rgba(15,23,42,0.6)',
                color: '#e2e8f0', fontSize: '14px', outline: 'none',
                transition: 'all 0.2s'
              }}
              onFocus={e => { e.target.style.borderColor = '#16a34a'; e.target.style.background = 'rgba(15,23,42,0.8)' }}
              onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.08)'; e.target.style.background = 'rgba(15,23,42,0.6)' }} />
          </div>
        </div>

        <button type="submit" disabled={cargando}
          style={{
            width: '100%', padding: '14px', borderRadius: '10px', border: 'none',
            background: cargando ? 'rgba(22,163,74,0.5)' : 'linear-gradient(135deg, #16a34a, #15803d)',
            color: '#fff', fontSize: '15px', fontWeight: 700, cursor: cargando ? 'not-allowed' : 'pointer',
            transition: 'all 0.2s', letterSpacing: '0.5px',
            boxShadow: cargando ? 'none' : '0 4px 16px rgba(22,163,74,0.3)'
          }}>
          {cargando ? 'ENTRANDO...' : 'INICIAR SESIÓN'}
        </button>

        <div style={{ textAlign: 'center', marginTop: '24px', fontSize: '11px', color: '#475569', letterSpacing: '0.5px' }}>
          SP System v1.0 · © {new Date().getFullYear()}
        </div>
      </form>
    </div>
  )
}
