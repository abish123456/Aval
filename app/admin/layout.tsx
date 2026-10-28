'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/custom-orders', label: 'Custom Requests', icon: '✍️' },
  { href: '/admin/products', label: 'Products', icon: '💎' },
  { href: '/admin/categories', label: 'Categories', icon: '🏷️' },
  { href: '/admin/inventory', label: 'Inventory', icon: '📋' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/promotions', label: 'Promotions', icon: '🎁' },
  { href: '/admin/reviews', label: 'Reviews', icon: '⭐' },
  { href: '/admin/reports', label: 'Reports', icon: '📈' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Don't render admin chrome on login screen
  if (pathname === '/admin/login') {
    return <>{children}</>
  }

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F6F4' }}>
      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(58,21,32,0.5)',
            backdropFilter: 'blur(3px)',
            zIndex: 999,
          }}
        />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        {/* Brand & Mobile Close Button */}
        <div
          style={{
            padding: '20px 24px',
            borderBottom: '1px solid rgba(255,255,255,0.1)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Link
            href="/admin"
            onClick={() => setSidebarOpen(false)}
            style={{ textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}
          >
            <img
              src="/logo.png"
              alt="AVAL"
              style={{ height: '40px', width: 'auto', background: '#fff', borderRadius: '4px', padding: '2px' }}
            />
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, letterSpacing: '0.1em', color: '#EBD3CF' }}>
                AVAL
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>
                Kanyakumari Studio
              </div>
            </div>
          </Link>

          {/* Close button for mobile */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="mobile-admin-menu-btn"
            style={{
              background: 'none',
              border: 'none',
              color: '#fff',
              fontSize: '20px',
              padding: '6px',
              cursor: 'pointer',
            }}
            aria-label="Close sidebar"
          >
            ✕
          </button>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px', overflowY: 'auto' }}>
          {ADMIN_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setSidebarOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '10px 16px',
                  borderRadius: '8px',
                  color: isActive ? '#fff' : 'rgba(255,255,255,0.7)',
                  background: isActive ? 'var(--pr, #7A1026)' : 'transparent',
                  fontWeight: isActive ? 600 : 400,
                  fontSize: '14px',
                  textDecoration: 'none',
                  transition: 'all 0.15s ease',
                }}
              >
                <span style={{ fontSize: '16px' }}>{link.icon}</span>
                <span>{link.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* Bottom Store Link & User */}
        <div style={{ padding: '20px', borderTop: '1px solid rgba(255,255,255,0.1)', display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Link
            href="/"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              fontSize: '13px',
              color: '#EBD3CF',
              textDecoration: 'none',
              padding: '8px 12px',
              borderRadius: '6px',
              background: 'rgba(255,255,255,0.06)',
            }}
          >
            <span>🛍️</span>
            <span>View Live Storefront</span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', paddingTop: '4px' }}>
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: 'var(--pr)',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '13px',
                fontWeight: 600,
              }}
            >
              AS
            </div>
            <div style={{ fontSize: '12px' }}>
              <div style={{ fontWeight: 600, color: '#fff' }}>Abishek / Admin</div>
              <div style={{ opacity: 0.6, fontSize: '11px' }}>Kanyakumari Studio</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Top Header */}
        <header
          className="admin-top-header"
          style={{
            height: '64px',
            background: '#fff',
            borderBottom: '1px solid #EBE4E0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 32px',
            position: 'sticky',
            top: 0,
            zIndex: 30,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Hamburger Button for Mobile Admin */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="mobile-admin-menu-btn"
              style={{
                background: 'none',
                border: 'none',
                padding: '8px',
                cursor: 'pointer',
                color: 'var(--dk)',
                display: 'none',
              }}
              aria-label="Open navigation menu"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="3" y1="12" x2="21" y2="12" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <line x1="3" y1="18" x2="21" y2="18" />
              </svg>
            </button>

            <span style={{ fontSize: '12px', background: '#dcefe1', color: 'var(--ok)', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
              ● Live Store
            </span>
            <span style={{ fontSize: '13px', color: 'var(--tx2)' }} className="desktop-only-text">
              Kanyakumari Fulfilment Hub
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <Link
              href="/admin/orders"
              style={{
                position: 'relative',
                textDecoration: 'none',
                color: 'var(--tx)',
                display: 'flex',
                alignItems: 'center',
                fontSize: '13px',
                fontWeight: 500,
              }}
            >
              <span>Pending</span>
              <span
                style={{
                  marginLeft: '6px',
                  background: 'var(--pr)',
                  color: '#fff',
                  borderRadius: '10px',
                  padding: '1px 7px',
                  fontSize: '11px',
                  fontWeight: 600,
                }}
              >
                2
              </span>
            </Link>
          </div>
        </header>

        {/* Content body */}
        <main className="admin-main-content" style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
