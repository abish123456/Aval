'use client'

import React, { useEffect, useState } from 'react'
import { PageHeader, Notice, useAdminData, useFlash, FlashMessage, adminRequest } from '../_components/ui'

interface FormState {
  storeName: string
  contactEmail: string
  whatsapp: string
  phone: string
  address: string
  freeShipping: string
  shippingFee: string
}

const labelStyle: React.CSSProperties = { fontSize: '13px', fontWeight: 600, color: 'var(--dk)', display: 'block', marginBottom: '6px' }

/** Show stored digits as a plain 10-digit number for editing */
const tenDigits = (v?: string) => (v ?? '').replace(/\D/g, '').slice(-10)

export default function AdminSettingsPage() {
  const { data, error, loading } = useAdminData<Record<string, string>>('/api/admin/settings')
  const [form, setForm] = useState<FormState | null>(null)
  const [saving, setSaving] = useState(false)
  const [flash, showFlash, clearFlash] = useFlash()

  // Fill the form once the saved settings arrive (defaults match the storefront)
  const loaded = data !== null
  useEffect(() => {
    if (!loaded || form) return
    const m = data ?? {}
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setForm({
      storeName: m.store_name ?? 'AVAL Store',
      contactEmail: m.contact_email ?? 'contact@avalstore.com',
      whatsapp: tenDigits(m.whatsapp_number) || '9840212345',
      phone: tenDigits(m.contact_phone),
      address: m.workshop_address ?? '',
      freeShipping: String(Math.round(Number(m.free_shipping_threshold_paise ?? 150000) / 100)),
      shippingFee: String(Math.round(Number(m.shipping_flat_fee_paise ?? 9900) / 100)),
    })
  }, [loaded, data, form])

  async function save(e: React.FormEvent) {
    e.preventDefault()
    if (!form) return
    const free = Number(form.freeShipping)
    const fee = Number(form.shippingFee)
    if (!Number.isFinite(free) || free < 0 || !Number.isFinite(fee) || fee < 0) {
      return showFlash('error', 'Shipping amounts must be 0 or more.')
    }
    setSaving(true)
    const r = await adminRequest('/api/admin/settings', 'POST', {
      store_name: form.storeName,
      contact_email: form.contactEmail,
      whatsapp_number: form.whatsapp,
      contact_phone: form.phone,
      workshop_address: form.address,
      free_shipping_threshold_paise: Math.round(free * 100),
      shipping_flat_fee_paise: Math.round(fee * 100),
    })
    setSaving(false)
    if (!r.ok) return showFlash('error', r.error ?? 'Settings not saved.')
    showFlash('ok', 'Settings saved. The store uses them right away.')
  }

  if (error) return <Notice kind="error">{error}</Notice>
  if (loading || !form) return <Notice>Loading settings…</Notice>

  const set = <K extends keyof FormState>(k: K, v: string) => setForm({ ...form, [k]: v })

  return (
    <div style={{ maxWidth: '760px' }}>
      <PageHeader title="Settings" subtitle="Contact details and shipping rules used across the storefront and checkout." />

      <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <section className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', margin: 0 }}>Store details</h2>
          <div>
            <label htmlFor="st-name" style={labelStyle}>Store name</label>
            <input id="st-name" className="input" value={form.storeName} onChange={(e) => set('storeName', e.target.value)} required />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label htmlFor="st-wa" style={labelStyle}>WhatsApp number</label>
              <input id="st-wa" className="input" type="tel" inputMode="numeric" value={form.whatsapp} onChange={(e) => set('whatsapp', e.target.value)} placeholder="9840212345" required />
              <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '4px' }}>Every “Chat on WhatsApp” button in the store opens this number.</div>
            </div>
            <div>
              <label htmlFor="st-phone" style={labelStyle}>Phone for calls (optional)</label>
              <input id="st-phone" className="input" type="tel" inputMode="numeric" value={form.phone} onChange={(e) => set('phone', e.target.value)} placeholder="Same as WhatsApp" />
            </div>
          </div>
          <div>
            <label htmlFor="st-email" style={labelStyle}>Contact email</label>
            <input id="st-email" className="input" type="email" value={form.contactEmail} onChange={(e) => set('contactEmail', e.target.value)} required />
          </div>
          <div>
            <label htmlFor="st-address" style={labelStyle}>Workshop address</label>
            <textarea id="st-address" className="input" rows={2} value={form.address} onChange={(e) => set('address', e.target.value)} />
          </div>
        </section>

        <section className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', margin: 0 }}>Shipping</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
            <div>
              <label htmlFor="st-free" style={labelStyle}>Free shipping from (₹)</label>
              <input id="st-free" className="input" type="number" min="0" step="1" value={form.freeShipping} onChange={(e) => set('freeShipping', e.target.value)} />
              <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '4px' }}>Order value after coupons. 0 = never free.</div>
            </div>
            <div>
              <label htmlFor="st-fee" style={labelStyle}>Shipping fee below that (₹)</label>
              <input id="st-fee" className="input" type="number" min="0" step="1" value={form.shippingFee} onChange={(e) => set('shippingFee', e.target.value)} />
            </div>
          </div>
        </section>

        <p style={{ fontSize: '12px', color: 'var(--tx2)', margin: 0 }}>
          Razorpay keys are kept in the server’s environment settings for security and are not edited here.
        </p>

        <button type="submit" className="btn btn-primary" disabled={saving} style={{ alignSelf: 'flex-start', padding: '0 28px', height: '44px' }}>
          {saving ? 'Saving…' : 'Save settings'}
        </button>
      </form>

      <FlashMessage flash={flash} onClose={clearFlash} />
    </div>
  )
}
