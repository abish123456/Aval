'use client'

import { useState } from 'react'

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState({
    storeName: 'AVAL Handcrafted Bridal Store',
    contactEmail: 'contact@avalstore.com',
    whatsappNumber: '+91 98402 12345',
    workshopHubAddress: 'Beach Road, Cape Town Centre, Kanyakumari, Tamil Nadu 629702',
    razorpayKeyId: 'rzp_live_AVAL98213894',
    enableCOD: true,
    codExtraFee: 50,
    freeShippingThreshold: 1499,
    standardShippingFee: 99,
  })

  const [saved, setSaved] = useState(false)

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault()
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  return (
    <div style={{ maxWidth: '800px' }}>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: 'var(--dk)', margin: 0 }}>
          Store Configuration & Settings
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '4px' }}>
          Payment gateways, shipping calculations, and Kanyakumari workshop contact details
        </p>
      </div>

      <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* General Store Info */}
        <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px' }}>
            Brand & Workshop Profile
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="input-label" style={{ fontSize: '13px' }}>
              Store Brand Name
              <input
                type="text"
                className="input"
                value={settings.storeName}
                onChange={(e) => setSettings({ ...settings, storeName: e.target.value })}
              />
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
              <label className="input-label" style={{ fontSize: '13px' }}>
                Customer Support Email
                <input
                  type="email"
                  className="input"
                  value={settings.contactEmail}
                  onChange={(e) => setSettings({ ...settings, contactEmail: e.target.value })}
                />
              </label>

              <label className="input-label" style={{ fontSize: '13px' }}>
                WhatsApp Bridal Support Line
                <input
                  type="text"
                  className="input"
                  value={settings.whatsappNumber}
                  onChange={(e) => setSettings({ ...settings, whatsappNumber: e.target.value })}
                />
              </label>
            </div>

            <label className="input-label" style={{ fontSize: '13px' }}>
              Workshop & Studio Address (Kanyakumari)
              <input
                type="text"
                className="input"
                value={settings.workshopHubAddress}
                onChange={(e) => setSettings({ ...settings, workshopHubAddress: e.target.value })}
              />
            </label>
          </div>
        </div>

        {/* Payment Gateways */}
        <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px' }}>
            Payment Gateways
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <label className="input-label" style={{ fontSize: '13px' }}>
              Razorpay Key ID (Live / Test)
              <input
                type="text"
                className="input"
                value={settings.razorpayKeyId}
                onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
              />
            </label>

            <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '13px', cursor: 'pointer', marginTop: '6px' }}>
              <input
                type="checkbox"
                checked={settings.enableCOD}
                onChange={(e) => setSettings({ ...settings, enableCOD: e.target.checked })}
              />
              Enable Cash on Delivery (COD) for verified pin codes
            </label>
          </div>
        </div>

        {/* Shipping Rates */}
        <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px' }}>
            Shipping Rules
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <label className="input-label" style={{ fontSize: '13px' }}>
              Free Shipping Threshold (₹)
              <input
                type="number"
                className="input"
                value={settings.freeShippingThreshold}
                onChange={(e) => setSettings({ ...settings, freeShippingThreshold: Number(e.target.value) })}
              />
            </label>

            <label className="input-label" style={{ fontSize: '13px' }}>
              Standard Shipping Fee (₹)
              <input
                type="number"
                className="input"
                value={settings.standardShippingFee}
                onChange={(e) => setSettings({ ...settings, standardShippingFee: Number(e.target.value) })}
              />
            </label>
          </div>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          style={{ height: '46px', fontSize: '15px', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
        >
          {saved ? '✓ Settings Saved Successfully!' : 'Save Store Changes'}
        </button>
      </form>
    </div>
  )
}
