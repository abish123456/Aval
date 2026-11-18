'use client'

import React, { useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

export default function AccountRedirectPage() {
  const router = useRouter()

  useEffect(() => {
    // Auto redirect to track-order after short moment
    const timer = setTimeout(() => {
      router.push('/track-order')
    }, 1500)
    return () => clearTimeout(timer)
  }, [router])

  return (
    <div style={{ background: 'var(--bg)', minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px 20px' }}>
      <div className="card" style={{ maxWidth: '480px', width: '100%', padding: '40px 32px', textAlign: 'center', background: '#fff', border: '1px solid var(--bd)' }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>🌸</div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--dk)', marginBottom: '10px', fontWeight: 600 }}>
          Direct Bridal Order Tracking
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: '14px', lineHeight: 1.6, marginBottom: '24px' }}>
          At AVAL Store, you don&apos;t need an email or password account. All your bridal bangles, design chats, and courier updates are securely accessible via your <strong>Personal Order Link</strong>.
        </p>
        <Link href="/track-order" className="btn btn-primary" style={{ padding: '12px 28px', fontSize: '14px', fontWeight: 600 }}>
          Go to Track Order →
        </Link>
      </div>
    </div>
  )
}
