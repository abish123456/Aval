'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function CustomOrderPage() {
  const [submitted, setSubmitted] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    eventDate: '',
    accessoryType: 'Bridal Bangle Set',
    bangleSize: '2.6',
    colorPreference: '',
    customNames: '',
    notes: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Custom Bridal Order</span>
      </nav>

      <div style={{ maxWidth: '820px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <span style={{ fontSize: '13px', textTransform: 'uppercase', letterSpacing: '0.14em', color: 'var(--pr)', fontWeight: 600 }}>
            Made exclusively for your wedding day
          </span>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', color: 'var(--dk)', marginTop: '6px', marginBottom: '12px' }}>
            Bespoke Bridal Design Studio
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '15px', lineHeight: 1.6, maxWidth: '600px', margin: '0 auto' }}>
            Have a specific lehenga, silk saree color, or design in mind? Share your bridal vision with our master artisans in Kanyakumari.
          </p>
        </div>

        {submitted ? (
          <div
            className="card"
            style={{
              padding: '48px 32px',
              textAlign: 'center',
              background: '#fff',
              border: '1px solid var(--bd)',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#dcefe1',
                color: 'var(--ok)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 18px',
              }}
            >
              ✓
            </div>
            <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--dk)', marginBottom: '8px' }}>
              Custom Inquiry Received!
            </h2>
            <p style={{ color: 'var(--tx2)', fontSize: '14px', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
              Thank you, <strong>{formData.name}</strong>. Our senior bridal stylist will review your request and connect with you on WhatsApp at <strong>+91 {formData.phone}</strong> within 4 hours.
            </p>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <Link href="/shop" className="btn btn-primary">
                Browse Ready Designs
              </Link>
              <button onClick={() => setSubmitted(false)} className="btn btn-secondary">
                Submit Another Request
              </button>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '36px', background: '#fff', border: '1px solid var(--bd)' }}>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
              {/* Personal Info */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Bride / Customer Name *
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="e.g. Deepika Sundaram"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  WhatsApp Mobile Number *
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ display: 'flex', alignItems: 'center', padding: '0 12px', background: 'var(--bg2)', border: '1px solid var(--bd)', borderRadius: '6px', fontSize: '13px' }}>
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      className="input"
                      placeholder="98765 43210"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Email Address *
                  <input
                    type="email"
                    required
                    className="input"
                    placeholder="bride@gmail.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Wedding / Muhurtham Date *
                  <input
                    type="date"
                    required
                    className="input"
                    value={formData.eventDate}
                    onChange={(e) => setFormData({ ...formData, eventDate: e.target.value })}
                  />
                </label>
              </div>

              <div className="divider" />

              {/* Design Specifics */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  What accessories do you need?
                  <select
                    className="input"
                    value={formData.accessoryType}
                    onChange={(e) => setFormData({ ...formData, accessoryType: e.target.value })}
                  >
                    <option>Full Bridal Bangle Set (Kundan + Silk)</option>
                    <option>Personalised Name & Date Bangles</option>
                    <option>Bridal Hair Comb / Poola Jada Clips</option>
                    <option>Bridesmaid Bulk Favours Set</option>
                    <option>Complete Trousseau Box Set</option>
                  </select>
                </label>

                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Bangle Size (Standard Indian Sizes)
                  <select
                    className="input"
                    value={formData.bangleSize}
                    onChange={(e) => setFormData({ ...formData, bangleSize: e.target.value })}
                  >
                    <option>2.2 (Small - 2 2/16 in)</option>
                    <option>2.4 (Medium - 2 4/16 in)</option>
                    <option>2.6 (Standard - 2 6/16 in)</option>
                    <option>2.8 (Large - 2 8/16 in)</option>
                    <option>2.10 (Extra Large)</option>
                    <option>Not sure - need sizing consultation</option>
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '18px' }}>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Outfit Colors (e.g., Crimson Maroon, Mustard Gold, Rani Pink)
                  <input
                    type="text"
                    className="input"
                    placeholder="Describe saree or lehenga shade"
                    value={formData.colorPreference}
                    onChange={(e) => setFormData({ ...formData, colorPreference: e.target.value })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                  Names / Dates for Personalisation
                  <input
                    type="text"
                    className="input"
                    placeholder="e.g. Priya & Karthik • 18-11-2026"
                    value={formData.customNames}
                    onChange={(e) => setFormData({ ...formData, customNames: e.target.value })}
                  />
                </label>
              </div>

              {/* Upload photo */}
              <div>
                <label className="input-label" style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px' }}>
                  Upload Saree / Lehenga Photo or Reference Sketch (Optional)
                </label>
                <div
                  style={{
                    border: '2px dashed var(--bd)',
                    borderRadius: '8px',
                    padding: '24px',
                    textAlign: 'center',
                    background: 'var(--bg)',
                    cursor: 'pointer',
                  }}
                >
                  <input type="file" accept="image/*" style={{ display: 'none' }} id="saree-upload" />
                  <label htmlFor="saree-upload" style={{ cursor: 'pointer', display: 'block' }}>
                    <div style={{ color: 'var(--pr)', fontSize: '24px', marginBottom: '6px' }}>📷</div>
                    <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dk)' }}>
                      Click to upload fabric sample or photo
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '4px' }}>
                      PNG, JPG up to 10MB
                    </div>
                  </label>
                </div>
              </div>

              <label className="input-label" style={{ fontSize: '13px', fontWeight: 500 }}>
                Additional Notes or Special Requests
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Tell us about your wedding theme, urgency, or specific elements you'd like included..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </label>

              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  height: '50px',
                  fontSize: '15px',
                  fontWeight: 600,
                  marginTop: '8px',
                }}
              >
                Submit Custom Design Request
              </button>

              {/* Direct WhatsApp CTA */}
              <div style={{ textAlign: 'center', marginTop: '12px' }}>
                <span style={{ fontSize: '13px', color: 'var(--tx2)' }}>or connect instantly:</span>
                <a
                  href="https://wa.me/919840212345?text=Hello%20AVAL%20Store,%20I%20would%20like%20to%20customise%20a%20bridal%20bangle%20set"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginLeft: '8px',
                    color: '#128C7E',
                    fontWeight: 600,
                    textDecoration: 'none',
                    fontSize: '13px',
                  }}
                >
                  💬 Chat on WhatsApp (+91 98402 12345)
                </a>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  )
}
