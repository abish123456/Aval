'use client'

import { useState } from 'react'

interface Promotion {
  id: number
  name: string
  type: 'combo' | 'coupon' | 'cart' | 'flash' | 'quantity' | 'product'
  discountType: 'percent' | 'fixed' | 'bundle'
  discountValue: number
  startDate: string
  endDate: string
  redemptions: number
  discountGiven: number
  status: 'active' | 'scheduled' | 'expired'
  code?: string
  combinesCoupons: boolean
  usageLimit: number
  eligibleProducts: string
}

const INITIAL_PROMOTIONS: Promotion[] = [
  {
    id: 1,
    name: 'WED10 — Wedding Season Coupon',
    type: 'coupon',
    discountType: 'percent',
    discountValue: 10,
    startDate: '2026-09-01T00:00',
    endDate: '2026-12-31T23:59',
    redemptions: 47,
    discountGiven: 12400,
    status: 'active',
    code: 'WED10',
    combinesCoupons: false,
    usageLimit: 200,
    eligibleProducts: 'All products',
  },
  {
    id: 2,
    name: 'AVALBRIDE — Bridal Bundle Offer',
    type: 'coupon',
    discountType: 'percent',
    discountValue: 15,
    startDate: '2026-10-01T00:00',
    endDate: '2026-12-31T23:59',
    redemptions: 22,
    discountGiven: 8900,
    status: 'active',
    code: 'AVALBRIDE',
    combinesCoupons: false,
    usageLimit: 100,
    eligibleProducts: 'Bridal Sets, Bangles',
  },
  {
    id: 3,
    name: 'Kundan + Pearl Combo Deal',
    type: 'combo',
    discountType: 'percent',
    discountValue: 12,
    startDate: '2026-10-15T00:00',
    endDate: '2026-11-15T23:59',
    redemptions: 9,
    discountGiven: 3200,
    status: 'active',
    code: '',
    combinesCoupons: true,
    usageLimit: 50,
    eligibleProducts: 'Kundan Bridal Bangle Set, Pearl Hair Clip',
  },
  {
    id: 4,
    name: 'Diwali Flash Sale',
    type: 'flash',
    discountType: 'percent',
    discountValue: 20,
    startDate: '2026-11-01T10:00',
    endDate: '2026-11-02T22:00',
    redemptions: 0,
    discountGiven: 0,
    status: 'scheduled',
    code: '',
    combinesCoupons: false,
    usageLimit: 30,
    eligibleProducts: 'All products',
  },
  {
    id: 5,
    name: 'Independence Day Sale',
    type: 'product',
    discountType: 'percent',
    discountValue: 15,
    startDate: '2026-08-14T00:00',
    endDate: '2026-08-15T23:59',
    redemptions: 18,
    discountGiven: 4800,
    status: 'expired',
    code: '',
    combinesCoupons: false,
    usageLimit: 100,
    eligibleProducts: 'All products',
  },
]

const FILTER_TABS = ['All', 'Product Offers', 'Combo Deals', 'Coupons', 'Cart Discounts', 'Flash Sales', 'Expired']

const STATUS_TAG: Record<string, string> = {
  active: 'tag tag-ok',
  scheduled: 'tag tag-warning',
  expired: 'tag',
}

