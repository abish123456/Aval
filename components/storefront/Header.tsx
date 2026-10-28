'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { useCart } from '@/context/CartContext'

const NAV_LINKS = [
  { href: '/shop', label: 'Shop All' },
  { href: '/category/bridal-bangles', label: 'Bridal Bangles' },
  { href: '/category/hair-clips', label: 'Hair Accessories' },
  { href: '/category/customised', label: 'Customised' },
  { href: '/custom-order', label: 'Custom Order' },
  { href: '/offers', label: 'Combo Deals' },
  { href: '/track-order', label: 'Track Order' },
]

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount } = useCart()

  // Prevent background scroll when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  return (
    <>
      <header className="site-header">
        {/* Logo */}
        <Link href="/" className="header-logo" aria-label="AVAL Store home" style={{ display: 'flex', alignItems: 'center', textDecoration: 'none', gap: '10px' }}>
          <img
            src="/logo.png"
            alt="AVAL"
            style={{ height: '42px', width: 'auto', objectFit: 'contain' }}
          />
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, letterSpacing: '0.12em', color: 'var(--pr)', lineHeight: 1 }}>
              AVAL
            </span>
            <span className="desktop-only-text" style={{ fontFamily: 'var(--font-sans)', fontSize: '7px', letterSpacing: '0.22em', textTransform: 'uppercase', color: 'var(--tx2)', marginTop: '2px' }}>
              KANYAKUMARI • HANDCRAFTED
            </span>
          </div>
        </Link>

        {/* Desktop Nav */}
        <nav className="header-nav" aria-label="Main navigation">
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href}>
              {l.label}
            </Link>
          ))}
        </nav>

        {/* Actions */}
        <div className="header-actions" style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
          <Link
            href="/wishlist"
            className="desktop-only"
            aria-label="Wishlist"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'inherit', padding: '6px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
            </svg>
            <span className="desktop-only-text" style={{ fontSize: '13px', fontWeight: 500 }}>Wishlist</span>
          </Link>

          <Link
            href="/account"
            className="desktop-only"
            aria-label="My Account"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', textDecoration: 'none', color: 'inherit', padding: '6px' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
              <circle cx="12" cy="7" r="4" />
            </svg>
            <span className="desktop-only-text" style={{ fontSize: '13px', fontWeight: 500 }}>Account</span>
          </Link>

          <Link href="/cart" aria-label="Cart" style={{ display: 'flex', alignItems: 'center', gap: '6px', position: 'relative', textDecoration: 'none', color: 'inherit', padding: '6px' }}>
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
              {itemCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    background: 'var(--pr)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '18px',
                    height: '18px',
                    fontSize: '11px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  {itemCount}
                </span>
              )}
            </div>
            <span className="desktop-only-text" style={{ fontSize: '13px', fontWeight: 500 }}>Bag</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Toggle menu"
            style={{
              background: 'none',
              border: 'none',
              padding: '8px',
              color: 'var(--dk)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
            className="mobile-menu-btn"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              {mobileOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </header>

      {/* Mobile Drawer Overlay Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(58,21,32,0.4)',
            backdropFilter: 'blur(3px)',
            zIndex: 998,
          }}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`mobile-drawer ${mobileOpen ? 'open' : ''}`}
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: 'min(320px, 85vw)',
          background: 'var(--bg)',
          zIndex: 999,
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '-4px 0 24px rgba(58,21,32,0.15)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflowY: 'auto',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid var(--bd)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <img src="/logo.png" alt="AVAL" style={{ height: '32px' }} />
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', fontWeight: 700, color: 'var(--pr)', lineHeight: 1 }}>AVAL</div>
              <div style={{ fontSize: '7px', letterSpacing: '0.15em', color: 'var(--tx2)', textTransform: 'uppercase' }}>Handcrafted Bridal</div>
            </div>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            style={{
              background: 'none',
              border: 'none',
              padding: '6px',
              color: 'var(--dk)',
              cursor: 'pointer',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Promo banner inside drawer */}
        <div style={{ background: 'var(--pr)', color: '#fff', padding: '10px 18px', fontSize: '11px', textAlign: 'center', letterSpacing: '0.04em' }}>
          🌸 Kanyakumari Artisanal Handcrafted Jewellery
        </div>

        {/* Navigation list */}
        <div style={{ padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
          <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '4px' }}>
            Collections
          </div>
          {NAV_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              onClick={() => setMobileOpen(false)}
              style={{
                fontSize: '15px',
                fontWeight: 500,
                color: 'var(--dk)',
                textDecoration: 'none',
                padding: '10px 0',
                borderBottom: '1px solid rgba(232,207,203,0.3)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>{l.label}</span>
              <span style={{ fontSize: '13px', color: 'var(--pr)' }}>→</span>
            </Link>
          ))}

          {/* Quick Support Links */}
          <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--bd)' }}>
            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '8px' }}>
              Bridal Support
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px' }}>
              <Link href="/account" onClick={() => setMobileOpen(false)} style={{ color: 'var(--tx)', textDecoration: 'none', fontWeight: 600 }}>
                👤 My Bridal Account &amp; Quotes
              </Link>
              <Link href="/wishlist" onClick={() => setMobileOpen(false)} style={{ color: 'var(--tx)', textDecoration: 'none' }}>
                ❤️ Saved Wishlist
              </Link>
              <Link href="/track-order" onClick={() => setMobileOpen(false)} style={{ color: 'var(--tx)', textDecoration: 'none' }}>
                📦 Track Your Order
              </Link>
              <Link href="/about" onClick={() => setMobileOpen(false)} style={{ color: 'var(--tx)', textDecoration: 'none' }}>
                ✨ About AVAL Kanyakumari Workshop
              </Link>
              <Link href="/faq" onClick={() => setMobileOpen(false)} style={{ color: 'var(--tx)', textDecoration: 'none' }}>
                ❓ Bangle Size Guide &amp; FAQs
              </Link>
            </div>
          </div>
        </div>

        {/* Drawer Footer with direct WhatsApp action */}
        <div style={{ padding: '16px 20px 24px', borderTop: '1px solid var(--bd)', background: '#fff' }}>
          <a
            href="https://wa.me/919876543210?text=Hi%20AVAL%20Store%2C%20I%20would%20like%20to%20order%20bridal%20accessories"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              background: '#25D366',
              color: '#fff',
              padding: '12px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              borderRadius: 0,
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
            </svg>
            Chat with Designer on WhatsApp
          </a>
        </div>
      </div>
    </>
  )
}
