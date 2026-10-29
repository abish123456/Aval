'use client'

import React, { useState, useEffect, useRef, useSyncExternalStore } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

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
  totalPaise: number
  status: EnquiryStatus
  paymentStatus: 'PENDING' | 'PAID' | 'FAILED'
  trackingNumber: string | null
  createdAt: string
  items: Array<{
    productName: string
    size: string
    qty: number
    unitPaise: number
  }>
  deliveryAddress: {
    street: string
    city: string
    state: string
    pincode: string
  }
  messages: Message[]
  rating: { stars: number; comment?: string } | null
}

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

// Professional SVGs
function IconLock() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  )
}
function IconPackage() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <line x1="16.5" y1="9.4" x2="7.5" y2="4.21" />
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
      <polyline points="3.27 6.96 12 12.01 20.73 6.96" />
      <line x1="12" y1="22.08" x2="12" y2="12" />
    </svg>
  )
}
function IconChat() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
    </svg>
  )
}
function IconCard() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
      <line x1="1" y1="10" x2="23" y2="10" />
    </svg>
  )
}
function IconStar() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  )
}
function IconCheckCircle() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  )
}
function IconClock() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  )
}

const STATUS_STEPS: { key: EnquiryStatus; label: string; desc: string }[] = [
  { key: 'CONFIRMED', label: 'Order Confirmed', desc: 'Payment received. Order scheduled for handcrafting.' },
  { key: 'MAKING', label: 'Artisan Handcrafting', desc: 'Artisans in Kanyakumari are handcrafting your bangles.' },
  { key: 'DISPATCHED', label: 'Dispatched via Courier', desc: 'Shipped via Express Delivery. Live tracking active.' },
  { key: 'DELIVERED', label: 'Delivered', desc: 'Delivered safely. We hope you cherish your bridal accessories.' },
]

const STATUS_ORDER = ['ENQUIRY', 'CONFIRMED', 'MAKING', 'DISPATCHED', 'DELIVERED', 'CANCELLED']