const TYPE_LABELS: Record<string, string> = {
  combo: 'Combo Deal',
  coupon: 'Coupon',
  cart: 'Cart Discount',
  flash: 'Flash Sale',
  quantity: 'Quantity Discount',
  product: 'Product Offer',
}

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState<Promotion[]>(INITIAL_PROMOTIONS)
  const [activeTab, setActiveTab] = useState('All')
  const [showBuilder, setShowBuilder] = useState(false)
  const [toast, setToast] = useState('')

  // Builder form state
  const [form, setForm] = useState({
    name: '',
    type: 'coupon' as Promotion['type'],
    discountType: 'percent' as Promotion['discountType'],
    discountValue: 10,
    startDate: '',
    endDate: '',
    code: '',
    usageLimit: 100,
    eligibleProducts: '',
    combinesCoupons: false,
  })

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function filteredPromotions() {
    if (activeTab === 'All') return promotions
    if (activeTab === 'Expired') return promotions.filter((p) => p.status === 'expired')
    const map: Record<string, Promotion['type'][]> = {
      'Product Offers': ['product'],
      'Combo Deals': ['combo'],
      Coupons: ['coupon'],
      'Cart Discounts': ['cart'],
      'Flash Sales': ['flash'],
    }
    const types = map[activeTab] ?? []
    return promotions.filter((p) => types.includes(p.type) && p.status !== 'expired')
  }

  function handleSave() {
    if (!form.name.trim()) {
      showToast('Please enter a promotion name.')
      return
    }
    const newPromo: Promotion = {
      id: Date.now(),
      name: form.name,
      type: form.type,
      discountType: form.discountType,
      discountValue: form.discountValue,
      startDate: form.startDate,
      endDate: form.endDate,
      code: form.code,
      usageLimit: form.usageLimit,
      eligibleProducts: form.eligibleProducts,
      combinesCoupons: form.combinesCoupons,
      redemptions: 0,
      discountGiven: 0,
      status: 'scheduled',
    }
    setPromotions((prev) => [newPromo, ...prev])
    setShowBuilder(false)
    setForm({
      name: '',
      type: 'coupon',
      discountType: 'percent',
      discountValue: 10,
      startDate: '',
      endDate: '',
      code: '',
      usageLimit: 100,
      eligibleProducts: '',
      combinesCoupons: false,
    })
    showToast('✅ Promotion saved successfully!')
  }

  function handleDeactivate(id: number) {
    setPromotions((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status: 'expired' } : p))
    )
    showToast('Promotion deactivated.')
  }

  const visible = filteredPromotions()

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast */}
      {toast && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: '#1a1a1a',
            color: '#fff',
            padding: '12px 20px',
            borderRadius: '10px',
            fontSize: '14px',
            zIndex: 9999,
            borderLeft: '4px solid var(--ok)',
            boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
          }}
        >
          {toast}
        </div>
      )}

      {/* Page Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: '28px',
              fontWeight: 700,
              color: 'var(--dk)',
              margin: 0,
            }}
          >
            Offers &amp; Promotions
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--tx2)', margin: '4px 0 0' }}>
            Manage coupons, flash sales, combo deals, and discounts.
          </p>
        </div>
        <button
          className="btn btn-primary btn-sm"
          onClick={() => setShowBuilder((v) => !v)}
        >
          {showBuilder ? '✕ Close Builder' : '+ New Promotion'}
        </button>
      </div>

      {/* Stats Row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: '14px',
        }}
      >
        {[
          { label: 'Active', value: promotions.filter((p) => p.status === 'active').length, color: 'var(--ok)' },
          { label: 'Scheduled', value: promotions.filter((p) => p.status === 'scheduled').length, color: 'var(--wn)' },
          { label: 'Expired', value: promotions.filter((p) => p.status === 'expired').length, color: 'var(--tx2)' },
          {
            label: 'Total Redeemed',
            value: promotions.reduce((a, p) => a + p.redemptions, 0),
            color: 'var(--pr)',
          },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Main Grid: Table + Builder */}
      <div className="admin-two-col-grid">
        {/* Left: Table */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Filter Tabs */}
          <div style={{ overflowX: 'auto', paddingBottom: '4px' }}>
            <div style={{ display: 'flex', gap: '8px', minWidth: 'max-content' }}>
              {FILTER_TABS.map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  style={{
                    padding: '7px 14px',
                    borderRadius: '20px',
                    border: '1px solid var(--bd)',
                    background: activeTab === tab ? 'var(--pr)' : '#fff',
                    color: activeTab === tab ? '#fff' : 'var(--tx)',
                    fontSize: '12px',
                    fontWeight: activeTab === tab ? 600 : 400,
                    cursor: 'pointer',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          {/* Table */}
          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '520px' }}>
                <thead>
                  <tr style={{ background: '#F8F6F4', borderBottom: '1px solid var(--bd)' }}>
                    {['Name', 'Type', 'Dates', 'Redeemed', 'Discount Given', 'Status', 'Actions'].map((h) => (
                      <th
                        key={h}
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontSize: '11px',
                          fontWeight: 700,
                          letterSpacing: '0.08em',
                          textTransform: 'uppercase',
                          color: 'var(--tx2)',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.length === 0 && (
                    <tr>
                      <td colSpan={7} style={{ textAlign: 'center', padding: '40px', color: 'var(--tx2)', fontSize: '14px' }}>
                        No promotions in this category.
                      </td>
                    </tr>
                  )}
                  {visible.map((promo, i) => (
                    <tr
                      key={promo.id}
                      style={{ borderBottom: i < visible.length - 1 ? '1px solid var(--bd)' : 'none' }}
                    >
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--dk)' }}>{promo.name}</div>
                        {promo.code && (
                          <div
                            style={{
                              display: 'inline-block',
                              marginTop: '4px',
                              padding: '2px 8px',
                              background: '#f3e8d6',
                              color: '#7a4a00',
                              borderRadius: '4px',
                              fontSize: '11px',
                              fontWeight: 700,
                              letterSpacing: '0.1em',
                              fontFamily: 'monospace',
                            }}
                          >
                            {promo.code}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--tx2)', whiteSpace: 'nowrap' }}>
                        {TYPE_LABELS[promo.type]}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--tx2)', lineHeight: 1.6 }}>
                          <div>{promo.startDate.split('T')[0]}</div>
                          <div>→ {promo.endDate.split('T')[0]}</div>
                        </div>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', fontWeight: 600, color: 'var(--tx)' }}>
                        {promo.redemptions}
                        <span style={{ fontSize: '11px', color: 'var(--tx2)', fontWeight: 400 }}>
                          {' '}/{promo.usageLimit}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', fontSize: '13px', color: 'var(--tx)', whiteSpace: 'nowrap' }}>
                        ₹{promo.discountGiven.toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span className={STATUS_TAG[promo.status]}>
                          {promo.status.charAt(0).toUpperCase() + promo.status.slice(1)}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        {promo.status !== 'expired' && (
                          <button
                            className="btn btn-sm"
                            onClick={() => handleDeactivate(promo.id)}
                            style={{ fontSize: '11px', color: 'var(--er, #c0392b)' }}
                          >
                            Deactivate
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Promotion Builder */}
        {showBuilder && (
          <div className="card" style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '18px', alignSelf: 'start' }}>
            <h3
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: '18px',
                fontWeight: 700,
                color: 'var(--dk)',
                margin: 0,
                paddingBottom: '14px',
                borderBottom: '1px solid var(--bd)',
              }}
            >
              Promotion Builder
            </h3>

            {/* Name */}
            <div>
              <label className="input-label">Promotion Name *</label>
              <input
                className="input"
                placeholder="e.g. Summer Bridal Sale"
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                style={{ width: '100%' }}
              />
            </div>

            {/* Type + Discount type */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label className="input-label">Promotion Type</label>
                <select
                  className="input"
                  value={form.type}
                  onChange={(e) => setForm((f) => ({ ...f, type: e.target.value as Promotion['type'] }))}
                  style={{ width: '100%' }}
                >
                  <option value="product">Product Offer</option>
                  <option value="combo">Combo Deal</option>
                  <option value="coupon">Coupon</option>
                  <option value="cart">Cart Discount</option>
                  <option value="flash">Flash Sale</option>
                  <option value="quantity">Quantity Discount</option>
                </select>
              </div>
              <div>
                <label className="input-label">Discount Type</label>
                <select
                  className="input"
                  value={form.discountType}
                  onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value as Promotion['discountType'] }))}
                  style={{ width: '100%' }}
                >
                  <option value="percent">% Off</option>
                  <option value="fixed">Fixed Amount Off</option>
                  <option value="bundle">Fixed Bundle Price</option>
                </select>
              </div>
            </div>

            {/* Discount value + Coupon Code */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
              <div>
                <label className="input-label">
                  Discount Value {form.discountType === 'percent' ? '(%)' : '(₹)'}
                </label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.discountValue}
                  onChange={(e) => setForm((f) => ({ ...f, discountValue: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>
              {form.type === 'coupon' && (
                <div>
                  <label className="input-label">Coupon Code</label>
                  <input
                    className="input"
                    placeholder="e.g. BRIDE15"
                    value={form.code}
                    onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                    style={{ width: '100%', fontFamily: 'monospace', letterSpacing: '0.08em' }}
                  />
                </div>
              )}
            </div>

            {/* Start + End */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label className="input-label">Start Date &amp; Time</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="input-label">End Date &amp; Time</label>
                <input
                  className="input"
                  type="datetime-local"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Eligible products + Usage limit */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '12px' }}>
              <div>
                <label className="input-label">Eligible Products</label>
                <input
                  className="input"
                  placeholder="All products / Bangles, Maangtika…"
                  value={form.eligibleProducts}
                  onChange={(e) => setForm((f) => ({ ...f, eligibleProducts: e.target.value }))}
                  style={{ width: '100%' }}
                />
              </div>
              <div>
                <label className="input-label">Usage Limit</label>
                <input
                  className="input"
                  type="number"
                  min={1}
                  value={form.usageLimit}
                  onChange={(e) => setForm((f) => ({ ...f, usageLimit: Number(e.target.value) }))}
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            {/* Combine with coupons */}
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                cursor: 'pointer',
                fontSize: '13px',
                color: 'var(--tx)',
              }}
            >
              <input
                type="checkbox"
                checked={form.combinesCoupons}
                onChange={(e) => setForm((f) => ({ ...f, combinesCoupons: e.target.checked }))}
                style={{ width: '16px', height: '16px', accentColor: 'var(--pr)', cursor: 'pointer' }}
              />
              Can combine with other coupons
            </label>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', paddingTop: '6px', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={handleSave} style={{ flex: 1, justifyContent: 'center', minWidth: '120px' }}>
                Save Promotion
              </button>
              <button
                className="btn btn-outline"
                onClick={() => showToast('Preview mode coming soon.')}
                style={{ flex: 1, justifyContent: 'center', minWidth: '100px' }}
              >
                Preview
              </button>
            </div>
          </div>
        )}

        {/* Show hint when builder closed */}
        {!showBuilder && (
          <div
            className="card"
            style={{
              padding: '36px',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
              textAlign: 'center',
              alignSelf: 'start',
              background: 'repeating-linear-gradient(45deg, transparent, transparent 8px, rgba(235,211,207,0.12) 8px, rgba(235,211,207,0.12) 16px)',
            }}
          >
            <div style={{ fontSize: '36px' }}>🎁</div>
            <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--dk)' }}>Promotion Builder</div>
            <div style={{ fontSize: '13px', color: 'var(--tx2)', maxWidth: '200px' }}>
              Click &ldquo;New Promotion&rdquo; to create a coupon, combo deal, or flash sale.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

