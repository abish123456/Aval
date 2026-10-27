'use client'

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
              <img
                src="/logo.png"
                alt="AVAL"
                style={{ height: '40px', width: 'auto', background: '#fff', borderRadius: '4px', padding: '2px' }}
              />
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', fontWeight: 700, letterSpacing: '0.1em', color: '#EBD3CF' }}>
                AVAL
              </span>
            </div>
            <p className="footer-desc">
              Handcrafted bridal accessories, made with love in Kanyakumari. Each bangle set and hair ornament is a celebration of South Indian heritage and personal love stories.
            </p>
            <div style={{ marginTop: '20px', display: 'flex', gap: '16px' }}>
              <a
                href="https://instagram.com/aval_store_"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                style={{ color: 'var(--bl)', opacity: 0.8, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
                <span>@aval_store_</span>
              </a>
            </div>
          </div>

          {/* Shop */}
          <div className="footer-col">
            <h4>Shop</h4>
            <ul>
              <li><Link href="/shop">All Products</Link></li>
              <li><Link href="/category/bridal-bangles">Bridal Bangles</Link></li>
              <li><Link href="/category/hair-clips">Hair Accessories</Link></li>
              <li><Link href="/category/customised">Customised Names</Link></li>
              <li><Link href="/category/bridesmaid">Bridesmaid Gifts</Link></li>
              <li><Link href="/offers">Combo Deals</Link></li>
            </ul>
          </div>

          {/* Help */}
          <div className="footer-col">
            <h4>Help &amp; Orders</h4>
            <ul>
              <li><Link href="/faq">FAQ</Link></li>
              <li><Link href="/shipping">Shipping &amp; Returns</Link></li>
              <li><Link href="/custom-order">Custom Bridal Order</Link></li>
              <li><Link href="/track-order">Track Your Order</Link></li>
              <li><Link href="/contact">Contact &amp; WhatsApp</Link></li>
            </ul>
          </div>

          {/* Info */}
          <div className="footer-col">
            <h4>Kanyakumari Workshop</h4>
            <ul>
              <li><Link href="/about">About AVAL Studio</Link></li>
              <li><Link href="/custom-order">Bespoke Bridal Design</Link></li>
              <li><Link href="/shipping">Express Delivery Terms</Link></li>
              <li><span style={{ fontSize: '12px', color: 'rgba(235,211,207,0.6)' }}>Kanyakumari, Tamil Nadu</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 AVAL Store. All rights reserved. Handcrafted with love in Kanyakumari.</p>
          <p>Razorpay Secured 256-Bit SSL Payments</p>
        </div>
      </div>
    </footer>
  )
}
