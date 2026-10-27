'use client'

import { useState } from 'react'

export default function AdminCustomersPage() {
  const [customers] = useState([
    {
      id: 'cust-1',
      name: 'Priya Sundaram',
      email: 'priya.sundaram@gmail.com',
      phone: '+91 98402 12345',
      city: 'Kanyakumari',
      ordersCount: 3,
      totalSpent: 8490,
      weddingDate: '18 Nov 2026',
    },
    {
      id: 'cust-2',
      name: 'Ananya Ramachandran',
      email: 'ananya.rc@outlook.com',
      phone: '+91 94431 88762',
      city: 'Coimbatore',
      ordersCount: 1,
      totalSpent: 1579,
      weddingDate: '02 Dec 2026',
    },
    {
      id: 'cust-3',
      name: 'Kavitha Natarajan',
      email: 'kavitha.n@yahoo.com',
      phone: '+91 97890 54321',
      city: 'Chennai',
      ordersCount: 2,
      totalSpent: 5200,
      weddingDate: '15 Jan 2027',
    },
  ])

  return (
    <div>
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: 'var(--dk)', margin: 0 }}>
          Brides & Customers
        </h1>
        <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '4px' }}>
          Registered clients, wedding dates, and custom orders history
        </p>
      </div>

      <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bd)', color: 'var(--tx2)' }}>
              <th style={{ padding: '12px 14px' }}>Customer</th>
              <th style={{ padding: '12px 14px' }}>Contact</th>
              <th style={{ padding: '12px 14px' }}>City</th>
              <th style={{ padding: '12px 14px' }}>Wedding Date</th>
              <th style={{ padding: '12px 14px' }}>Total Orders</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Total Spent</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((c) => (
              <tr key={c.id} style={{ borderBottom: '1px solid #F0E8E6' }}>
                <td style={{ padding: '14px', fontWeight: 600, color: 'var(--dk)' }}>{c.name}</td>
                <td style={{ padding: '14px' }}>
                  <div>{c.email}</div>
                  <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>{c.phone}</div>
                </td>
                <td style={{ padding: '14px', color: 'var(--tx2)' }}>{c.city}</td>
                <td style={{ padding: '14px', color: 'var(--pr)', fontWeight: 500 }}>
                  💍 {c.weddingDate}
                </td>
                <td style={{ padding: '14px' }}>{c.ordersCount} orders</td>
                <td style={{ padding: '14px', textAlign: 'right', fontWeight: 700, color: 'var(--dk)' }}>
                  ₹{c.totalSpent.toLocaleString('en-IN')}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
