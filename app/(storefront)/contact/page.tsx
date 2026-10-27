'use client'

import Link from 'next/link'
import { useState } from 'react'

export default function ContactPage() {
  const [sent, setSent] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', phone: '', message: '' })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
  }

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Contact Us</span>
      </nav>

      <div style={{ maxWidth: '840px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', color: 'var(--dk)', marginBottom: '8px' }}>
            We would love to hear from you
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '15px' }}>
            Reach out for bespoke bridal consults, bulk bridesmaid orders, or workshop visits in Kanyakumari.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '32px' }}>
          {/* Contact Details */}
          <div className="card" style={{ padding: '32px', background: 'var(--bl2)', display: 'flex', flexDirection: 'column', gap: '20px', borderRadius: 0 }}>
            <div>
              <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--pr)', marginBottom: '6px' }}>
                Kanyakumari Artisan Studio
              </h3>
              <p style={{ fontSize: '14px', color: 'var(--tx)', lineHeight: 1.6 }}>
                AVAL Handcrafted Studios<br />
                Beach Road, Cape Town Centre<br />
                Kanyakumari, Tamil Nadu - 629702
              </p>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dk)', marginBottom: '4px' }}>
                WhatsApp Bridal Support
              </h4>
              <a
                href="https://wa.me/919840212345"
                target="_blank"
                rel="noreferrer"
                style={{ color: '#128C7E', fontWeight: 600, fontSize: '14px', textDecoration: 'none' }}
              >
                💬 +91 98402 12345
              </a>
              <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px' }}>
                Mon – Sat: 9:30 AM to 8:00 PM IST
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dk)', marginBottom: '4px' }}>
                Email Inquiries
              </h4>
              <div style={{ fontSize: '14px', color: 'var(--tx)' }}>contact@avalstore.com</div>
              <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px' }}>
                We reply to all emails within 12 hours.
              </div>
            </div>
          </div>

          {/* Inquiry Form */}
          <div className="card" style={{ padding: '32px', background: '#fff' }}>
            {sent ? (
              <div style={{ textAlign: 'center', padding: '30px 0' }}>
                <div style={{ fontSize: '32px', color: 'var(--ok)', marginBottom: '12px' }}>✓</div>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--dk)', marginBottom: '8px' }}>
                  Message Sent!
                </h3>
                <p style={{ fontSize: '14px', color: 'var(--tx2)', marginBottom: '20px' }}>
                  Thank you for writing to us. Our bridal specialist will be in touch shortly.
                </p>
                <button onClick={() => setSent(false)} className="btn btn-secondary">
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <label className="input-label" style={{ fontSize: '13px' }}>
                  Your Name *
                  <input
                    type="text"
                    required
                    className="input"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px' }}>
                  Email Address *
                  <input
                    type="email"
                    required
                    className="input"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px' }}>
                  Phone / WhatsApp (Optional)
                  <input
                    type="tel"
                    className="input"
                    value={form.phone}
                    onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px' }}>
                  How can we help you? *
                  <textarea
                    required
                    rows={3}
                    className="input"
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    placeholder="Tell us about your wedding date, required bangles or custom order request..."
                  />
                </label>

                <button type="submit" className="btn btn-primary" style={{ height: '46px', fontSize: '14px', fontWeight: 600 }}>
                  Send Message
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
