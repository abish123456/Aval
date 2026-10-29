'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, clearCart } = useCart()

  const [form, setForm] = useState({
    customerName: '',
    customerPhone: '',
    customerWhatsapp: '',
    street: '',
    city: '',
    state: 'Tamil Nadu',
    pincode: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const cart = items.map((item) => ({
    productId: item.product.id || item.id,
    productName:
      item.product.name + (item.customName ? ` (Custom: ${item.customName})` : ''),
    size: item.size,
    qty: item.quantity,
    unitPaise: Math.round(item.price * 100),
  }))

  const totalPaise = cart.reduce((s, i) => s + i.unitPaise * i.qty, 0)

  function set(field: string, value: string) {
    setForm((f) => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (cart.length === 0) {
      setError('Your bag is empty. Please select bangles from the showroom first.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/enquiries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerName: form.customerName,
          customerPhone: form.customerPhone,
          customerWhatsapp: form.customerWhatsapp,
          deliveryAddress: {
            street: form.street,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          items: cart,
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? 'Something went wrong. Please check details and try again.')
        return
      }

      clearCart()
      if (typeof window !== 'undefined') {
        localStorage.removeItem('aval_cart')
      }

      router.push(`/order-placed?token=${data.token}`)
    } catch {
      setError('Network error. Please check your internet connection.')
    } finally {
      setLoading(false)
    }
  }

  if (cart.length === 0) {
    return (
      <div className="container-sm" style={{ padding: '80px 24px', textAlign: 'center' }}>
        <div style={{ color: 'var(--pr)', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
            <line x1="3" y1="6" x2="21" y2="6" />
            <path d="M16 10a4 4 0 0 1-8 0" />
          </svg>
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--dk)', marginBottom: '12px' }}>
          Your Bag is Empty
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: '15px', marginBottom: '28px' }}>
          Browse our bespoke bridal sets and handcrafted Kundan bangles to place your order.
        </p>
        <Link href="/shop" className="btn btn-primary" style={{ padding: '12px 32px' }}>
          Explore Bridal Collection
        </Link>
      </div>
    )
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '85vh', padding: '48px 0 80px' }}>
      <div className="container-sm" style={{ maxWidth: '1080px', margin: '0 auto', padding: '0 20px' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span
            style={{
              fontSize: '11px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--pr)',
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            Express Bridal Checkout
          </span>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '34px',
              color: 'var(--dk)',
              margin: '0 0 8px',
              fontWeight: 600,
            }}
          >
            Place Your Order
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '14px', maxWidth: '480px', margin: '0 auto' }}>
            No password or account required. Enter your delivery address to receive your private order tracking link.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '32px' }}>
          {/* Left: Delivery Details Form */}
          <div className="card" style={{ padding: '28px', background: '#fff', border: '1px solid var(--bd)' }}>
            <h2
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '22px',
                color: 'var(--dk)',
                marginBottom: '20px',
                borderBottom: '1px solid var(--bd)',
                paddingBottom: '12px',
              }}
            >
              1. Delivery Information
            </h2>

            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Bride / Customer Name *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Priya Sundaram"
                  value={form.customerName}
                  onChange={(e) => set('customerName', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Phone Number *
                  </label>
                  <input
                    type="tel"
                    required
                    className="input"
                    placeholder="9876543210"
                    value={form.customerPhone}
                    onChange={(e) => set('customerPhone', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    WhatsApp Number *
                  </label>
                  <input
                    type="tel"
                    required
                    className="input"
                    placeholder="9876543210"
                    value={form.customerWhatsapp}
                    onChange={(e) => set('customerWhatsapp', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>
              <p style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '-10px', margin: 0 }}>
                Your private order link &amp; courier tracking will be sent to this WhatsApp number.
              </p>

              <div>
                <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                  Street Address (Door No, Street Name, Landmark) *
                </label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. 12/4B, Raja Street, Near Temple"
                  value={form.street}
                  onChange={(e) => set('street', e.target.value)}
                  style={{ width: '100%' }}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    City *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g. Chennai"
                    value={form.city}
                    onChange={(e) => set('city', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    State *
                  </label>
                  <input
                    type="text"
                    required
                    className="input"
                    value={form.state}
                    onChange={(e) => set('state', e.target.value)}
                    style={{ width: '100%' }}
                  />
                </div>
                <div>
                  <label className="input-label" style={{ display: 'block', marginBottom: '6px' }}>
                    Pincode *
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    className="input"
                    placeholder="600001"
                    value={form.pincode}
                    onChange={(e) => set('pincode', e.target.value.replace(/\D/g, '').slice(0, 6))}
                    style={{ width: '100%' }}
                  />
                </div>
              </div>

              {error && (
                <div
                  style={{
                    background: 'var(--er-bg)',
                    color: 'var(--er)',
                    padding: '12px 16px',
                    borderRadius: '4px',
                    fontSize: '13px',
                    marginTop: '6px',
                  }}
                >
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary"
                style={{
                  width: '100%',
                  height: '48px',
                  fontSize: '15px',
                  fontWeight: 600,
                  letterSpacing: '0.04em',
                  marginTop: '10px',
                }}
              >
                {loading ? 'Submitting Order...' : 'Confirm & Place Order →'}
              </button>

              <p style={{ textAlign: 'center', fontSize: '12px', color: 'var(--tx2)', margin: 0 }}>
                Safe &amp; encrypted. You can chat with our artisan and pay via UPI after confirming design.
              </p>
            </form>
          </div>

          {/* Right: Order Summary */}
          <div>
            <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid var(--bd)' }}>
              <h2
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: '22px',
                  color: 'var(--dk)',
                  marginBottom: '16px',
                  borderBottom: '1px solid var(--bd)',
                  paddingBottom: '12px',
                }}
              >
                2. Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
                {cart.map((item, idx) => (
                  <div
                    key={idx}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      borderBottom: '1px solid #f0e8e6',
                      paddingBottom: '12px',
                    }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dk)' }}>
                        {item.productName}
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px' }}>
                        Size: <strong>{item.size}</strong> • Qty: {item.qty}
                      </div>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--pr)', whiteSpace: 'nowrap' }}>
                      {fmt((item.unitPaise * item.qty) / 100)}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '13px', color: 'var(--tx2)' }}>
                <span>Subtotal</span>
                <span>{fmt(totalPaise / 100)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '14px', fontSize: '13px', color: 'var(--tx2)' }}>
                <span>Bridal Courier &amp; Packaging</span>
                <span style={{ color: 'var(--ok)', fontWeight: 600 }}>FREE</span>
              </div>

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  borderTop: '2px solid var(--bd)',
                  paddingTop: '14px',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: 'var(--pr)',
                }}
              >
                <span>Total Amount</span>
                <span>{fmt(totalPaise / 100)}</span>
              </div>

              <div
                style={{
                  background: 'var(--bl2)',
                  padding: '14px',
                  borderRadius: '4px',
                  marginTop: '20px',
                  fontSize: '12px',
                  color: 'var(--dk)',
                  lineHeight: 1.6,
                }}
              >
                <strong>AVAL Artisan Promise:</strong> All bridal chooda &amp; Kundan sets are hand-finished in our Kanyakumari workshop with anti-tarnish protective glaze.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