export default function OrderLinkPage() {
  const params = useParams()
  const token = params?.token as string

  const [manualVerified, setManualVerified] = useState(false)
  const [enquiry, setEnquiry] = useState<Enquiry | null>(null)
  const [activeTab, setActiveTab] = useState<'status' | 'chat' | 'pay' | 'rate'>('status')

  const isStorageVerified = useSyncExternalStore(
    (callback) => {
      if (typeof window !== 'undefined') {
        window.addEventListener('storage', callback)
        return () => window.removeEventListener('storage', callback)
      }
      return () => {}
    },
    () => (typeof window !== 'undefined' ? sessionStorage.getItem(`aval_verified_${token}`) === '1' : false),
    () => false
  )

  const verified = manualVerified || isStorageVerified

  useEffect(() => {
    if (!verified || !token) return
    let isCancelled = false

    fetch(`/api/enquiries/${token}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!isCancelled && data) {
          setEnquiry(data)
        }
      })
      .catch((err) => console.error('Error loading enquiry', err))

    return () => {
      isCancelled = true
    }
  }, [verified, token])

  function refetchEnquiry() {
    if (!token) return
    fetch(`/api/enquiries/${token}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setEnquiry(data)
      })
      .catch((err) => console.error('Error refreshing enquiry', err))
  }

  function onVerified() {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem(`aval_verified_${token}`, '1')
    }
    setManualVerified(true)
    refetchEnquiry()
  }

  if (!verified) {
    return <VerifyScreen token={token} onVerified={onVerified} />
  }

  if (!enquiry) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)' }}>
            Loading your order details...
          </div>
        </div>
      </div>
    )
  }

  const isPaid = enquiry.paymentStatus === 'PAID'
  const isDelivered = enquiry.status === 'DELIVERED'
  const isCancelled = enquiry.status === 'CANCELLED'

  return (
    <div style={{ background: 'var(--bg)', minHeight: '90vh', padding: '36px 16px 80px' }}>
      <div className="container-sm" style={{ maxWidth: '680px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            background: '#fff',
            border: '1px solid var(--bd)',
            padding: '18px 24px',
            marginBottom: '20px',
            borderRadius: '6px',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <div>
            <Link href="/" style={{ textDecoration: 'none' }}>
              <span style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', fontWeight: 700, color: 'var(--pr)', letterSpacing: '0.08em' }}>
                AVAL
              </span>
              <span style={{ fontSize: '10px', letterSpacing: '0.14em', color: 'var(--tx2)', display: 'block', textTransform: 'uppercase' }}>
                Kanyakumari • Handcrafted
              </span>
            </Link>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '11px', color: 'var(--tx2)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
              Order Reference
            </span>
            <div style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '16px', color: 'var(--dk)' }}>
              #{enquiry.token}
            </div>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div
          style={{
            padding: '16px 20px',
            borderRadius: '6px',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: isCancelled
              ? 'var(--er-bg)'
              : isPaid
              ? 'var(--ok-bg)'
              : 'var(--wn-bg)',
            border: `1px solid ${
              isCancelled ? 'var(--er)' : isPaid ? 'var(--ok)' : 'var(--wn)'
            }`,
            color: isCancelled ? 'var(--er)' : isPaid ? 'var(--ok)' : 'var(--wn)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span>{isPaid ? <IconCheckCircle /> : <IconClock />}</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: '15px' }}>
                {isCancelled
                  ? 'Order Cancelled'
                  : isPaid
                  ? `Status: ${enquiry.status}`
                  : 'Awaiting Payment Confirmation'}
              </div>
              <div style={{ fontSize: '12px', opacity: 0.9 }}>
                {isPaid
                  ? 'Payment confirmed. Artisans are processing your bangles.'
                  : 'Chat with our artisan below or proceed to complete payment.'}
              </div>
            </div>
          </div>

          {!isPaid && !isCancelled && (
            <button
              onClick={() => setActiveTab('pay')}
              className="btn btn-primary"
              style={{ padding: '6px 16px', minHeight: '34px', fontSize: '13px' }}
            >
              Pay Now
            </button>
          )}
        </div>

        {/* Tab Navigation */}
        <div
          style={{
            display: 'flex',
            gap: '8px',
            background: '#fff',
            border: '1px solid var(--bd)',
            padding: '6px',
            borderRadius: '6px',
            marginBottom: '24px',
          }}
        >
          {(['status', 'chat', 'pay', 'rate'] as const).map((tab) => {
            if (tab === 'pay' && isPaid) return null
            if (tab === 'pay' && isCancelled) return null
            if (tab === 'rate' && !isDelivered) return null
            if (tab === 'rate' && enquiry.rating) return null

            const tabConfig = {
              status: { label: 'Status & Details', Icon: IconPackage },
              chat: { label: `Artisan Chat (${enquiry.messages.length})`, Icon: IconChat },
              pay: { label: 'Complete Payment', Icon: IconCard },
              rate: { label: 'Rate Order', Icon: IconStar },
            }
            const { label, Icon } = tabConfig[tab]

            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  padding: '10px 14px',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: activeTab === tab ? 600 : 400,
                  fontSize: '13px',
                  background: activeTab === tab ? 'var(--pr)' : 'transparent',
                  color: activeTab === tab ? '#fff' : 'var(--tx)',
                  transition: 'all 0.2s',
                }}
              >
                <Icon />
                <span>{label}</span>
              </button>
            )
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'status' && <StatusView enquiry={enquiry} />}
        {activeTab === 'chat' && <ChatView token={token} initialMessages={enquiry.messages} onNewMessage={(msg) => setEnquiry(prev => prev ? { ...prev, messages: [...prev.messages, msg] } : prev)} />}
        {activeTab === 'pay' && !isPaid && !isCancelled && (
          <PayView token={token} totalPaise={enquiry.totalPaise} onPaid={refetchEnquiry} />
        )}
        {activeTab === 'rate' && isDelivered && !enquiry.rating && (
          <RatingView token={token} onRated={refetchEnquiry} />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Screen: Last 4 digits security check
// ---------------------------------------------------------------------------
function VerifyScreen({ token, onVerified }: { token: string; onVerified: () => void }) {
  const [digits, setDigits] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault()
    if (!/^\d{4}$/.test(digits)) {
      setError('Please enter exactly 4 digits.')
      return
    }

    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/enquiries/${token}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lastFour: digits }),
      })
      const data = await res.json()
      if (res.ok && data.verified) {
        onVerified()
      } else {
        setError(data.error ?? 'Incorrect 4 digits. Please check and try again.')
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div className="card" style={{ maxWidth: '420px', width: '100%', padding: '40px 32px', textAlign: 'center', background: '#fff', border: '1px solid var(--bd)' }}>
        <div style={{ color: 'var(--pr)', display: 'flex', justifyContent: 'center', marginBottom: '14px' }}>
          <IconLock />
        </div>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '26px', color: 'var(--dk)', marginBottom: '8px', fontWeight: 600 }}>
          Verify Private Order Link
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: '14px', lineHeight: 1.5, marginBottom: '24px' }}>
          Enter the <strong>last 4 digits</strong> of your WhatsApp number to open your order details:
        </p>

        <form onSubmit={handleVerify}>
          <input
            type="tel"
            maxLength={4}
            required
            autoFocus
            value={digits}
            onChange={(e) => setDigits(e.target.value.replace(/\D/g, '').slice(0, 4))}
            placeholder="• • • •"
            className="input"
            style={{
              width: '100%',
              height: '56px',
              fontSize: '28px',
              textAlign: 'center',
              letterSpacing: '0.4em',
              fontWeight: 700,
              fontFamily: 'monospace',
              color: 'var(--pr)',
              marginBottom: '16px',
            }}
          />

          {error && (
            <div style={{ background: 'var(--er-bg)', color: 'var(--er)', padding: '10px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading || digits.length !== 4}
            className="btn btn-primary"
            style={{ width: '100%', height: '46px', fontSize: '15px', fontWeight: 600 }}
          >
            {loading ? 'Verifying...' : 'Unlock My Order Details'}
          </button>
        </form>

        <p style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '20px' }}>
          This link is private and accessible only by you.
        </p>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 1: Status & Details
// ---------------------------------------------------------------------------
function StatusView({ enquiry }: { enquiry: Enquiry }) {
  const currentIdx = STATUS_ORDER.indexOf(enquiry.status)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Items List */}
      <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid var(--bd)' }}>
        <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px', borderBottom: '1px solid var(--bd)', paddingBottom: '8px' }}>
          Ordered Items
        </h3>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {enquiry.items.map((item, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '10px', borderBottom: '1px solid #f2ecea' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dk)' }}>{item.productName}</div>
                <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>Size: <strong>{item.size}</strong> • Qty: {item.qty}</div>
              </div>
              <div style={{ fontWeight: 600, color: 'var(--pr)', fontSize: '14px' }}>
                {fmt((item.unitPaise * item.qty) / 100)}
              </div>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px', paddingTop: '12px', borderTop: '2px solid var(--bd)', fontWeight: 700, fontSize: '16px', color: 'var(--pr)' }}>
          <span>Total Order Value</span>
          <span>{fmt(enquiry.totalPaise / 100)}</span>
        </div>
      </div>

      {/* Delivery Address */}
      <div className="card" style={{ padding: '20px', background: '#fff', border: '1px solid var(--bd)' }}>
        <h4 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dk)', marginBottom: '8px' }}>
          Delivery Address
        </h4>
        <p style={{ color: 'var(--tx2)', fontSize: '13px', lineHeight: 1.6, margin: 0 }}>
          {enquiry.customerName}<br />
          {enquiry.deliveryAddress.street}, {enquiry.deliveryAddress.city}, {enquiry.deliveryAddress.state} — {enquiry.deliveryAddress.pincode}
        </p>
      </div>

      {/* Progress Timeline */}
      {enquiry.paymentStatus === 'PAID' && (
        <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid var(--bd)' }}>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', marginBottom: '16px', borderBottom: '1px solid var(--bd)', paddingBottom: '8px' }}>
            Production &amp; Delivery Timeline
          </h3>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', position: 'relative' }}>
            {STATUS_STEPS.map((step, idx) => {
              const stepIdx = STATUS_ORDER.indexOf(step.key)
              const done = stepIdx <= currentIdx
              const active = step.key === enquiry.status

              return (
                <div key={step.key} style={{ display: 'flex', gap: '16px', alignItems: 'flex-start' }}>
                  <div
                    style={{
                      width: '32px',
                      height: '32px',
                      borderRadius: '50%',
                      background: done ? 'var(--pr)' : 'var(--bg2)',
                      color: done ? '#fff' : 'var(--tx2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '13px',
                      fontWeight: 700,
                      flexShrink: 0,
                      border: active ? '2px solid var(--pr2)' : 'none',
                    }}
                  >
                    {done ? '✓' : idx + 1}
                  </div>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px', color: done ? 'var(--dk)' : 'var(--tx2)' }}>
                      {step.label}
                    </div>
                    <div style={{ fontSize: '13px', color: 'var(--tx2)', marginTop: '2px', lineHeight: 1.5 }}>
                      {step.desc}
                    </div>
                    {step.key === 'DISPATCHED' && enquiry.trackingNumber && (
                      <div style={{ marginTop: '6px', background: 'var(--ok-bg)', padding: '6px 12px', borderRadius: '4px', color: 'var(--ok)', fontSize: '12px', fontWeight: 600 }}>
                        Tracking Number: {enquiry.trackingNumber}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 2: Chat with Artisan (Real-time SSE + Instant Send)
// ---------------------------------------------------------------------------
function ChatView({ token, initialMessages, onNewMessage }: { token: string; initialMessages: Message[]; onNewMessage: (msg: Message) => void }) {
  const [messages, setMessages] = useState<Message[]>(initialMessages)
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Real-time message streaming via SSE
  useEffect(() => {
    const eventSource = new EventSource(`/api/enquiries/${token}/messages/stream`)

    eventSource.addEventListener('message', (event) => {
      try {
        const msg: Message = JSON.parse(event.data)
        setMessages((prev) => {
          if (prev.some((m) => m.id === msg.id)) return prev
          onNewMessage(msg)
          return [...prev, msg]
        })
      } catch {
        // silent
      }
    })

    return () => {
      eventSource.close()
    }
  }, [token])

  async function handleSend(e: React.FormEvent) {
    e.preventDefault()
    if (!text.trim()) return

    const bodyText = text.trim()
    setText('')
    setSending(true)
    try {
      const res = await fetch(`/api/enquiries/${token}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ senderType: 'CUSTOMER', body: bodyText }),
      })
      if (res.ok) {
        const newMsg: Message = await res.json()
        setMessages((m) => {
          if (m.some((existing) => existing.id === newMsg.id)) return m
          onNewMessage(newMsg)
          return [...m, newMsg]
        })
      }
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid var(--bd)', display: 'flex', flexDirection: 'column', height: '520px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--bd)', paddingBottom: '12px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '20px', color: 'var(--dk)', margin: 0 }}>
            Artisan Direct Chat
          </h3>
          <p style={{ color: 'var(--tx2)', fontSize: '12px', margin: '4px 0 0' }}>
            Ask about saree color matching, Kundan stone customisation, or delivery timing.
          </p>
        </div>
        <span style={{ fontSize: '11px', color: 'var(--ok)', background: 'var(--ok-bg)', padding: '2px 8px', borderRadius: '10px', fontWeight: 600 }}>
          ● Live
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div style={{ flex: 1, overflowY: 'auto', paddingRight: '8px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {messages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--tx2)' }}>
            <p style={{ fontSize: '14px', margin: 0 }}>
              No messages yet. Send a message to confirm your Muhurtham saree shade or bangle size!
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.senderType === 'CUSTOMER'
            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isMe ? 'flex-end' : 'flex-start',
                  maxWidth: '80%',
                  background: isMe ? 'var(--pr)' : 'var(--bg2)',
                  color: isMe ? '#fff' : 'var(--tx)',
                  padding: '12px 16px',
                  borderRadius: isMe ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                  fontSize: '14px',
                  lineHeight: 1.5,
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                {!isMe && (
                  <div style={{ fontSize: '11px', fontWeight: 700, color: 'var(--pr)', marginBottom: '4px' }}>
                    AVAL Artisan (Kanyakumari Studio)
                  </div>
                )}
                <div>{m.body}</div>
                <div style={{ fontSize: '10px', opacity: 0.75, textAlign: 'right', marginTop: '4px' }}>
                  {new Date(m.createdAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            )
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Message Input Box */}
      <form onSubmit={handleSend} style={{ display: 'flex', gap: '10px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--bd)' }}>
        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type your design question or saree matching request..."
          className="input"
          style={{ flex: 1 }}
        />
        <button
          type="submit"
          disabled={sending || !text.trim()}
          className="btn btn-primary"
          style={{ padding: '0 24px', fontSize: '14px', fontWeight: 600 }}
        >
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 3: Payment
// ---------------------------------------------------------------------------
function PayView({ token, totalPaise, onPaid }: { token: string; totalPaise: number; onPaid: () => void }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/enquiries/${token}/pay`, { method: 'POST' })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Payment request failed. Please try again.')
        return
      }

      if (data.simulated) {
        alert('Payment confirmed successfully! Your order is now in production.')
        onPaid()
        return
      }

      if (data.keyId) {
        if (!document.getElementById('razorpay-script')) {
          await new Promise<void>((resolve, reject) => {
            const s = document.createElement('script')
            s.id = 'razorpay-script'
            s.src = 'https://checkout.razorpay.com/v1/checkout.js'
            s.onload = () => resolve()
            s.onerror = () => reject(new Error('Failed to load Razorpay'))
            document.head.appendChild(s)
          })
        }

        const rzp = new (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay({
          key: data.keyId,
          amount: data.amountPaise,
          currency: data.currency,
          order_id: data.razorpayOrderId,
          name: 'AVAL Store',
          description: 'Bridal Bangles Handcraft Order',
          prefill: {
            name: data.customerName,
            contact: data.customerPhone,
          },
          theme: { color: '#7A1026' },
          handler: () => {
            setTimeout(onPaid, 1500)
          },
        })
        rzp.open()
      }
    } catch {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card" style={{ padding: '36px 28px', background: '#fff', border: '1px solid var(--bd)', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--dk)', marginBottom: '8px', fontWeight: 600 }}>
        Complete Payment
      </h2>
      <p style={{ color: 'var(--tx2)', fontSize: '14px', marginBottom: '24px' }}>
        Supports UPI (GPay, PhonePe, Paytm), NetBanking &amp; Cards.
      </p>

      <div
        style={{
          background: 'var(--bl2)',
          border: '1px solid var(--bd)',
          padding: '20px',
          borderRadius: '6px',
          maxWidth: '320px',
          margin: '0 auto 24px',
        }}
      >
        <div style={{ fontSize: '13px', color: 'var(--tx2)' }}>Total Payable Amount</div>
        <div style={{ fontFamily: 'var(--font-serif)', fontSize: '32px', fontWeight: 700, color: 'var(--pr)', marginTop: '4px' }}>
          {fmt(totalPaise / 100)}
        </div>
      </div>

      {error && (
        <div style={{ background: 'var(--er-bg)', color: 'var(--er)', padding: '12px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <button
        onClick={handlePay}
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', maxWidth: '320px', height: '48px', fontSize: '15px', fontWeight: 600 }}
      >
        {loading ? 'Processing Payment...' : 'Pay with UPI / Card →'}
      </button>

      <p style={{ fontSize: '12px', color: 'var(--tx2)', marginTop: '16px' }}>
        Secured by Razorpay. 100% Encrypted &amp; Safe.
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Tab 4: Rating after delivery
// ---------------------------------------------------------------------------
function RatingView({ token, onRated }: { token: string; onRated: () => void }) {
  const [stars, setStars] = useState(5)
  const [comment, setComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/enquiries/${token}/rating`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ stars, comment }),
      })
      if (res.ok) {
        onRated()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Could not submit rating.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="card" style={{ padding: '36px 28px', background: '#fff', border: '1px solid var(--bd)', textAlign: 'center' }}>
      <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--dk)', marginBottom: '8px' }}>
        Rate Your Handcrafted Jewellery
      </h2>
      <p style={{ color: 'var(--tx2)', fontSize: '14px', marginBottom: '24px' }}>
        Your review helps other brides choose bridal accessories with confidence.
      </p>

      {/* Star Picker */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginBottom: '20px' }}>
        {[1, 2, 3, 4, 5].map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setStars(s)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '32px',
              cursor: 'pointer',
              color: s <= stars ? '#D97706' : '#E5E7EB',
              transition: 'transform 0.15s',
            }}
          >
            ★
          </button>
        ))}
      </div>

      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        placeholder="Share your thoughts on the finishing, Kundan shine, and saree matching..."
        className="input"
        rows={3}
        style={{ width: '100%', marginBottom: '16px', resize: 'vertical' }}
      />

      {error && (
        <div style={{ background: 'var(--er-bg)', color: 'var(--er)', padding: '10px', borderRadius: '4px', fontSize: '13px', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary"
        style={{ width: '100%', maxWidth: '280px', height: '46px', fontSize: '14px', fontWeight: 600 }}
      >
        {loading ? 'Submitting...' : 'Submit Review'}
      </button>
    </form>
  )
}
