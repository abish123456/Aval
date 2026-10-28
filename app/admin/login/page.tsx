'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (!email || !password) {
      setError('Please enter both email and password.')
      return
    }
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.push('/admin')
    }, 800)
  }

  function handleDemoLogin() {
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      router.push('/admin')
    }, 600)
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, var(--dk, #3A1520) 0%, #5a2030 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 16px',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '420px',
          background: '#fff',
          borderRadius: '16px',
          boxShadow: '0 24px 60px rgba(58,21,32,0.3)',
          overflow: 'hidden',
        }}
      >
        {/* Card Header */}
        <div
          style={{
            background: 'var(--dk, #3A1520)',
            padding: '32px 36px 28px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '32px',
              fontWeight: 700,
              letterSpacing: '0.15em',
              color: 'var(--bl, #EBD3CF)',
            }}
          >
            AVAL
          </div>
          <div
            style={{
              fontSize: '10px',
              letterSpacing: '0.25em',
              textTransform: 'uppercase',
              color: 'rgba(235,211,207,0.6)',
              marginTop: '4px',
            }}
          >
            Kanyakumari Studio · Admin
          </div>
        </div>

        {/* Card Body */}
        <div style={{ padding: '36px' }}>
          <h1
            style={{
              fontSize: '20px',
              fontWeight: 700,
              color: 'var(--dk)',
              marginBottom: '4px',
              fontFamily: 'var(--font-serif)',
            }}
          >
            Sign in to Dashboard
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--tx2)', marginBottom: '28px' }}>
            Manage orders, products, and promotions.
          </p>

          {error && (
            <div
              style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                color: '#dc2626',
                borderRadius: '8px',
                padding: '10px 14px',
                fontSize: '13px',
                marginBottom: '18px',
              }}
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="input-label" htmlFor="admin-email">
                Email address
              </label>
              <input
                id="admin-email"
                type="email"
                className="input"
                placeholder="abishek@avalstore.in"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                autoComplete="email"
                style={{ width: '100%' }}
              />
            </div>

            <div>
              <label className="input-label" htmlFor="admin-password">
                Password
              </label>
              <input
                id="admin-password"
                type="password"
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="current-password"
                style={{ width: '100%' }}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ marginTop: '8px', width: '100%', justifyContent: 'center', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'Signing in…' : 'Sign In'}
            </button>
          </form>

          {/* Divider */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              margin: '20px 0',
              color: 'var(--tx2)',
              fontSize: '12px',
            }}
          >
            <div style={{ flex: 1, height: '1px', background: 'var(--bd)' }} />
            or
            <div style={{ flex: 1, height: '1px', background: 'var(--bd)' }} />
          </div>

          {/* Demo Button */}
          <button
            onClick={handleDemoLogin}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px 20px',
              borderRadius: '10px',
              border: '2px dashed var(--bl)',
              background: 'rgba(235,211,207,0.12)',
              color: 'var(--pr)',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}
          >
            <span>👤</span>
            <span>Demo: Sign in as Abishek (Admin)</span>
          </button>

          <p style={{ fontSize: '11px', color: 'var(--tx2)', textAlign: 'center', marginTop: '20px' }}>
            This is a prototype. No real authentication is implemented.
          </p>
        </div>
      </div>
    </div>
  )
}

