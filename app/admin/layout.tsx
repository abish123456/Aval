'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

// SVG icon components — professional, no emoji
function IconDashboard() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
      <rect x="3" y="14" width="7" height="7" /><rect x="14" y="14" width="7" height="7" />
    </svg>
  )
}
function IconOrders() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
      <rect x="9" y="3" width="6" height="4" rx="1" />
      <line x1="9" y1="12" x2="15" y2="12" /><line x1="9" y1="16" x2="13" y2="16" />
    </svg>
  )
}
function IconCustom() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  )
}
function IconProducts() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
      <line x1="7" y1="7" x2="7.01" y2="7" />
    </svg>
  )
}
function IconCategories() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="8" y1="6" x2="21" y2="6" /><line x1="8" y1="12" x2="21" y2="12" /><line x1="8" y1="18" x2="21" y2="18" />
      <line x1="3" y1="6" x2="3.01" y2="6" /><line x1="3" y1="12" x2="3.01" y2="12" /><line x1="3" y1="18" x2="3.01" y2="18" />
    </svg>
  )
}
function IconInventory() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}
function IconCustomers() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  )
}
function IconPromotions() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  )
}
function IconReviews() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function IconReports() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" />
      <line x1="6" y1="20" x2="6" y2="14" /><line x1="2" y1="20" x2="22" y2="20" />
    </svg>
  )
}
function IconSettings() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  )
}
function IconStorefront() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  )
}

const ADMIN_LINKS = [
  { href: '/admin',              label: 'Dashboard',        Icon: IconDashboard },
  { href: '/admin/enquiries',   label: 'Bridal Orders',    Icon: IconOrders },
  { href: '/admin/custom-orders', label: 'Custom Requests', Icon: IconCustom },
  { href: '/admin/products',    label: 'Products',         Icon: IconProducts },
  { href: '/admin/categories',  label: 'Categories',       Icon: IconCategories },
  { href: '/admin/inventory',   label: 'Inventory',        Icon: IconInventory },
  { href: '/admin/customers',   label: 'Customers',        Icon: IconCustomers },
  { href: '/admin/promotions',  label: 'Promotions',       Icon: IconPromotions },
  { href: '/admin/reviews',     label: 'Reviews',          Icon: IconReviews },
  { href: '/admin/reports',     label: 'Reports',          Icon: IconReports },
  { href: '/admin/settings',    label: 'Settings',         Icon: IconSettings },
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
            const { Icon } = link
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
                <Icon />
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
            <IconStorefront />
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
              href="/admin/enquiries"
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
