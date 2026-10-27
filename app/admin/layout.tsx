'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useState } from 'react'

const ADMIN_LINKS = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/orders', label: 'Orders', icon: '📦' },
  { href: '/admin/products', label: 'Products', icon: '💎' },
  { href: '/admin/inventory', label: 'Inventory', icon: '📋' },
  { href: '/admin/customers', label: 'Customers', icon: '👥' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
]

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#F8F6F4' }}>
      {/* Sidebar */}
      <aside
        style={{
          width: '260px',
          background: 'var(--dk, #3A1520)',
          color: '#fff',
          display: 'flex',
          flexDirection: 'column',
          borderRight: '1px solid rgba(255,255,255,0.08)',
          position: 'sticky',
          top: 0,
          height: '100vh',
          zIndex: 40,
        }}
      >
        {/* Brand */}
        <div style={{ padding: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
          <Link href="/admin" style={{ textDecoration: 'none', color: '#fff', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src="/logo.png"
              alt="AVAL"
              style={{ height: '42px', width: 'auto', background: '#fff', borderRadius: '4px', padding: '2px' }}
            />
            <div>
              <div style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, letterSpacing: '0.1em', color: '#EBD3CF' }}>
                AVAL
              </div>
              <div style={{ fontSize: '9px', letterSpacing: '0.2em', textTransform: 'uppercase', opacity: 0.7 }}>
                Kanyakumari Workshop
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ padding: '20px 14px', flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {ADMIN_LINKS.map((link) => {
            const isActive = pathname === link.href
            return (
              <Link
                key={link.href}
                href={link.href}
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
            <span style={{ fontSize: '12px', background: '#dcefe1', color: 'var(--ok)', padding: '3px 10px', borderRadius: '12px', fontWeight: 600 }}>
              ● Live Store Online
            </span>
            <span style={{ fontSize: '13px', color: 'var(--tx2)' }}>
              Kanyakumari Fulfilment Hub
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
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
              <span>Pending Orders</span>
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
        <main style={{ padding: '32px', flex: 1, overflowY: 'auto' }}>
          {children}
        </main>
      </div>
    </div>
  )
}
