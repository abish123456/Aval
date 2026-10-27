'use client'

import Link from 'next/link'
import { useState } from 'react'

const FAQS = [
  {
    q: 'How do I choose the correct bangle size?',
    a: 'We follow standard Indian bangle sizing (2.2, 2.4, 2.6, 2.8, 2.10). If you already have a bangle that fits comfortably, measure its inside diameter in inches or centimeters, or consult our size guide on the product page. You can also message us on WhatsApp for live sizing help.',
  },
  {
    q: 'Can you match my bangles to my wedding saree or lehenga?',
    a: 'Yes! That is our specialty. Use our Custom Bridal Order page to upload photos of your saree or fabric swatch. Our color master in Kanyakumari will select the exact silk thread shade to match.',
  },
  {
    q: 'How long does handcrafting and delivery take?',
    a: 'Standard ready designs ship within 2-3 days. Customised name & date bangles take 4-6 business days for hand-wrapping and protective glazing before express dispatch via Delhivery or Bluedart.',
  },
  {
    q: 'What payment methods do you accept?',
    a: 'We accept all UPI apps (Google Pay, PhonePe, Paytm), Credit & Debit cards, Net Banking via Razorpay, as well as Cash on Delivery (COD) for eligible pincodes across India.',
  },
  {
    q: 'Is Cash on Delivery (COD) available for custom name bangles?',
    a: 'Because custom-lettered bangles are personalised specifically with your names, we request an initial token advance of ₹200 via UPI, with the remaining balance payable upon delivery.',
  },
]

export default function FAQPage() {
  const [openIdx, setOpenIdx] = useState<number | null>(0)

  return (
    <div className="container" style={{ paddingTop: '40px', paddingBottom: '90px' }}>
      <nav className="breadcrumb" style={{ marginBottom: '24px' }}>
        <Link href="/">Home</Link>
        <span>/</span>
        <span style={{ color: 'var(--tx)' }}>Frequently Asked Questions</span>
      </nav>

      <div style={{ maxWidth: '780px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '38px', color: 'var(--dk)', marginBottom: '8px' }}>
            Frequently Asked Questions
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '15px' }}>
            Everything you need to know about sizing, bespoke handcrafting, and wedding orders.
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {FAQS.map((faq, idx) => {
            const isOpen = openIdx === idx
            return (
              <div
                key={idx}
                className="card"
                style={{
                  padding: '20px 24px',
                  background: '#fff',
                  border: '1px solid var(--bd)',
                  cursor: 'pointer',
                }}
                onClick={() => setOpenIdx(isOpen ? null : idx)}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--dk)', margin: 0 }}>
                    {faq.q}
                  </h3>
                  <span style={{ fontSize: '18px', color: 'var(--pr)', fontWeight: 700 }}>
                    {isOpen ? '−' : '+'}
                  </span>
                </div>
                {isOpen && (
                  <p style={{ marginTop: '12px', fontSize: '14px', color: 'var(--tx2)', lineHeight: 1.7 }}>
                    {faq.a}
                  </p>
                )}
              </div>
            )
          })}
        </div>

        <div style={{ textAlign: 'center', marginTop: '40px', padding: '24px', background: 'var(--bl2)', borderRadius: '12px' }}>
          <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--pr)', marginBottom: '6px' }}>
            Still have questions about your wedding order?
          </h4>
          <p style={{ fontSize: '14px', color: 'var(--tx)', marginBottom: '16px' }}>
            Our bridal styling team in Kanyakumari is happy to assist you directly on WhatsApp.
          </p>
          <a
            href="https://wa.me/919840212345"
            target="_blank"
            rel="noreferrer"
            className="btn btn-primary"
            style={{ textDecoration: 'none' }}
          >
            Chat with Us on WhatsApp
          </a>
        </div>
      </div>
    </div>
  )
}
