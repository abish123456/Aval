'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { Product } from '@/lib/data'

export interface CartItem {
  id: string
  product: Product
  size: string
  customName?: string
  weddingDate?: string
  quantity: number
  price: number
}

interface CartContextType {
  items: CartItem[]
  addItem: (product: Product, size: string, customName?: string, weddingDate?: string, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  subtotal: number
  discount: number
  shipping: number
  total: number
  couponCode: string
  setCouponCode: (code: string) => void
  applyCoupon: (code: string) => boolean
  couponDiscount: number
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([])
  const [couponCode, setCouponCode] = useState('')
  const [couponDiscount, setCouponDiscount] = useState(0)

  // Initialize from localStorage on client
  useEffect(() => {
    try {
      const stored = localStorage.getItem('aval_cart')
      if (stored) {
        setItems(JSON.parse(stored))
      }
    } catch {
      // ignore
    }
  }, [])

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('aval_cart', JSON.stringify(items))
    } catch {
      // ignore
    }
  }, [items])

  const addItem = (
    product: Product,
    size: string,
    customName?: string,
    weddingDate?: string,
    quantity: number = 1
  ) => {
    const customExtra = customName && customName.trim() ? 200 : 0
    const unitPrice = product.salePrice + customExtra
    const itemId = `${product.id}-${size}-${customName || ''}-${weddingDate || ''}`

    setItems((prev) => {
      const existing = prev.find((item) => item.id === itemId)
      if (existing) {
        return prev.map((item) =>
          item.id === itemId ? { ...item, quantity: item.quantity + quantity } : item
        )
      }
      return [
        ...prev,
        {
          id: itemId,
          product,
          size,
          customName,
          weddingDate,
          quantity,
          price: unitPrice,
        },
      ]
    })
  }

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.id !== itemId))
  }

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId)
      return
    }
    setItems((prev) =>
      prev.map((item) => (item.id === itemId ? { ...item, quantity } : item))
    )
  }

  const clearCart = () => {
    setItems([])
    setCouponCode('')
    setCouponDiscount(0)
  }

  const applyCoupon = (code: string) => {
    const trimmed = code.trim().toUpperCase()
    if (trimmed === 'AVALWEDDING' || trimmed === 'BRIDAL10') {
      setCouponDiscount(300)
      setCouponCode(trimmed)
      return true
    } else if (trimmed === 'FIRST500') {
      setCouponDiscount(500)
      setCouponCode(trimmed)
      return true
    }
    return false
  }

  const itemCount = items.reduce((acc, item) => acc + item.quantity, 0)
  const subtotal = items.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const discount = couponDiscount
  const shipping = subtotal > 1499 || subtotal === 0 ? 0 : 99
  const total = Math.max(0, subtotal - discount + shipping)

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal,
        discount,
        shipping,
        total,
        couponCode,
        setCouponCode,
        applyCoupon,
        couponDiscount,
      }}
    >
      {children}
    </CartContext.Provider>
  )
}

export function useCart() {
  const context = useContext(CartContext)
  if (!context) {
    throw new Error('useCart must be used within a CartProvider')
  }
  return context
}
