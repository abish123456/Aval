'use client'

import React, { useState } from 'react'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

interface CustomRequest {
  id: string
  reference: string
  customerName: string
  email: string
  phone: string
  type: string
  eventDate: string
  requestedAt: string
  bangleSize: string
  colorTheme: string
  customInitials: string
  budget: string
  notes: string
  status: 'NEW' | 'QUOTE_SENT' | 'ACCEPTED' | 'IN_PRODUCTION' | 'COMPLETED'
  quotePrice?: number
  quoteAdditional?: number
  productionDays?: number
  quoteExpiry?: string
  artisanNote?: string
}

const INITIAL_REQUESTS: CustomRequest[] = [
  {
    id: 'req-1',
    reference: 'CUST-7821',
    customerName: 'Priya Sundaram',
    email: 'priya.sundaram@gmail.com',
    phone: '+91 98402 12345',
    type: 'Bespoke Kundan Bangle Set',
    eventDate: '2026-11-18',
    requestedAt: '24 Oct 2026',
    bangleSize: '2.6',
    colorTheme: 'Crimson Red with Antique Gold',
    customInitials: 'Priya & Karthik • 18-11-2026',
    budget: '₹2,500 – ₹4,000',
    notes: 'Bride requests matching red silk thread to coordinate with her Muhurtham Kanjivaram saree border. Central kada needs 22k gold name lettering.',
    status: 'QUOTE_SENT',
    quotePrice: 2800,
    quoteAdditional: 300,
    productionDays: 6,
    quoteExpiry: '2026-11-05',
    artisanNote: 'Sourced premium crimson thread and 22k gold lettering foil. Ready to start upon bride confirmation.',
  },
  {
    id: 'req-2',
    reference: 'CUST-7822',
    customerName: 'Meenakshi Iyer',
    email: 'meenakshi.iyer@gmail.com',
    phone: '+91 94421 77610',
    type: 'Bridesmaid Favours (12 Sets)',
    eventDate: '2026-12-05',
    requestedAt: '26 Oct 2026',
    bangleSize: 'Assorted (4x 2.4, 6x 2.6, 2x 2.8)',
    colorTheme: 'Pastel Mint Green & Gold',
    customInitials: '#MeenaWedsSiddharth',
    budget: '₹8,000 – ₹12,000',
    notes: 'Bulk order for bride tribe. Each bangle pair should be packaged in individual gold potli bags with personalised thank-you tags.',
    status: 'NEW',
  },
  {
    id: 'req-3',
    reference: 'CUST-7640',
    customerName: 'Ananya Ramachandran',
    email: 'ananya.rc@outlook.com',
    phone: '+91 94431 88762',
    type: 'Jadabi Poola Jada Floral Hair Clips',
    eventDate: '2026-11-22',
    requestedAt: '19 Oct 2026',
    bangleSize: 'N/A',
    colorTheme: 'Fresh Jasmine Cream & Golden Zari',
    customInitials: 'N/A',
    budget: '₹1,500 – ₹2,500',
    notes: 'Full 9-piece poola jada floral hair extensions set with dangling mini pearls for classical Bharatanatyam and bridal reception styling.',
    status: 'IN_PRODUCTION',
    quotePrice: 1850,
    quoteAdditional: 0,
    productionDays: 5,
    quoteExpiry: '2026-10-30',
    artisanNote: 'Handcrafting by master artisan in Kanyakumari studio. Pearls assembled.',
  },
]

