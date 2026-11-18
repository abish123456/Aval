'use client'

import { useState } from 'react'
import { useCart } from '@/context/CartContext'

export default function ApplyCouponButton({ code }: { code: string }) {
  const { applyCoupon, couponCode } = useCart()
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null)
  const [busy, setBusy] = useState(false)
  const applied = couponCode === code

  async function handleClick() {
    setBusy(true)
    const r = await applyCoupon(code)
    setBusy(false)
    setMessage({ text: r.message, error: !r.ok })
  }

  return (
    <div style={{ textAlign: 'right' }}>
      <button type="button" className="btn btn-outline btn-sm" disabled={busy || applied} onClick={handleClick}>
        {applied ? 'Applied' : busy ? 'Checking…' : 'Apply to bag'}
      </button>
      {message && (
        <div role="status" style={{ fontSize: '12px', marginTop: '6px', color: message.error ? 'var(--er)' : 'var(--ok)' }}>
          {message.text}
        </div>
      )}
    </div>
  )
}
