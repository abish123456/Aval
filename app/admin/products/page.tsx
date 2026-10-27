'use client'

import { useState } from 'react'
import { PRODUCTS, Product } from '@/lib/data'

function fmt(n: number) {
  return '₹' + n.toLocaleString('en-IN')
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>(PRODUCTS)
  const [showAddModal, setShowAddModal] = useState(false)
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Bridal Bangles',
    categorySlug: 'bridal-bangles',
    regularPrice: 1999,
    salePrice: 1599,
    stock: 20,
    customisable: true,
    description: '',
  })

  const handleAddProduct = (e: React.FormEvent) => {
    e.preventDefault()
    const product: Product = {
      id: `prod-${Date.now()}`,
      name: newProduct.name,
      slug: newProduct.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      category: newProduct.category,
      categorySlug: newProduct.categorySlug,
      regularPrice: Number(newProduct.regularPrice),
      salePrice: Number(newProduct.salePrice),
      discountPercent: Math.round(((newProduct.regularPrice - newProduct.salePrice) / newProduct.regularPrice) * 100),
      rating: 5.0,
      reviewCount: 1,
      customisable: newProduct.customisable,
      stock: Number(newProduct.stock),
      description: newProduct.description || 'Handcrafted bridal accessory made in Kanyakumari.',
      details: ['Handmade silk thread wrapped', 'Available in standard Indian sizes'],
      images: ['/images/kundan_set.jpg'],
      sizes: ['2.4', '2.6', '2.8'],
    }

    setProducts([product, ...products])
    setShowAddModal(false)
    setNewProduct({
      name: '',
      category: 'Bridal Bangles',
      categorySlug: 'bridal-bangles',
      regularPrice: 1999,
      salePrice: 1599,
      stock: 20,
      customisable: true,
      description: '',
    })
  }

  const handleDelete = (id: string) => {
    if (confirm('Are you sure you want to remove this product?')) {
      setProducts(products.filter((p) => p.id !== id))
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-serif)', fontSize: '30px', color: 'var(--dk)', margin: 0 }}>
            Product Catalogue
          </h1>
          <p style={{ color: 'var(--tx2)', fontSize: '13px', marginTop: '4px' }}>
            Manage handcrafted bangle sets, hair accessories, and custom pricing
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="btn btn-primary"
          style={{ padding: '10px 20px', fontSize: '14px' }}
        >
          + Add New Bridal Design
        </button>
      </div>

      {/* Products Table */}
      <div className="card" style={{ padding: '24px', background: '#fff', border: '1px solid #EBE4E0' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid var(--bd)', color: 'var(--tx2)' }}>
                <th style={{ padding: '12px 14px' }}>Product</th>
                <th style={{ padding: '12px 14px' }}>Category</th>
                <th style={{ padding: '12px 14px' }}>Sale Price</th>
                <th style={{ padding: '12px 14px' }}>Stock</th>
                <th style={{ padding: '12px 14px' }}>Customisable</th>
                <th style={{ padding: '12px 14px' }}>Rating</th>
                <th style={{ padding: '12px 14px', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} style={{ borderBottom: '1px solid #F0E8E6' }}>
                  <td style={{ padding: '14px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <img
                        src={p.images[0]}
                        alt={p.name}
                        style={{ width: '48px', height: '48px', borderRadius: '4px', objectFit: 'cover' }}
                      />
                      <div>
                        <div style={{ fontWeight: 600, color: 'var(--dk)' }}>{p.name}</div>
                        <div style={{ fontSize: '11px', color: 'var(--tx2)' }}>Slug: {p.slug}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: '14px', color: 'var(--tx2)' }}>{p.category}</td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ fontWeight: 700, color: 'var(--pr)' }}>{fmt(p.salePrice)}</span>{' '}
                    <span style={{ textDecoration: 'line-through', color: 'var(--tx2)', fontSize: '11px' }}>
                      {fmt(p.regularPrice)}
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '4px',
                        fontSize: '11px',
                        fontWeight: 600,
                        background: p.stock < 10 ? '#fbe8c8' : '#dcefe1',
                        color: p.stock < 10 ? 'var(--wn)' : 'var(--ok)',
                      }}
                    >
                      {p.stock} units
                    </span>
                  </td>
                  <td style={{ padding: '14px' }}>
                    {p.customisable ? (
                      <span style={{ color: 'var(--pr)', fontWeight: 600, fontSize: '12px' }}>
                        ✍️ Yes (+₹200)
                      </span>
                    ) : (
                      <span style={{ color: 'var(--tx2)', fontSize: '12px' }}>Standard</span>
                    )}
                  </td>
                  <td style={{ padding: '14px' }}>
                    <span style={{ color: '#D97706' }}>★</span> {p.rating} ({p.reviewCount})
                  </td>
                  <td style={{ padding: '14px', textAlign: 'right' }}>
                    <button
                      onClick={() => handleDelete(p.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--pr)', cursor: 'pointer', fontSize: '12px', textDecoration: 'underline' }}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '20px',
          }}
        >
          <div
            className="card"
            style={{
              width: '100%',
              maxWidth: '540px',
              background: '#fff',
              padding: '32px',
              borderRadius: '12px',
              maxHeight: '90vh',
              overflowY: 'auto',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: '24px', color: 'var(--dk)', margin: 0 }}>
                Add New Bridal Design
              </h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddProduct} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <label className="input-label" style={{ fontSize: '13px' }}>
                Product Title *
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="e.g. Royal Meenakshi Antique Kada"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({ ...newProduct, name: e.target.value })}
                />
              </label>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label className="input-label" style={{ fontSize: '13px' }}>
                  Category
                  <select
                    className="input"
                    value={newProduct.category}
                    onChange={(e) => {
                      const cat = e.target.value
                      const slug = cat.toLowerCase().replace(/[^a-z0-9]+/g, '-')
                      setNewProduct({ ...newProduct, category: cat, categorySlug: slug })
                    }}
                  >
                    <option>Bridal Bangles</option>
                    <option>Hair Clips & Pins</option>
                    <option>Customised Name Sets</option>
                    <option>Bridesmaid Favours</option>
                  </select>
                </label>

                <label className="input-label" style={{ fontSize: '13px' }}>
                  Initial Stock Count
                  <input
                    type="number"
                    required
                    className="input"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct({ ...newProduct, stock: Number(e.target.value) })}
                  />
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
                <label className="input-label" style={{ fontSize: '13px' }}>
                  Regular Price (₹) *
                  <input
                    type="number"
                    required
                    className="input"
                    value={newProduct.regularPrice}
                    onChange={(e) => setNewProduct({ ...newProduct, regularPrice: Number(e.target.value) })}
                  />
                </label>

                <label className="input-label" style={{ fontSize: '13px' }}>
                  Sale Price (₹) *
                  <input
                    type="number"
                    required
                    className="input"
                    value={newProduct.salePrice}
                    onChange={(e) => setNewProduct({ ...newProduct, salePrice: Number(e.target.value) })}
                  />
                </label>
              </div>

              <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={newProduct.customisable}
                  onChange={(e) => setNewProduct({ ...newProduct, customisable: e.target.checked })}
                />
                Allow Name & Date Personalisation (+₹200)
              </label>

              <label className="input-label" style={{ fontSize: '13px' }}>
                Description
                <textarea
                  className="input"
                  rows={3}
                  placeholder="Artisan handcraft materials, stone quality, and wedding styling notes..."
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({ ...newProduct, description: e.target.value })}
                />
              </label>

              <div style={{ display: 'flex', gap: '12px', marginTop: '12px' }}>
                <button type="submit" className="btn btn-primary" style={{ flex: 1, padding: '12px 0' }}>
                  Save & Publish Design
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-secondary"
                  style={{ padding: '12px 20px' }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