export default function AdminCustomOrdersPage() {
  const [requests, setRequests] = useState<CustomRequest[]>(INITIAL_REQUESTS)
  const [selectedReq, setSelectedReq] = useState<CustomRequest | null>(requests[0])
  const [filterStatus, setFilterStatus] = useState<string>('ALL')

  // Quote form state
  const [quotePrice, setQuotePrice] = useState<number>(2500)
  const [quoteAdditional, setQuoteAdditional] = useState<number>(300)
  const [productionDays, setProductionDays] = useState<number>(6)
  const [quoteExpiry, setQuoteExpiry] = useState<string>('2026-11-10')
  const [artisanNote, setArtisanNote] = useState<string>('')
  const [toastMessage, setToastMessage] = useState<string | null>(null)

  const showToast = (msg: string) => {
    setToastMessage(msg)
    setTimeout(() => setToastMessage(null), 3000)
  }

  const handleSelectReq = (req: CustomRequest) => {
    setSelectedReq(req)
    setQuotePrice(req.quotePrice || 2500)
    setQuoteAdditional(req.quoteAdditional || 0)
    setProductionDays(req.productionDays || 6)
    setQuoteExpiry(req.quoteExpiry || '2026-11-10')
    setArtisanNote(req.artisanNote || '')
  }

  const handleSendQuote = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedReq) return

    const totalQuotePaise = (quotePrice + quoteAdditional) * 100

    try {
      await fetch(`/api/admin/custom-orders/${selectedReq.id}/quote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          quotePricePaise: totalQuotePaise,
          quoteNote: artisanNote || 'Handcrafted bespoke quote prepared by AVAL artisans.',
          validDays: productionDays || 7,
        }),
      })
    } catch {
      // ignore
    }

    setRequests((prev) =>
      prev.map((r) =>
        r.id === selectedReq.id
          ? {
              ...r,
              status: 'QUOTE_SENT',
              quotePrice,
              quoteAdditional,
              productionDays,
              quoteExpiry,
              artisanNote,
            }
          : r
      )
    )

    setSelectedReq((prev) =>
      prev
        ? {
            ...prev,
            status: 'QUOTE_SENT',
            quotePrice,
            quoteAdditional,
            productionDays,
            quoteExpiry,
            artisanNote,
          }
        : null
    )

    showToast(`Bespoke quote sent to ${selectedReq.customerName} on WhatsApp & Email!`)
  }

  const handleStatusUpdate = (newStatus: CustomRequest['status']) => {
    if (!selectedReq) return
    setRequests((prev) =>
      prev.map((r) => (r.id === selectedReq.id ? { ...r, status: newStatus } : r))
    )
    setSelectedReq({ ...selectedReq, status: newStatus })
    showToast(`Status updated to ${newStatus}`)
  }

  const filteredRequests = requests.filter((r) => {
    if (filterStatus === 'ALL') return true
    return r.status === filterStatus
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Toast Notification */}
      {toastMessage && (
        <div
          style={{
            position: 'fixed',
            bottom: '24px',
            right: '24px',
            background: 'var(--dk)',
            color: '#fff',
            padding: '12px 20px',
            boxShadow: 'var(--shadow-lg)',
            zIndex: 1000,
            fontSize: '14px',
            borderLeft: '4px solid var(--ok)',
          }}
        >
          {toastMessage}
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', color: 'var(--dk)', margin: 0 }}>
            Custom Bridal Orders &amp; Quotes
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '14px', marginTop: '4px' }}>
            Review incoming bespoke bridal design requests, examine preferences, and send quotes to brides.
          </p>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {[
            { id: 'ALL', label: 'All Requests' },
            { id: 'NEW', label: 'New Requests' },
            { id: 'QUOTE_SENT', label: 'Quotes Sent' },
            { id: 'IN_PRODUCTION', label: 'In Production' },
            { id: 'COMPLETED', label: 'Completed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterStatus(tab.id)}
              style={{
                padding: '6px 14px',
                border: '1px solid var(--bd)',
                background: filterStatus === tab.id ? 'var(--pr)' : '#fff',
                color: filterStatus === tab.id ? '#fff' : 'var(--dk)',
                fontSize: '13px',
                fontWeight: filterStatus === tab.id ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Layout: Requests Table + Quote Detail Workstation */}
      <div className="admin-two-col-grid">
        {/* Left: Requests List Table */}
        <div className="card" style={{ padding: '20px', background: '#fff' }}>
          <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px' }}>
            Submitted Requests ({filteredRequests.length})
          </h2>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--bd)', color: 'var(--tx2)' }}>
                  <th style={{ padding: '10px' }}>Reference</th>
                  <th style={{ padding: '10px' }}>Customer</th>
                  <th style={{ padding: '10px' }}>Design Type</th>
                  <th style={{ padding: '10px' }}>Event Date</th>
                  <th style={{ padding: '10px' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const isSelected = selectedReq?.id === req.id
                  return (
                    <tr
                      key={req.id}
                      onClick={() => handleSelectReq(req)}
                      style={{
                        borderBottom: '1px solid #F0E8E6',
                        background: isSelected ? '#FAF2F0' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                    >
                      <td style={{ padding: '12px 10px', fontWeight: 700, color: 'var(--pr)' }}>
                        {req.reference}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        <div style={{ fontWeight: 600 }}>{req.customerName}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>{req.phone}</div>
                      </td>
                      <td style={{ padding: '12px 10px' }}>{req.type}</td>
                      <td style={{ padding: '12px 10px', whiteSpace: 'nowrap' }}>
                        {new Date(req.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </td>
                      <td style={{ padding: '12px 10px' }}>
                        {req.status === 'NEW' && <span className="tag tag-primary">New</span>}
                        {req.status === 'QUOTE_SENT' && <span className="tag tag-warning">Quote Sent</span>}
                        {req.status === 'IN_PRODUCTION' && <span className="tag tag-ok">Production</span>}
                        {req.status === 'COMPLETED' && <span className="tag tag-blush">Completed</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Selected Request Review & Quote Preparation Form */}
        {selectedReq ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Request Details Card */}
            <div className="card" style={{ padding: '24px', background: '#fff' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', fontWeight: 700, color: 'var(--pr)' }}>
                      {selectedReq.reference}
                    </span>
                    <span className="tag tag-blush">{selectedReq.status}</span>
                  </div>
                  <h3 style={{ fontSize: '16px', color: 'var(--dk)', marginTop: '4px' }}>
                    {selectedReq.type}
                  </h3>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>Target Date</div>
                  <div style={{ fontWeight: 600, color: 'var(--pr)' }}>
                    {new Date(selectedReq.eventDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
              </div>

              {/* Customer Requirements Summary */}
              <div style={{ background: '#FAF6F4', padding: '16px', border: '1px solid var(--bd)', marginBottom: '18px', fontSize: '13px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div><strong>Customer:</strong> {selectedReq.customerName} ({selectedReq.email} • {selectedReq.phone})</div>
                <div><strong>Bangle Size:</strong> {selectedReq.bangleSize}</div>
                <div><strong>Color Palette:</strong> {selectedReq.colorTheme}</div>
                <div><strong>Bespoke Lettering:</strong> &ldquo;{selectedReq.customInitials}&rdquo;</div>
                <div><strong>Customer Budget:</strong> {selectedReq.budget}</div>
                <div style={{ marginTop: '4px', paddingTop: '8px', borderTop: '1px dashed var(--bd)' }}>
                  <strong>Special Instructions:</strong><br />
                  <span style={{ color: 'var(--tx)', fontStyle: 'italic' }}>{selectedReq.notes}</span>
                </div>
              </div>

              {/* Status Action Buttons */}
              <div style={{ display: 'flex', gap: '10px', marginBottom: '18px', flexWrap: 'wrap' }}>
                {selectedReq.status !== 'IN_PRODUCTION' && (
                  <button
                    onClick={() => handleStatusUpdate('IN_PRODUCTION')}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '12px' }}
                  >
                    🛠️ Move to Production
                  </button>
                )}
                {selectedReq.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleStatusUpdate('COMPLETED')}
                    className="btn btn-sm btn-outline"
                    style={{ fontSize: '12px' }}
                  >
                    ✓ Mark as Completed
                  </button>
                )}
                <a
                  href={`https://wa.me/${selectedReq.phone.replace(/[^0-9]/g, '')}?text=Hi%20${encodeURIComponent(selectedReq.customerName)}%2C%20regarding%20your%20custom%20bridal%20order%20${selectedReq.reference}...`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-sm btn-outline"
                  style={{ fontSize: '12px', color: '#1d4a2b' }}
                >
                  💬 WhatsApp Bride
                </a>
              </div>

              {/* Prepare Quote Form */}
              <div style={{ borderTop: '2px solid var(--bd)', paddingTop: '18px' }}>
                <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '14px' }}>
                  Prepare Artisan Quote
                </h3>

                <form onSubmit={handleSendQuote} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    <label className="input-label">
                      <span>Base Custom Price (₹)</span>
                      <input
                        type="number"
                        className="input"
                        required
                        value={quotePrice}
                        onChange={(e) => setQuotePrice(Number(e.target.value))}
                      />
                    </label>

                    <label className="input-label">
                      <span>Additional Embellishment (₹)</span>
                      <input
                        type="number"
                        className="input"
                        value={quoteAdditional}
                        onChange={(e) => setQuoteAdditional(Number(e.target.value))}
                      />
                    </label>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px' }}>
                    <label className="input-label">
                      <span>Production Days</span>
                      <input
                        type="number"
                        className="input"
                        required
                        value={productionDays}
                        onChange={(e) => setProductionDays(Number(e.target.value))}
                      />
                    </label>

                    <label className="input-label">
                      <span>Quote Expiry Date</span>
                      <input
                        type="date"
                        className="input"
                        required
                        value={quoteExpiry}
                        onChange={(e) => setQuoteExpiry(e.target.value)}
                      />
                    </label>
                  </div>

                  <label className="input-label">
                    <span>Artisan Notes for Customer</span>
                    <textarea
                      className="input"
                      rows={3}
                      value={artisanNote}
                      onChange={(e) => setArtisanNote(e.target.value)}
                      placeholder="e.g. Sourced matching crimson silk thread and fine Kundan stones. Production begins upon acceptance."
                    />
                  </label>

                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', paddingTop: '12px', borderTop: '1px solid #F0E8E6' }}>
                    <div>
                      <span style={{ fontSize: '13px', color: 'var(--tx2)' }}>Total Quoted: </span>
                      <strong style={{ fontSize: '18px', color: 'var(--pr)' }}>{fmt(quotePrice + quoteAdditional)}</strong>
                    </div>

                    <button type="submit" className="btn btn-primary" style={{ padding: '10px 24px' }}>
                      Send Quote to Bride →
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '48px', textAlign: 'center', color: 'var(--tx2)' }}>
            Select a custom request to review details and prepare a quote.
          </div>
        )}
      </div>
    </div>
  )
}

