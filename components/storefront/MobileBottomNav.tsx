'use client'

import { Suspense } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useCart } from '@/context/CartContext'

function MobileBottomNavContent() {
  const pathname = usePathname()
  const { itemCount } = useCart()

  // Do not render bottom nav on admin routes
  if (pathname?.startsWith('/admin')) {
    return null
  }

  const navItems = [
    {
      href: '/',
      label: 'Home',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
          <polyline points="9 22 9 12 15 12 15 22" />
        </svg>
      ),
      exact: true,
    },
    {
      href: '/shop',
      label: 'Shop',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect width="7" height="7" x="3" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="3" rx="1" />
          <rect width="7" height="7" x="14" y="14" rx="1" />
          <rect width="7" height="7" x="3" y="14" rx="1" />
        </svg>
      ),
    },
    {
      href: '/custom-order',
      label: 'Custom',
      badge: 'Bespoke',
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z" />
        </svg>
      ),
    },
    {
      href: '/cart',
      label: 'Bag',
      count: itemCount,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
          <line x1="3" y1="6" x2="21" y2="6" />
          <path d="M16 10a4 4 0 0 1-8 0" />
        </svg>
      ),
    },
    {
      href: 'https://wa.me/919876543210?text=Hi%20AVAL%20Store%2C%20I%20would%20like%20to%20enquire%20about%20bridal%20accessories',
      label: 'WhatsApp',
      external: true,
      icon: (
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
        </svg>
      ),
    },
  ]

  return (
    <nav className="mobile-bottom-bar" aria-label="Mobile Bottom Navigation">
      {navItems.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : !item.external && pathname?.startsWith(item.href)

        const content = (
          <div
            className={`mobile-bottom-item ${isActive ? 'active' : ''}`}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '4px',
              padding: '8px 4px',
              position: 'relative',
              color: isActive ? 'var(--pr)' : 'var(--tx2)',
              textDecoration: 'none',
              transition: 'color 0.2s ease',
              flex: 1,
            }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {item.icon}
              {typeof item.count === 'number' && item.count > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-6px',
                    right: '-10px',
                    background: 'var(--pr)',
                    color: '#fff',
                    borderRadius: '50%',
                    width: '16px',
                    height: '16px',
                    fontSize: '10px',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    border: '1.5px solid #fff',
                  }}
                >
                  {item.count}
                </span>
              )}
              {item.badge && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-8px',
                    right: '-16px',
                    background: '#C59B27',
                    color: '#fff',
                    fontSize: '8px',
                    fontWeight: 700,
                    padding: '1px 4px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    lineHeight: 1.2,
                  }}
                >
                  {item.badge}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: '11px',
                fontWeight: isActive ? 600 : 500,
                letterSpacing: '0.02em',
                lineHeight: 1,
              }}
            >
              {item.label}
            </span>
          </div>
        )

        if (item.external) {
          return (
            <a
              key={item.label}
              href={item.href}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={item.label}
              style={{ flex: 1, textDecoration: 'none' }}
            >
              {content}
            </a>
          )
        }

        return (
          <Link key={item.href} href={item.href} aria-label={item.label} style={{ flex: 1, textDecoration: 'none' }}>
            {content}
          </Link>
        )
      })}
    </nav>
  )
}

export default function MobileBottomNav() {
  return (
    <Suspense fallback={null}>
      <MobileBottomNavContent />
    </Suspense>
  )
}
