'use client'

import { useState } from 'react'

interface Review {
  id: number
  product: string
  customer: string
  rating: number
  text: string
  verifiedPurchase: boolean
  visible: boolean
  reply: string
  date: string
}

const INITIAL_REVIEWS: Review[] = [
  {
    id: 1,
    product: 'Kundan Bridal Bangle Set',
    customer: 'Priya R.',
    rating: 5,
    text: "Beautiful finish, arrived on time. The packaging was stunning and felt very premium. Will definitely order again for my sister's wedding!",
    verifiedPurchase: true,
    visible: true,
    reply: '',
    date: '2026-10-14',
  },
  {
    id: 2,
    product: 'Pearl Hair Clip',
    customer: 'Divya S.',
    rating: 3,
    text: 'Nice but the clip is a bit loose. Looks gorgeous though — just wish the mechanism was sturdier for thick hair.',
    verifiedPurchase: true,
    visible: true,
    reply: "Thank you for your feedback, Divya! We've noted this and will improve the clip mechanism in our next batch. \uD83D\uDE4F",
    date: '2026-10-10',
  },
  {
    id: 3,
    product: 'Pearl Hair Clip',
    customer: 'Anonymous',
    rating: 1,
    text: 'Spam text here — this review was flagged as suspicious and is not from a verified buyer.',
    verifiedPurchase: false,
    visible: false,
    reply: '',
    date: '2026-10-08',
  },
  {
    id: 4,
    product: 'Maangtika Kundan Gold',
    customer: 'Saranya M.',
    rating: 5,
    text: 'Exceeded expectations! The craftsmanship is exquisite and it matched my bridal lehenga perfectly. Highly recommend AVAL.',
    verifiedPurchase: true,
    visible: true,
    reply: '',
    date: '2026-10-20',
  },
  {
    id: 5,
    product: 'Temple Jewellery Earrings',
    customer: 'Gowri K.',
    rating: 4,
    text: 'Very happy with the purchase. Slight delay in shipping but the quality more than makes up for it.',
    verifiedPurchase: true,
    visible: true,
    reply: '',
    date: '2026-10-18',
  },
]

