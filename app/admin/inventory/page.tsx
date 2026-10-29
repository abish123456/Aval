'use client'

import { useState, useEffect } from 'react'
import { PRODUCTS } from '@/lib/data'

export default function AdminInventoryPage() {
  const [items, setItems] = useState(
    PRODUCTS.map((p) => ({
      id: p.id,
      name: p.name,
      category: p.category,
      stock: p.stock,
      lowStockThreshold: 10,
    }))
  )
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/products?pageSize=50')
      .then((r) => r.json())
      .then((res) => {
        if (res.success && Array.isArray(res.data?.data) && res.data.data.length > 0) {
          setItems(
            res.data.data.map((p: {
              id: string
              name: string
              stock: number
              category?: { name?: string }
            }) => ({
              id: p.id,
              name: p.name,
              category: p.category?.name || 'Bridal Jewellery',
              stock: p.stock,
              lowStockThreshold: 10,
            }))
          )
        }
      })
      .catch(() => {})
  }, [])

  const handleStockUpdate = async (id: string, delta: number) => {
    setSavingId(id)
    // Optimistic UI update
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, stock: Math.max(0, it.stock + delta) } : it))
    )

    try {
      const res = await fetch('/api/admin/inventory/adjust', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productId: id, delta }),
      })
      const data = await res.json()
      if (res.ok && data.success && data.data) {
        setItems((prev) =>
          prev.map((it) => (it.id === id ? { ...it, stock: data.data.stock } : it))
        )
      }
    } catch {
      // Local fallback retained
    } finally {
      setSavingId(null)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: 'var(--dk)', margin: 0 }}>
            Inventory & Stock Manager
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '4px' }}>
            Kanyakumari artisan workshop raw materials and finished bridal jewelry units
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid var(--bd)', color: 'var(--tx2)' }}>
              <th style={{ padding: '12px 14px' }}>Design Name</th>
              <th style={{ padding: '12px 14px' }}>Category</th>
              <th style={{ padding: '12px 14px' }}>Current Stock</th>
              <th style={{ padding: '12px 14px' }}>Status</th>
              <th style={{ padding: '12px 14px', textAlign: 'right' }}>Quick Adjust</th>
            </tr>
          </thead>
          <tbody>
            {items.map((it) => {
              const isLow = it.stock <= it.lowStockThreshold
              return (
                <tr key={it.id} style={{ borderBottom: '1px solid #F0E8E6' }}>
                  <td style={{ padding: '14px', fontWeight: 600, color: 'var(--dk)' }}>{it.name}</td>
                  <td style={{ padding: '14px', color: 'var(--tx2)' }}>{it.category}</td>
                  <td style={{ padding: '14px', fontWeight: 700, fontSize: '14px' }}>{it.stock} units</td>
                  <td style={{ padding: '14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: isLow ? '#fbe8c8' : '#dcefe1',
                        color: isLow ? 'var(--wn)' : 'var(--ok)',
                      }}
                    >
                      {isLow ? '⚠️ Low Stock Alert' : '✓ Normal'}
                    </span>
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <div style={{ display: 'inline-flex', gap: '6px' }}>
                      <button
                        disabled={savingId === it.id}
                        onClick={() => handleStockUpdate(it.id, -1)}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--bd)', background: 'var(--bg2)', cursor: 'pointer', opacity: savingId === it.id ? 0.6 : 1 }}
                      >
                        −1
                      </button>
                      <button
                        disabled={savingId === it.id}
                        onClick={() => handleStockUpdate(it.id, +5)}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: '1px solid var(--bd)', background: 'var(--bg2)', cursor: 'pointer', opacity: savingId === it.id ? 0.6 : 1 }}
                      >
                        +5
                      </button>
                      <button
                        disabled={savingId === it.id}
                        onClick={() => handleStockUpdate(it.id, +20)}
                        style={{ padding: '4px 10px', borderRadius: '4px', border: 'none', background: 'var(--bl2)', color: 'var(--pr)', fontWeight: 600, cursor: 'pointer', opacity: savingId === it.id ? 0.6 : 1 }}
                      >
                        +20 Restock
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
