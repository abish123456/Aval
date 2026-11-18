'use client'

import React, { useState, useEffect, useRef } from 'react'
import { useFlash, FlashMessage, adminRequest, STATUS_LABEL } from '../_components/ui'

type EnquiryStatus = 'ENQUIRY' | 'CONFIRMED' | 'MAKING' | 'DISPATCHED' | 'DELIVERED' | 'CANCELLED'

interface Message {
  id: string
  senderType: 'CUSTOMER' | 'ADMIN'
  body: string
  createdAt: string
}

interface Enquiry {
  id: string
  token: string
  customerName: string
  customerPhone: string
  customerWhatsapp: string
  totalPaise: number
  subtotalPaise: number
  discountPaise: number
  shippingPaise: number
  couponCode: string | null
  adminNotes: string | null
  status: EnquiryStatus
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  trackingNumber: string | null
  createdAt: string
  deliveryAddress: {
    street: string
    city: string
    state: string
    pincode: string
  }
  items: Array<{
    productName: string
    size: string
    qty: number
    unitPaise: number
    customName?: string
    weddingDate?: string
  }>
  rating: { stars: number } | null
  messages: Message[]
  _count: { messages: number }
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN', Number.isInteger(n) ? undefined : { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

// What the admin can do next from each status (mirrors the server rules)
const NEXT_STEPS: Record<EnquiryStatus, { to: EnquiryStatus; label: string; needsPaid?: boolean }[]> = {
  ENQUIRY: [],
  CONFIRMED: [{ to: 'MAKING', label: 'Start handcrafting', needsPaid: true }],
  MAKING: [],
  DISPATCHED: [{ to: 'DELIVERED', label: 'Mark delivered', needsPaid: true }],
  DELIVERED: [],
  CANCELLED: [],
}
const CANCELLABLE: EnquiryStatus[] = ['ENQUIRY', 'CONFIRMED', 'MAKING']

/** wa.me needs the country code; numbers are stored as 10 digits */
function whatsappLink(digits: string) {
  const d = digits.replace(/\D/g, '')
  return `https://wa.me/${d.length === 10 ? '91' + d : d}`
}

// Professional SVG Icons
function IconRefresh() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
      <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
    </svg>
  )
}
function IconCraft() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  )
}
function IconTruck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
      <circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" />
    </svg>
  )
}
function IconCheck() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
function IconChat() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconWhatsApp() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.299.045-.677.063-1.092-.069-.252-.08-.575-.187-.988-.365-1.739-.751-2.874-2.502-2.961-2.617-.087-.116-.708-.94-.708-1.793s.448-1.273.607-1.446c.159-.173.346-.217.462-.217l.332.007c.106.005.249-.04.39.299.144.347.491 1.2.534 1.287.043.087.072.188.014.304-.058.116-.087.188-.173.289l-.26.304c-.087.086-.177.18-.076.353.101.173.45 1.743 1.832 2.37.177.08.31.13.418.163.18.056.345.048.475.029.145-.022.448-.183.511-.36.063-.177.063-.328.044-.36-.019-.032-.072-.05-.15-.094z" />
    </svg>
  )
}

async function loadEnquiries(filter: string): Promise<Enquiry[] | null> {
  try {
    const url = filter === 'all' ? '/api/admin/enquiries' : `/api/admin/enquiries?status=${filter.toUpperCase()}`
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return data.data?.enquiries ?? []
  } catch {
    return null
  }
}