function Stars({ rating }: { rating: number }) {
  return (
    <span style={{ color: '#f59e0b', fontSize: '14px', letterSpacing: '1px' }}>
      {'★'.repeat(rating)}
      <span style={{ color: '#d1d5db' }}>{'★'.repeat(5 - rating)}</span>
    </span>
  )
}

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>(INITIAL_REVIEWS)
  const [filter, setFilter] = useState<'all' | 'visible' | 'hidden' | 'unverified'>('all')
  const [toast, setToast] = useState('')
  const [replyDrafts, setReplyDrafts] = useState<Record<number, string>>(() =>
    Object.fromEntries(INITIAL_REVIEWS.map((r) => [r.id, r.reply]))
  )

  function showToast(msg: string) {
    setToast(msg)
    setTimeout(() => setToast(''), 3000)
  }

  function toggleVisibility(id: number) {
    setReviews((prev) =>
      prev.map((r) => (r.id === id ? { ...r, visible: !r.visible } : r))
    )
    const rev = reviews.find((r) => r.id === id)
    showToast(rev?.visible ? '🚫 Review hidden from storefront.' : '✅ Review now visible on storefront.')
  }

  function saveReply(id: number) {
    const reply = replyDrafts[id] ?? ''
    setReviews((prev) => prev.map((r) => (r.id === id ? { ...r, reply } : r)))
    showToast('💬 Reply saved and published.')
  }

  function deleteReview(id: number) {
    setReviews((prev) => prev.filter((r) => r.id !== id))
    showToast('🗑️ Review deleted.')
  }

  const filtered = reviews.filter((r) => {
    if (filter === 'visible') return r.visible
    if (filter === 'hidden') return !r.visible
    if (filter === 'unverified') return !r.verifiedPurchase
    return true
  })

  const avgRating = reviews.length
    ? (reviews.reduce((a, r) => a + r.rating, 0) / reviews.length).toFixed(1)
    : '—'

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
            Reviews &amp; Ratings
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--tx2)', margin: '4px 0 0' }}>
            Moderate customer reviews, add artisan replies, and manage visibility.
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: '#fff',
            border: '1px solid var(--bd)',
            borderRadius: '10px',
            padding: '10px 18px',
          }}
        >
          <span style={{ fontSize: '24px', color: '#f59e0b' }}>★</span>
          <div>
            <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dk)', lineHeight: 1 }}>{avgRating}</div>
            <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>avg · {reviews.length} reviews</div>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '12px' }}>
        {[
          { label: 'Total', value: reviews.length, color: 'var(--pr)' },
          { label: 'Visible', value: reviews.filter((r) => r.visible).length, color: 'var(--ok)' },
          { label: 'Hidden', value: reviews.filter((r) => !r.visible).length, color: 'var(--tx2)' },
          { label: 'Unverified', value: reviews.filter((r) => !r.verifiedPurchase).length, color: 'var(--wn)' },
          { label: 'Replied', value: reviews.filter((r) => r.reply.trim()).length, color: '#6366f1' },
        ].map((s) => (
          <div key={s.label} className="card" style={{ padding: '14px', textAlign: 'center' }}>
            <div style={{ fontSize: '22px', fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: '11px', color: 'var(--tx2)', marginTop: '2px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        {([
          { key: 'all', label: 'All Reviews' },
          { key: 'visible', label: 'Visible' },
          { key: 'hidden', label: 'Hidden' },
          { key: 'unverified', label: 'Unverified' },
        ] as const).map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setFilter(key)}
            style={{
              padding: '7px 14px',
              borderRadius: '20px',
              border: '1px solid var(--bd)',
              background: filter === key ? 'var(--pr)' : '#fff',
              color: filter === key ? '#fff' : 'var(--tx)',
              fontSize: '12px',
              fontWeight: filter === key ? 600 : 400,
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Reviews List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {filtered.length === 0 && (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--tx2)', fontSize: '14px' }}>
            No reviews match this filter.
          </div>
        )}
        {filtered.map((review) => (
          <div
            key={review.id}
            className="card"
            style={{
              padding: '20px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
              opacity: review.visible ? 1 : 0.65,
              borderLeft: review.visible ? '3px solid var(--ok)' : '3px solid #d1d5db',
            }}
          >
            {/* Top row */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '10px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '14px', color: 'var(--dk)' }}>{review.product}</span>
                  <Stars rating={review.rating} />
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                  <span style={{ fontSize: '12px', color: 'var(--tx2)' }}>by {review.customer} · {review.date}</span>
                  {review.verifiedPurchase && (
                    <span className="tag tag-ok" style={{ fontSize: '10px' }}>✓ Verified Purchase</span>
                  )}
                  {!review.verifiedPurchase && (
                    <span className="tag tag-warning" style={{ fontSize: '10px' }}>⚠ Unverified</span>
                  )}
                  <span
                    className="tag"
                    style={{
                      fontSize: '10px',
                      background: review.visible ? '#dcefe1' : '#f3f4f6',
                      color: review.visible ? 'var(--ok)' : 'var(--tx2)',
                    }}
                  >
                    {review.visible ? 'Visible' : 'Hidden'}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button
                  className="btn btn-sm btn-outline"
                  onClick={() => toggleVisibility(review.id)}
                  style={{ fontSize: '12px' }}
                >
                  {review.visible ? '🚫 Hide' : '👁 Show'}
                </button>
                <button
                  className="btn btn-sm"
                  onClick={() => deleteReview(review.id)}
                  style={{ fontSize: '12px', color: '#dc2626', borderColor: '#fecaca' }}
                >
                  🗑 Delete
                </button>
              </div>
            </div>

            {/* Review Text */}
            <p
              style={{
                fontSize: '14px',
                color: 'var(--tx)',
                lineHeight: 1.65,
                margin: 0,
                padding: '12px 16px',
                background: '#F8F6F4',
                borderRadius: '8px',
                borderLeft: '3px solid var(--bd)',
                fontStyle: 'italic',
              }}
            >
              &ldquo;{review.text}&rdquo;
            </p>

            {/* Artisan Reply */}
            <div>
              <label
                className="input-label"
                style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}
              >
                <span>💬</span>
                <span>Artisan Reply (public)</span>
              </label>
              <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', alignItems: 'flex-end' }}>
                <textarea
                  className="input"
                  rows={2}
                  placeholder="Thank you for your review! We're so glad…"
                  value={replyDrafts[review.id] ?? ''}
                  onChange={(e) =>
                    setReplyDrafts((prev) => ({ ...prev, [review.id]: e.target.value }))
                  }
                  style={{ flex: 1, minWidth: '200px', resize: 'vertical', fontFamily: 'var(--font-sans)', fontSize: '13px' }}
                />
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => saveReply(review.id)}
                  style={{ whiteSpace: 'nowrap', alignSelf: 'flex-end' }}
                >
                  Save Reply
                </button>
              </div>
              {review.reply && (
                <div
                  style={{
                    marginTop: '8px',
                    fontSize: '12px',
                    color: 'var(--ok)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <span>✓</span>
                  <span>Reply currently published on storefront</span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
