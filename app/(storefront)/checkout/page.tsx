'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useCart } from '@/context/CartContext'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, subtotal, discount, shipping, total, clearCart } = useCart()

  const [formData, setFormData] = useState({
    fullName: 'Priya Sundaram',
    email: 'priya.sundaram@gmail.com',
    phone: '9840212345',
    street: '14, Beach Road, Near Cape Point',
    city: 'Kanyakumari',
    state: 'Tamil Nadu',
    pincode: '629702',
    notes: 'Please pack in luxury gift box for bridal muhurtham',
  })

  const [paymentMethod, setPaymentMethod] = useState<'upi' | 'card' | 'cod'>('upi')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    setTimeout(() => {
      const orderRef = 'AVL-' + Math.floor(1000 + Math.random() * 9000)

      // Store current order details in sessionStorage for confirmation page display
      const orderData = {
        orderNumber: orderRef,
        createdAt: new Date().toISOString(),
        customer: formData,
        items,
        subtotal,
        discount,
        shipping,
        total,
        paymentMethod: paymentMethod === 'upi' ? 'Razorpay UPI' : paymentMethod === 'card' ? 'Credit/Debit Card' : 'Cash on Delivery',
        paymentStatus: paymentMethod === 'cod' ? 'PENDING' : 'PAID',
      }
      try {
        sessionStorage.setItem('last_order', JSON.stringify(orderData))
      } catch {
        // ignore
      }

      clearCart()
      setIsSubmitting(false)
      router.push(`/order-confirmation?orderNumber=${orderRef}`)
    }, 1200)
  }

  if (items.length === 0) {
    return (
      <div className="container" style={{ paddingTop: '80px', paddingBottom: '120px', textAlign: 'center' }}>
        <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--dk)', marginBottom: '16px' }}>
          No items in cart for checkout
        </h2>
        <Link href="/shop" className="btn btn-primary">
          Return to Shop
        </Link>
      </div>
    )
  }

  return (
    <div className="container" style={{ paddingTop: '36px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <Link href="/cart">Cart</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Checkout</span>
      </nav>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '40px', alignItems: 'start' }}>
        {/* Left: Customer Information & Delivery Form */}
        <form onSubmit={handlePlaceOrder} style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>
          {/* Section 1: Contact Details */}
          <div className="card" style={{ padding: '24px', background: '#fff' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px' }}>
              1. Contact Information
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
              <div>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Full Name *
                  <input
                    type="text"
                    name="fullName"
                    required
                    className="input"
                    value={formData.fullName}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Email for Confirmation *
                  <input
                    type="email"
                    name="email"
                    required
                    className="input"
                    value={formData.email}
                    onChange={handleInputChange}
                  />
                </label>
              </div>
              <div>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Mobile Number (for Courier & WhatsApp alerts) *
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: '6px', fontSize: '13px' }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      name="phone"
                      required
                      className="input"
                      value={formData.phone}
                      onChange={handleInputChange}
                    />
                  </div>
                </label>
              </div>
            </div>
          </div>

          {/* Section 2: Shipping Address */}
          <div className="card" style={{ padding: '24px', background: '#fff' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px' }}>
              2. Shipping Address
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                Street Address / House No / Apartment *
                <input
                  type="text"
                  name="street"
                  required
                  className="input"
                  value={formData.street}
                  onChange={handleInputChange}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '14px' }}>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  City *
                  <input
                    type="text"
                    name="city"
                    required
                    className="input"
                    value={formData.city}
                    onChange={handleInputChange}
                  />
                </label>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  State *
                  <input
                    type="text"
                    name="state"
                    required
                    className="input"
                    value={formData.state}
                    onChange={handleInputChange}
                  />
                </label>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  PIN Code *
                  <input
                    type="text"
                    name="pincode"
                    required
                    className="input"
                    value={formData.pincode}
                    onChange={handleInputChange}
                  />
                </label>
              </div>

              <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                Special Handcraft or Delivery Notes (Optional)
                <textarea
                  name="notes"
                  className="input"
                  rows={2}
                  value={formData.notes}
                  onChange={handleInputChange}
                  placeholder="e.g. Wedding muhurtham date is 18 Nov, need delivery before 15th."
                />
              </label>
            </div>
          </div>

          {/* Section 3: Payment Method */}
          <div className="card" style={{ padding: '24px', background: '#fff' }}>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px' }}>
              3. Payment Method
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: '6px',
                  border: paymentMethod === 'upi' ? '2px solid var(--pr)' : '1px solid var(--bd)',
                  background: paymentMethod === 'upi' ? 'var(--bl2)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'upi'}
                  onChange={() => setPaymentMethod('upi')}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dk)' }}>
                    UPI (Google Pay, PhonePe, Paytm, QR)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                    Instant confirmation via Razorpay secure gateway
                  </div>
                </div>
                <span style={{ fontSize: '12px', background: '#dcefe1', color: 'var(--ok)', padding: '2px 8px', borderRadius: '4px', fontWeight: 600 }}>
                  Fastest
                </span>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: '6px',
                  border: paymentMethod === 'card' ? '2px solid var(--pr)' : '1px solid var(--bd)',
                  background: paymentMethod === 'card' ? 'var(--bl2)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'card'}
                  onChange={() => setPaymentMethod('card')}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dk)' }}>
                    Credit / Debit Cards & Net Banking
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                    Visa, MasterCard, RuPay, Maestro & Major Indian Banks
                  </div>
                </div>
              </label>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 18px',
                  borderRadius: '6px',
                  border: paymentMethod === 'cod' ? '2px solid var(--pr)' : '1px solid var(--bd)',
                  background: paymentMethod === 'cod' ? 'var(--bl2)' : '#fff',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === 'cod'}
                  onChange={() => setPaymentMethod('cod')}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dk)' }}>
                    Cash on Delivery (COD)
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>
                    Pay cash upon delivery. Additional ₹50 COD verification fee applies.
                  </div>
                </div>
              </label>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="btn btn-primary"
            style={{
              height: '52px',
              fontSize: '16px',
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {isSubmitting ? 'Securing Your Order...' : `Pay & Place Order • ${fmt(total)}`}
          </button>
        </form>

        {/* Right: Order Summary Sidebar */}
        <div className="card" style={{ padding: '24px', background: '#fff', alignSelf: 'start' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', marginBottom: '16px' }}>
            In Your Bag ({items.length})
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '20px' }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                <img
                  src={item.product.images[0]}
                  alt={item.product.name}
                  style={{ width: '56px', height: '56px', borderRadius: '4px', objectFit: 'cover' }}
                />
                <div style={{ flex: 1, fontSize: '13px' }}>
                  <div style={{ fontWeight: 600, color: 'var(--dk)' }}>{item.product.name}</div>
                  <div style={{ color: 'var(--tx2)', fontSize: '12px' }}>
                    Qty: {item.quantity} • Size: {item.size}
                  </div>
                  {item.customName && (
                    <div style={{ color: 'var(--pr)', fontSize: '11px', fontWeight: 500 }}>
                      ✍️ &ldquo;{item.customName}&rdquo;
                    </div>
                  )}
                </div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--pr)' }}>
                  {fmt(item.price * item.quantity)}
                </div>
              </div>
            ))}
          </div>

          <div className="divider" style={{ margin: '12px 0' }} />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tx2)' }}>Subtotal</span>
              <span style={{ fontWeight: 600 }}>{fmt(subtotal)}</span>
            </div>
            {discount > 0 && (
              <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ok)' }}>
                <span>Discount</span>
                <span>− {fmt(discount)}</span>
              </div>
            )}
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--tx2)' }}>Shipping</span>
              <span style={{ fontWeight: 600 }}>
                {shipping === 0 ? <span style={{ color: 'var(--ok)' }}>FREE</span> : fmt(shipping)}
              </span>
            </div>
            <div className="divider" style={{ margin: '6px 0' }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '16px', fontWeight: 700, color: 'var(--pr)' }}>
              <span>Total Payable</span>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '20px' }}>{fmt(total)}</span>
            </div>
          </div>

          <div style={{ marginTop: '20px', padding: '12px', background: 'var(--bg2)', borderRadius: 0, fontSize: '12px', color: 'var(--tx2)', textAlign: 'center' }}>
            📦 Guaranteed Handcrafted Quality from Kanyakumari
          </div>
        </div>
      </div>
    </div>
  )
}