export default function AdminEnquiriesPage() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [selected, setSelected] = useState<Enquiry | null>(null)
  const [tracking, setTracking] = useState('')
  const [adminReply, setAdminReply] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [flash, showFlash, clearFlash] = useFlash()
  const [payMethod, setPayMethod] = useState<'UPI' | 'BANK_TRANSFER' | 'CASH'>('UPI')
  const [payRef, setPayRef] = useState('')
  const [confirmCancel, setConfirmCancel] = useState(false)
  const [copied, setCopied] = useState(false)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  function applyList(list: Enquiry[] | null) {
    setLoading(false)
    if (!list) return showFlash('error', 'Could not load orders. Check your connection and refresh.')
    setEnquiries(list)
    // Deep link from the dashboard: /admin/enquiries?token=…
    const wanted = new URLSearchParams(window.location.search).get('token')
    setSelected((prev) => {
      const key = prev?.token ?? wanted
      if (key) {
        const match = list.find((e) => e.token === key)
        if (match) return match
      }
      return list[0] ?? null
    })
  }

  const fetchEnquiries = () => loadEnquiries(filter).then(applyList)

  useEffect(() => {
    let cancelled = false
    loadEnquiries(filter).then((list) => {
      if (!cancelled) applyList(list)
    })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  // Real-time chat streaming using SSE
  useEffect(() => {
    if (!selected?.token) return

    const eventSource = new EventSource(`/api/enquiries/${selected.token}/messages/stream`)

    eventSource.addEventListener('message', (event) => {
      try {
        const msg: Message = JSON.parse(event.data)
        setSelected((prev) => {
          if (!prev || prev.token !== selected.token) return prev
          if (prev.messages.some((m) => m.id === msg.id)) return prev
          return {
            ...prev,
            messages: [...prev.messages, msg],
            _count: { messages: prev._count.messages + 1 },
          }
        })
      } catch {
        // silent
      }
    })

    return () => {
      eventSource.close()
    }
  }, [selected?.token])

  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [selected?.messages])

  async function updateStatus(token: string, status: EnquiryStatus) {
    setActionLoading(true)
    const r = await adminRequest(`/api/admin/enquiries/${token}/status`, 'PATCH', { status })
    setActionLoading(false)
    setConfirmCancel(false)
    if (!r.ok) return showFlash('error', r.error ?? 'Could not update the order.')
    showFlash('ok', `Order marked ${STATUS_LABEL[status]?.toLowerCase() ?? status}.`)
    await fetchEnquiries()
  }

  async function markPaid(token: string) {
    setActionLoading(true)
    const r = await adminRequest(`/api/admin/enquiries/${token}/payment`, 'PATCH', { method: payMethod, reference: payRef.trim() || undefined })
    setActionLoading(false)
    if (!r.ok) return showFlash('error', r.error ?? 'Could not record the payment.')
    setPayRef('')
    showFlash('ok', 'Payment recorded. The order is confirmed.')
    await fetchEnquiries()
  }

  async function addTracking(token: string) {
    if (!tracking.trim()) return
    setActionLoading(true)
    const r = await adminRequest(`/api/admin/enquiries/${token}/tracking`, 'PATCH', { trackingNumber: tracking.trim() })
    setActionLoading(false)
    if (!r.ok) return showFlash('error', r.error ?? 'Could not save the tracking number.')
    setTracking('')
    showFlash('ok', 'Tracking saved. The order is marked dispatched.')
    await fetchEnquiries()
  }

  async function sendAdminMessage(token: string) {
    if (!adminReply.trim()) return
    const bodyText = adminReply.trim()
    setActionLoading(true)
    const r = await adminRequest<Message>(`/api/admin/enquiries/${token}/messages`, 'POST', { body: bodyText })
    setActionLoading(false)
    if (!r.ok || !r.data) return showFlash('error', r.error ?? 'Message not sent.')
    setAdminReply('')
    const newMsg = r.data
    setSelected((prev) => {
      if (!prev || prev.token !== token) return prev
      if (prev.messages.some((m) => m.id === newMsg.id)) return prev
      return { ...prev, messages: [...prev.messages, newMsg] }
    })
  }

  async function copyLink(token: string) {
    const url = `${window.location.origin}/o/${token}`
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      showFlash('error', `Copy failed. The link is ${url}`)
    }
  }

  const pendingPayment = enquiries.filter((e) => e.paymentStatus !== 'PAID' && e.status !== 'CANCELLED')
  const inProduction = enquiries.filter((e) => ['CONFIRMED', 'MAKING'].includes(e.status) && e.paymentStatus === 'PAID')
  const dispatched = enquiries.filter((e) => e.status === 'DISPATCHED')
  const delivered = enquiries.filter((e) => e.status === 'DELIVERED')

  return (
    <div>
      {/* Top Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '28px', color: 'var(--dk)', margin: 0, fontWeight: 600 }}>
            Bridal Enquiries &amp; Orders
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '4px' }}>
            Private link orders, custom saree matching chats, and courier dispatch management.
          </p>
        </div>

        <button
          onClick={fetchEnquiries}
          className="btn btn-secondary"
          style={{ padding: '8px 18px', fontSize: '13px', display: 'flex', alignItems: 'center', gap: '8px' }}
        >
          <IconRefresh />
          Refresh
        </button>
      </div>

      {/* Metric Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Pending Payment', val: pendingPayment.length, color: 'var(--wn)', bg: 'var(--wn-bg)', Icon: IconClock },
          { label: 'In Handcrafting', val: inProduction.length, color: 'var(--pr)', bg: 'var(--bl2)', Icon: IconCraft },
          { label: 'In Transit', val: dispatched.length, color: '#1d4ed8', bg: '#dbeafe', Icon: IconTruck },
          { label: 'Delivered', val: delivered.length, color: 'var(--ok)', bg: 'var(--ok-bg)', Icon: IconCheck },
        ].map((c) => (
          <div key={c.label} className="card" style={{ padding: '18px 20px', background: '#fff', border: '1px solid var(--bd)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{c.label}</span>
              <span style={{ color: c.color }}><c.Icon /></span>
            </div>
            <div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, color: c.color, marginTop: '8px' }}>
              {c.val}
            </div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--bd)', paddingBottom: '12px', overflowX: 'auto' }}>
        {['all', 'enquiry', 'confirmed', 'making', 'dispatched', 'delivered', 'cancelled'].map((f) => (
          <button
            key={f}
            onClick={() => { if (f !== filter) { setLoading(true); setFilter(f) } }}
            style={{
              padding: '6px 14px',
              borderRadius: '4px',
              border: 'none',
              background: filter === f ? 'var(--pr)' : 'transparent',
              color: filter === f ? '#fff' : 'var(--tx)',
              fontWeight: filter === f ? 600 : 400,
              fontSize: '13px',
              cursor: 'pointer',
              textTransform: 'capitalize',
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Master Detail Split */}
      <div className="admin-two-col-grid">
        {/* Left: Orders Table */}
        <div className="card" style={{ padding: 0, background: '#fff', border: '1px solid var(--bd)', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--tx2)' }}>Loading orders...</div>
          ) : enquiries.length === 0 ? (
            <div style={{ padding: '40px', textAlign: 'center', color: 'var(--tx2)' }}>
              No orders found in this view.
            </div>
          ) : (
            <div className="table-wrap" style={{ border: 'none' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--bd)', color: 'var(--tx2)', textTransform: 'uppercase', fontSize: '11px', letterSpacing: '0.05em' }}>
                    <th style={{ padding: '12px 16px' }}>Ref / Customer</th>
                    <th style={{ padding: '12px 16px' }}>Items</th>
                    <th style={{ padding: '12px 16px' }}>Amount</th>
                    <th style={{ padding: '12px 16px' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {enquiries.map((enq) => {
                    const isSelected = selected?.token === enq.token
                    return (
                      <tr
                        key={enq.id}
                        onClick={() => { setSelected(enq); setConfirmCancel(false); setTracking(''); setPayRef('') }}
                        style={{
                          borderBottom: '1px solid #f0e8e6',
                          background: isSelected ? 'var(--bl2)' : 'transparent',
                          cursor: 'pointer',
                          transition: 'background 0.15s',
                        }}
                      >
                        <td style={{ padding: '14px 16px' }}>
                          <div style={{ fontWeight: 600, color: 'var(--dk)', fontSize: '14px' }}>
                            {enq.customerName}
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--tx2)', fontFamily: 'monospace' }}>
                            #{enq.token} • {enq.customerPhone}
                          </div>
                          {enq._count.messages > 0 && (
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', marginTop: '4px', fontSize: '11px', background: 'var(--pr)', color: '#fff', padding: '2px 8px', borderRadius: '10px' }}>
                              <IconChat /> {enq._count.messages}
                            </span>
                          )}
                        </td>
                        <td style={{ padding: '14px 16px', color: 'var(--tx2)', fontSize: '12px' }}>
                          {enq.items[0]?.productName}
                          {enq.items.length > 1 && ` +${enq.items.length - 1} more`}
                        </td>
                        <td style={{ padding: '14px 16px', fontWeight: 600, color: 'var(--pr)' }}>
                          {fmt(enq.totalPaise / 100)}
                        </td>
                        <td style={{ padding: '14px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              padding: '4px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                              background:
                                enq.status === 'CONFIRMED' || enq.status === 'DELIVERED'
                                  ? 'var(--ok-bg)'
                                  : enq.status === 'CANCELLED'
                                  ? 'var(--er-bg)'
                                  : enq.status === 'MAKING'
                                  ? 'var(--bl2)'
                                  : enq.status === 'DISPATCHED'
                                  ? '#dbeafe'
                                  : 'var(--wn-bg)',
                              color:
                                enq.status === 'CONFIRMED' || enq.status === 'DELIVERED'
                                  ? 'var(--ok)'
                                  : enq.status === 'CANCELLED'
                                  ? 'var(--er)'
                                  : enq.status === 'MAKING'
                                  ? 'var(--pr)'
                                  : enq.status === 'DISPATCHED'
                                  ? '#1d4ed8'
                                  : 'var(--wn)',
                            }}
                          >
                            {STATUS_LABEL[enq.status] ?? enq.status}
                          </span>
                          {enq.paymentStatus !== 'PAID' && enq.status !== 'CANCELLED' && (
                            <div style={{ fontSize: '11px', color: 'var(--wn)', marginTop: '4px' }}>Unpaid</div>
                          )}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right: Selected Enquiry Detail & Live Chat */}
        {selected ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Customer & Order Card */}
            <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid var(--bd)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--bd)', paddingBottom: '14px', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '22px', color: 'var(--dk)', margin: 0 }}>
                    {selected.customerName}
                  </h3>
                  <div style={{ fontSize: '13px', color: 'var(--tx2)', marginTop: '2px' }}>
                    Phone: <strong>{selected.customerPhone}</strong>
                  </div>
                </div>

                <a
                  href={whatsappLink(selected.customerWhatsapp)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary"
                  style={{
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    padding: '6px 14px',
                    fontSize: '12px',
                    fontWeight: 600,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <IconWhatsApp /> Open WhatsApp
                </a>
              </div>

              {/* Order summary */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', fontSize: '13px', marginBottom: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', flexWrap: 'wrap' }}>
                  <span>
                    Placed {new Date(selected.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' })}
                  </span>
                  <span className={`tag ${selected.paymentStatus === 'PAID' ? 'tag-ok' : 'tag-warning'}`}>
                    {selected.paymentStatus === 'PAID' ? 'Paid' : 'Unpaid'}
                  </span>
                </div>

                <div style={{ border: '1px solid var(--bd)', borderRadius: '4px' }}>
                  {selected.items.map((it, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', padding: '10px 12px', borderBottom: i < selected.items.length - 1 ? '1px solid #f0e8e6' : 'none' }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontWeight: 600, color: 'var(--dk)' }}>{it.productName.replace(/ \(Custom: .*\)$/, '')}</div>
                        <div style={{ color: 'var(--tx2)', fontSize: '12px' }}>
                          {it.size ? `Size ${it.size} · ` : ''}Qty {it.qty} × {fmt(it.unitPaise / 100)}
                        </div>
                        {it.customName && (
                          <div style={{ fontSize: '12px', color: 'var(--pr)', marginTop: '2px' }}>
                            Personalise: “{it.customName}”{it.weddingDate ? ` · ${it.weddingDate}` : ''}
                          </div>
                        )}
                      </div>
                      <div style={{ fontWeight: 600, whiteSpace: 'nowrap' }}>{fmt((it.unitPaise * it.qty) / 100)}</div>
                    </div>
                  ))}
                  <div style={{ padding: '10px 12px', background: 'var(--bg)', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Subtotal</span><span>{fmt((selected.subtotalPaise || selected.totalPaise) / 100)}</span></div>
                    {selected.discountPaise > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--ok)' }}><span>Coupon {selected.couponCode}</span><span>− {fmt(selected.discountPaise / 100)}</span></div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}><span>Shipping</span><span>{selected.shippingPaise > 0 ? fmt(selected.shippingPaise / 100) : 'Free'}</span></div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, color: 'var(--pr)' }}><span>Total</span><span>{fmt(selected.totalPaise / 100)}</span></div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx2)', marginBottom: '2px' }}>Ship to</div>
                  <div style={{ lineHeight: 1.5 }}>
                    {selected.customerName}<br />
                    {selected.deliveryAddress.street}<br />
                    {selected.deliveryAddress.city}, {selected.deliveryAddress.state} {selected.deliveryAddress.pincode}<br />
                    Phone {selected.customerPhone}{selected.customerWhatsapp !== selected.customerPhone ? ` · WhatsApp ${selected.customerWhatsapp}` : ''}
                  </div>
                </div>

                {selected.trackingNumber && (
                  <div><span style={{ color: 'var(--tx2)' }}>Tracking:</span> <strong>{selected.trackingNumber}</strong></div>
                )}

                {selected.adminNotes && (
                  <div role={selected.adminNotes.includes('REFUND REQUIRED') ? 'alert' : undefined} style={{ whiteSpace: 'pre-line', background: selected.adminNotes.includes('REFUND REQUIRED') ? 'var(--er-bg)' : 'var(--bg)', color: selected.adminNotes.includes('REFUND REQUIRED') ? 'var(--er)' : 'var(--tx)', padding: '8px 10px', borderRadius: '4px', fontSize: '12px' }}>
                    {selected.adminNotes}
                  </div>
                )}
              </div>

              {/* Private Link */}
              <div style={{ background: 'var(--bg)', padding: '12px 14px', borderRadius: '4px', marginBottom: '16px', fontSize: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <div style={{ minWidth: 0 }}>
                  <span style={{ color: 'var(--tx2)', display: 'block', marginBottom: '4px' }}>Customer&apos;s private order link</span>
                  <a href={`/o/${selected.token}`} target="_blank" style={{ color: 'var(--pr)', fontWeight: 600, fontFamily: 'monospace', textDecoration: 'underline', overflowWrap: 'anywhere' }}>
                    /o/{selected.token}
                  </a>
                </div>
                <button type="button" className="btn btn-outline btn-sm" onClick={() => copyLink(selected.token)}>
                  {copied ? 'Copied' : 'Copy full link'}
                </button>
              </div>

              {/* Next actions */}
              <div style={{ borderTop: '1px solid var(--bd)', paddingTop: '14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div style={{ fontSize: '12px', fontWeight: 600, color: 'var(--tx2)' }}>
                  STATUS: <span style={{ color: 'var(--dk)' }}>{STATUS_LABEL[selected.status] ?? selected.status}</span>
                </div>

                {selected.paymentStatus !== 'PAID' && selected.status !== 'CANCELLED' && (
                  <form onSubmit={(e) => { e.preventDefault(); markPaid(selected.token) }} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <label htmlFor="pay-method" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dk)' }}>
                      Received payment outside Razorpay? Record it to confirm the order:
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <select id="pay-method" className="input" value={payMethod} onChange={(e) => setPayMethod(e.target.value as typeof payMethod)} style={{ width: 'auto', height: '38px' }}>
                        <option value="UPI">UPI</option>
                        <option value="BANK_TRANSFER">Bank transfer</option>
                        <option value="CASH">Cash</option>
                      </select>
                      <label htmlFor="pay-ref" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Payment reference</label>
                      <input id="pay-ref" className="input" placeholder="UTR / reference (optional)" value={payRef} onChange={(e) => setPayRef(e.target.value)} style={{ flex: '1 1 160px', minWidth: 0, height: '38px' }} />
                      <button type="submit" className="btn btn-primary" disabled={actionLoading} style={{ height: '38px', padding: '0 14px', fontSize: '12px' }}>
                        Mark as paid · {fmt(selected.totalPaise / 100)}
                      </button>
                    </div>
                  </form>
                )}

                {NEXT_STEPS[selected.status].length > 0 && (
                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    {NEXT_STEPS[selected.status].map((step) => (
                      <button
                        key={step.to}
                        type="button"
                        className="btn btn-primary btn-sm"
                        disabled={actionLoading || (step.needsPaid && selected.paymentStatus !== 'PAID')}
                        title={step.needsPaid && selected.paymentStatus !== 'PAID' ? 'Record the payment first' : undefined}
                        onClick={() => updateStatus(selected.token, step.to)}
                      >
                        {step.label}
                      </button>
                    ))}
                  </div>
                )}

                {(selected.status === 'MAKING' || selected.status === 'DISPATCHED') && (
                  <div>
                    <label htmlFor="tracking-no" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--dk)', display: 'block', marginBottom: '6px' }}>
                      {selected.status === 'MAKING' ? 'Courier tracking number (marks the order dispatched)' : 'Correct the tracking number'}
                    </label>
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <input
                        id="tracking-no"
                        type="text"
                        className="input"
                        placeholder={selected.trackingNumber ?? 'e.g. BD987654321'}
                        value={tracking}
                        onChange={(e) => setTracking(e.target.value)}
                        style={{ flex: '1 1 160px', minWidth: 0, height: '38px' }}
                      />
                      <button
                        type="button"
                        onClick={() => addTracking(selected.token)}
                        disabled={actionLoading || !tracking.trim()}
                        className="btn btn-primary"
                        style={{ height: '38px', padding: '0 16px', fontSize: '12px', whiteSpace: 'nowrap' }}
                      >
                        {selected.status === 'MAKING' ? 'Save & dispatch' : 'Update tracking'}
                      </button>
                    </div>
                  </div>
                )}

                {CANCELLABLE.includes(selected.status) && (
                  confirmCancel ? (
                    <div role="alert" style={{ background: 'var(--er-bg)', padding: '10px 12px', borderRadius: '4px', fontSize: '13px', color: 'var(--er)', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      <span>
                        Cancel this order? Its stock goes back on sale.
                        {selected.paymentStatus === 'PAID' ? ' It is paid, so it will be flagged for a refund.' : ''}
                      </span>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button type="button" className="btn btn-primary btn-sm" disabled={actionLoading} onClick={() => updateStatus(selected.token, 'CANCELLED')}>Yes, cancel order</button>
                        <button type="button" className="btn btn-outline btn-sm" onClick={() => setConfirmCancel(false)}>Keep order</button>
                      </div>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setConfirmCancel(true)} style={{ alignSelf: 'flex-start', background: 'none', border: 0, color: 'var(--er)', textDecoration: 'underline', cursor: 'pointer', fontSize: '12px', padding: 0 }}>
                      Cancel order
                    </button>
                  )
                )}
              </div>
            </div>

            {/* In-Link Live Chat Box */}
            <div className="card" style={{ padding: '20px', background: '#fff', border: '1px solid var(--bd)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bd)', paddingBottom: '8px', marginBottom: '12px' }}>
                <h4 style={{ fontFamily: 'var(--font-serif)', fontSize: '18px', color: 'var(--dk)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <IconChat /> Live Conversation
                </h4>
                <span style={{ fontSize: '11px', color: 'var(--ok)', background: 'var(--ok-bg)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
                  ● Real-time
                </span>
              </div>

              <div style={{ maxHeight: '240px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                {selected.messages.length === 0 ? (
                  <div style={{ color: 'var(--tx2)', fontSize: '13px', textAlign: 'center', padding: '20px' }}>
                    No messages yet. Reply below to send a message to the customer&apos;s link!
                  </div>
                ) : (
                  selected.messages.map((m) => {
                    const isAdmin = m.senderType === 'ADMIN'
                    return (
                      <div
                        key={m.id}
                        style={{
                          alignSelf: isAdmin ? 'flex-end' : 'flex-start',
                          maxWidth: '85%',
                          background: isAdmin ? 'var(--pr)' : 'var(--bg2)',
                          color: isAdmin ? '#fff' : 'var(--tx)',
                          padding: '10px 14px',
                          borderRadius: '8px',
                          fontSize: '13px',
                          lineHeight: 1.4,
                        }}
                      >
                        <div style={{ fontSize: '10px', opacity: 0.8, marginBottom: '2px', fontWeight: 600 }}>
                          {isAdmin ? 'You (Artisan)' : `Customer (${selected.customerName})`}
                        </div>
                        <div>{m.body}</div>
                      </div>
                    )
                  })
                )}
                <div ref={chatScrollRef} />
              </div>

              {/* Admin Reply Form */}
              <form onSubmit={(e) => { e.preventDefault(); sendAdminMessage(selected.token); }} style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="text"
                  className="input"
                  placeholder="Type reply to customer..."
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                  style={{ flex: 1, height: '40px' }}
                />
                <button
                  type="submit"
                  disabled={actionLoading || !adminReply.trim()}
                  className="btn btn-primary"
                  style={{ height: '40px', padding: '0 18px', fontSize: '13px' }}
                >
                  Send Reply
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--tx2)' }}>
            Select an enquiry from the table to view details.
          </div>
        )}
      </div>
      <FlashMessage flash={flash} onClose={clearFlash} />
    </div>
  )
}
