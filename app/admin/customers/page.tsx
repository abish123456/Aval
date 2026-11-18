'use client'

import Link from 'next/link'
import { useState } from 'react'
import { PageHeader, Notice, rupees, formatDate, useAdminData } from '../_components/ui'

interface Customer {
  id: string
  name: string
  phone: string
  whatsapp: string
  city: string
  ordersCount: number
  totalSpentPaise: number
  lastOrderAt: string
  lastToken: string
}

export default function AdminCustomersPage() {
  const { data, error, loading } = useAdminData<Customer[]>('/api/admin/customers')
  const [query, setQuery] = useState('')

  const q = query.trim().toLowerCase()
  const rows = (data ?? []).filter(
    (c) => !q || c.name.toLowerCase().includes(q) || c.phone.includes(q) || c.whatsapp.includes(q) || c.city.toLowerCase().includes(q)
  )

  return (
    <div>
      <PageHeader title="Customers" subtitle="Everyone who has placed an order, grouped by WhatsApp number" />

      <div style={{ marginBottom: '16px', maxWidth: '360px' }}>
        <label htmlFor="customer-search" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0 0 0 0)' }}>Search customers</label>
        <input id="customer-search" className="input" placeholder="Search name, phone or city" value={query} onChange={(e) => setQuery(e.target.value)} />
      </div>

      {error ? (
        <Notice kind="error">{error}</Notice>
      ) : loading ? (
        <Notice>Loading customers…</Notice>
      ) : rows.length === 0 ? (
        <Notice>{data?.length ? 'No customers match your search.' : 'No customers yet. They appear here after their first order.'}</Notice>
      ) : (
        <div className="card" style={{ padding: '8px 16px', overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>City</th>
                <th style={{ textAlign: 'right' }}>Orders</th>
                <th style={{ textAlign: 'right' }}>Paid</th>
                <th>Last order</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id}>
                  <td style={{ fontWeight: 600 }}>{c.name}</td>
                  <td style={{ fontVariantNumeric: 'tabular-nums' }}>
                    {c.phone}
                    {c.whatsapp !== c.phone && <div style={{ fontSize: '12px', color: 'var(--tx2)' }}>WhatsApp {c.whatsapp}</div>}
                  </td>
                  <td>{c.city || '—'}</td>
                  <td style={{ textAlign: 'right' }}>{c.ordersCount}</td>
                  <td style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{rupees(c.totalSpentPaise)}</td>
                  <td>
                    <Link href={`/admin/enquiries?token=${c.lastToken}`}>{formatDate(c.lastOrderAt)}</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
