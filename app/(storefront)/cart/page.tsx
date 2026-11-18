'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useCart } from '@/context/CartContext'

function fmt(n: number) {
  // Whole rupees print plainly; percentage coupons can leave paise, shown as .xx
  return '₹' + n.toLocaleString('en-IN', Number.isInteger(n) ? undefined : { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

export default function CartPage() {
  const {
    items,
    removeItem,
    updateQuantity,
    subtotal,
    discount,
    shipping,
    total,
    applyCoupon,
    removeCoupon,
    couponCode,
    quote,
    quoteError,
    hydrated,
  } = useCart()

  const [inputCode, setInputCode] = useState('')
  const [applying, setApplying] = useState(false)
  const [couponMsg, setCouponMsg] = useState<{ text: string; error?: boolean } | null>(null)

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputCode.trim()) return
    setApplying(true)
    const r = await applyCoupon(inputCode)
    setApplying(false)
    setCouponMsg({ text: r.message, error: !r.ok })
    if (r.ok) setInputCode('')
  }

  // A saved coupon can stop being valid (expired, bag changed)
  const savedCouponError = couponCode && quote?.couponError ? quote.couponError : null

  if (!hydrated) {
    return <div className="container" style={{ minHeight: '60vh' }} aria-busy="true" />
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '80px', paddingBottom: '120px', textAlign: 'center' }}>
        <div style={{ maxWidth: '460px', margin: '0 auto' }}>
          <div
            style={{
              width: '80px',
              height: '80px',
              borderRadius: '50%',
              background: 'var(--bl2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 24px',
              color: 'var(--pr)',
            }}
          >
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
          </div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--dk)', marginBottom: '12px' }}>
            Your Bag is Empty
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
            Looks like you haven&apos;t added any bridal accessories yet. Explore our handcrafted collection from Kanyakumari artisans.
          </p>
          <Link href="/shop" className="btn btn-primary" style={{ padding: '12px 32px' }}>
            Explore Handcrafted Bangles
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '36px', color: 'var(--dk)', marginBottom: '8px' }}>
        Shopping Bag
      </h1>
      <p style={{ color: 'var(--tx2)', fontSize: '14px', marginBottom: '32px' }}>
        Review your custom bridal pieces before proceeding to express checkout.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
        {/* Cart items list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="card"
              style={{
                padding: '20px',
                display: 'flex',
                gap: '20px',
                alignItems: 'center',
                background: '#fff',
              }}
            >
              <img
                src={item.product.images[0]}
                alt={item.product.name}
                style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: 0,
                  objectFit: 'cover',
                  background: 'var(--bl2)',
                }}
              />

              <div style={{ flex: 1, minWidth: '160px' }}>
                <Link
                  href={`/product/${item.product.slug}`}
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: '17px',
                    fontWeight: 600,
                    color: 'var(--dk)',
                    textDecoration: 'none',
                  }}
                >
                  {item.product.name}
                </Link>

                <div style={{ fontSize: '13px', color: 'var(--tx2)', marginTop: '4px' }}>
                  <span>Size: {item.size}</span>
                  {item.customName && (
                    <div style={{ color: 'var(--pr)', fontWeight: 500, marginTop: '2px' }}>
                      ✍️ Custom Names: &ldquo;{item.customName}&rdquo;
                      {item.weddingDate && ` • ${item.weddingDate}`}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginTop: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', border: '1px solid var(--bd)', borderRadius: 0 }}>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}
                    >
                      −
                    </button>
                    <span style={{ width: '30px', textAlign: 'center', fontSize: '13px', fontWeight: 600 }}>
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      style={{ width: '28px', height: '28px', border: 'none', background: 'none', cursor: 'pointer', fontSize: '14px' }}
                    >
                      +
                    </button>
                  </div>

                  <button
                    onClick={() => removeItem(item.id)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: 'var(--tx2)',
                      fontSize: '12px',
                      cursor: 'pointer',
                      textDecoration: 'underline',
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--pr)' }}>
                  {fmt(item.price * item.quantity)}
                </div>
                {item.quantity > 1 && (
                  <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>
                    {fmt(item.price)} each
                  </div>
                )}
              </div>
            </div>
          ))}

          {/* Special note */}
          <div style={{ padding: '16px 20px', background: 'var(--bl2)', borderRadius: 0, fontSize: '13px', color: 'var(--pr)' }}>
            <strong>✨ Note on Handcrafted Orders:</strong> Because each personalised set is hand-enameled and wrapped in Kanyakumari, please allow 4-6 business days before dispatch.
          </div>
        </div>

        {/* Order summary sidebar */}
        <div className="card" style={{ padding: '24px', background: '#fff', alignSelf: 'start', borderRadius: 0, border: '1px solid var(--bd)' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '18px' }}>
            Order Summary
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: 'var(--tx)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tx2)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
            </div>

            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ok)' }}>
                <span>Coupon Discount ({couponCode})</span>
                <span>− {fmt(discount)}</span>
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tx2)' }}>Shipping</span>
              <span style={{ fontWeight: 600 }}>
                {shipping === 0 ? <span style={{ color: 'var(--ok)' }}>FREE</span> : fmt(shipping)}
              </span>
            </div>

            {shipping > 0 && quote && quote.freeShippingRemainingPaise > 0 && (
              <div style={{ fontSize: '11px', color: 'var(--tx2)', background: 'var(--bg2)', padding: '6px 10px', borderRadius: 0 }}>
                Add {fmt(Math.ceil(quote.freeShippingRemainingPaise / 100))} more for <strong>free shipping</strong>.
              </div>
            )}

            {quoteError && (
              <div role="alert" style={{ fontSize: '12px', color: 'var(--er)', background: 'var(--er-bg)', padding: '8px 10px' }}>
                {quoteError}
              </div>
            )}

            <div className="divider" style={{ margin: '8px 0' }} />

            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '18px', fontWeight: 700, color: 'var(--pr)' }}>
              <span>Total Amount</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '22px' }}>{fmt(total)}</span>
            </div>
            <div style={{ fontSize: '11px', color: 'var(--tx2)', textAlign: 'right' }}>
              Inclusive of all applicable taxes
            </div>
          </div>

          {/* Coupon form */}
          <form onSubmit={handleApplyCoupon} style={{ marginTop: '24px' }}>
            <label htmlFor="coupon-code" style={{ fontSize: '12px', color: 'var(--tx2)', marginBottom: '6px', display: 'block' }}>
              Have a promo code?
            </label>
            {couponCode && !savedCouponError && (
              <div style={{ fontSize: '12px', color: 'var(--ok)', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', gap: '8px' }}>
                <span>Coupon <strong>{couponCode}</strong> applied</span>
                <button type="button" onClick={removeCoupon} style={{ background: 'none', border: 0, color: 'var(--tx2)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                  Remove
                </button>
              </div>
            )}
            {savedCouponError && (
              <div role="alert" style={{ fontSize: '12px', color: 'var(--pr)', marginBottom: '8px' }}>
                {couponCode}: {savedCouponError}{' '}
                <button type="button" onClick={removeCoupon} style={{ background: 'none', border: 0, color: 'var(--tx2)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px' }}>
                  Remove
                </button>
              </div>
            )}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                id="coupon-code"
                type="text"
                placeholder="Enter coupon"
                className="input"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                style={{ textTransform: 'uppercase' }}
              />
              <button type="submit" disabled={applying} className="btn btn-secondary" style={{ whiteSpace: 'nowrap', padding: '0 16px' }}>
                {applying ? 'Checking…' : 'Apply'}
              </button>
            </div>
            {couponMsg && (
              <div
                role="status"
                style={{
                  fontSize: '12px',
                  marginTop: '6px',
                  color: couponMsg.error ? 'var(--pr)' : 'var(--ok)',
                  fontWeight: 500,
                }}
              >
                {couponMsg.text}
              </div>
            )}
          </form>

          {/* Checkout CTA */}
          <Link
            href="/checkout"
            className="btn btn-primary"
            style={{
              width: '100%',
              marginTop: '24px',
              height: '48px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '15px',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            Proceed to Checkout • {fmt(total)}
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', marginTop: '16px', fontSize: '12px', color: 'var(--tx2)' }}>
            <span>Place your order now. Pay securely by UPI or card once we confirm your design.</span>
          </div>
        </div>
      </div>
    </div>
  )
}
