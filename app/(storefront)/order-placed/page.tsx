'use client'

import React, { Suspense, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'

function OrderPlacedContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get('token') ?? ''
  const [copied, setCopied] = useState(false)

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'
  const orderLink = `${origin}/o/${token}`

  const waText = encodeURIComponent(
    `My AVAL Store Bridal Order Link:\n${orderLink}\n\nSave this link to chat with the artisan, confirm saree matching, track courier, and pay!`
  )
  const waSelfLink = `https://wa.me/?text=${waText}`

  function copyLink() {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(orderLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 3000)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '80vh', padding: '60px 20px 100px' }}>
      <div className="container-sm" style={{ maxWidth: '640px', margin: '0 auto' }}>
        <div
          className="card"
          style={{
            padding: '40px 32px',
            background: '#fff',
            border: '1px solid var(--bd)',
            textAlign: 'center',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          {/* Success Check Icon */}
          <div style={{ color: 'var(--ok)', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
            <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
              <polyline points="22 4 12 14.01 9 11.01" />
            </svg>
          </div>

          <span
            style={{
              fontSize: '12px',
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--pr)',
              fontWeight: 600,
              display: 'inline-block',
              marginBottom: '8px',
            }}
          >
            Order Received Successfully
          </span>

          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '34px',
              color: 'var(--dk)',
              margin: '0 0 12px',
              fontWeight: 600,
            }}
          >
            Vanakkam! Your Order is Placed
          </h1>

          <p style={{ color: 'var(--tx2)', fontSize: '15px', lineHeight: 1.6, marginBottom: '28px' }}>
            We have generated your <strong>private order link</strong>. You can use it to chat directly with our Kanyakumari artisan, view your design progress, track shipment, and complete payment.
          </p>

          {/* Link Box */}
          <div
            style={{
              background: 'var(--bg)',
              border: '1px solid var(--bd)',
              borderRadius: '6px',
              padding: '18px 20px',
              textAlign: 'left',
              marginBottom: '24px',
            }}
          >
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tx2)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Your Private Order Link (Bookmark &amp; Save This)
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <input
                type="text"
                readOnly
                value={orderLink}
                className="input"
                style={{
                  flex: 1,
                  background: '#fff',
                  fontFamily: 'monospace',
                  fontSize: '13px',
                  color: 'var(--pr)',
                  fontWeight: 600,
                  height: '42px',
                  minWidth: '240px',
                }}
              />
              <button
                onClick={copyLink}
                className="btn btn-secondary"
                style={{ height: '42px', padding: '0 18px', fontSize: '13px', whiteSpace: 'nowrap' }}
              >
                {copied ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <a
              href={waSelfLink}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
              style={{
                width: '100%',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                background: '#059669',
                color: '#fff',
                border: 'none',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.353.101.173.45 1.743 1.832 2.37.177.08.31.13.418.163.18.056.345.048.475.029.145-.022.448-.183.511-.36.063-.177.063-.328.044-.36-.019-.032-.072-.05-.15-.094z" />
              </svg>
              Send Link to My WhatsApp
            </a>

            <Link
              href={`/o/${token}`}
              className="btn btn-primary"
              style={{
                width: '100%',
                height: '46px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 600,
                fontSize: '14px',
                textDecoration: 'none',
              }}
            >
              Open My Order &amp; Chat with Artisan →
            </Link>
          </div>

          <div
            style={{
              marginTop: '32px',
              paddingTop: '20px',
              borderTop: '1px solid var(--bd)',
              fontSize: '13px',
              color: 'var(--tx2)',
              lineHeight: 1.6,
            }}
          >
            Need help or want to speak immediately? Call our Kanyakumari studio at{' '}
            <a href="tel:+916381823698" style={{ color: 'var(--pr)', fontWeight: 600 }}>
              +91 63818 23698
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrderPlacedPage() {
  return (
    <Suspense
      fallback={
        <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          Loading your order details...
        </div>
      }
    >
      <OrderPlacedContent />
    </Suspense>
  )
}
