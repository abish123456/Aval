'use client'

import React, { createContext, useContext, useEffect, useState, useSyncExternalStore } from 'react'
import { Product } from '@/lib/data'

export interface CartItem {
  id: string
  product: Product
  size: string
  customName?: string
  weddingDate?: string
  quantity: number
  price: number // display estimate only — the server prices the order
}

/** What the server will charge, from POST /api/enquiries/quote */
export interface CartQuote {
  subtotalPaise: number
  discountPaise: number
  shippingPaise: number
  totalPaise: number
  couponCode: string | null
  couponError: string | null
  freeShippingRemainingPaise: number
}

interface CartContextType {
  items: CartItem[]
  hydrated: boolean
  addItem: (product: Product, size: string, customName?: string, weddingDate?: string, quantity?: number) => void
  removeItem: (itemId: string) => void
  updateQuantity: (itemId: string, quantity: number) => void
  clearCart: () => void
  itemCount: number
  /** Rupees. Server values once the quote has loaded, local estimate before that. */
  subtotal: number
  discount: number
  shipping: number
  total: number
  quote: CartQuote | null
  quoteError: string | null
  quoteLoading: boolean
  couponCode: string
  applyCoupon: (code: string) => Promise<{ ok: boolean; message: string }>
  removeCoupon: () => void
}

// ---------------------------------------------------------------------------
// localStorage-backed store read through useSyncExternalStore.
// The server snapshot is always empty, so hydration never mismatches; the
// browser snapshot takes over right after hydration.
// ---------------------------------------------------------------------------

interface CartState {
  items: CartItem[]
  couponCode: string
}

const STORAGE_KEY = 'aval_cart'
const COUPON_KEY = 'aval_coupon'
const EMPTY: CartState = { items: [], couponCode: '' }

let state: CartState | null = null
const listeners = new Set<() => void>()

function readStorage(): CartState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const items = raw ? (JSON.parse(raw) as CartItem[]) : []
    return { items: Array.isArray(items) ? items : [], couponCode: localStorage.getItem(COUPON_KEY) ?? '' }
  } catch {
    return EMPTY
  }
}

function getSnapshot(): CartState {
  if (state === null) state = readStorage()
  return state
}

function getServerSnapshot(): CartState {
  return EMPTY
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === COUPON_KEY) {
      state = readStorage()
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function setState(update: (prev: CartState) => CartState) {
  state = update(getSnapshot())
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.items))
    if (state.couponCode) localStorage.setItem(COUPON_KEY, state.couponCode)
    else localStorage.removeItem(COUPON_KEY)
  } catch {
    // storage unavailable (private mode) — keep in memory
  }
  listeners.forEach((l) => l())
}

const noopSubscribe = () => () => {}

function toQuoteItems(items: CartItem[]) {
  return items.map((i) => ({
    productId: i.product.id,
    size: i.size,
    qty: i.quantity,
    customName: i.customName?.trim() || undefined,
    weddingDate: i.weddingDate?.trim() || undefined,
  }))
}

async function fetchQuote(items: CartItem[], couponCode: string): Promise<{ quote?: CartQuote; error?: string }> {
  const res = await fetch('/api/enquiries/quote', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ items: toQuoteItems(items), couponCode: couponCode || undefined }),
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) return { error: typeof data?.error === 'string' ? data.error : 'Could not price your bag.' }
  return { quote: data as CartQuote }
}

const CartContext = createContext<CartContextType | undefined>(undefined)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { items, couponCode } = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false)

  const [quote, setQuote] = useState<CartQuote | null>(null)
  const [quoteError, setQuoteError] = useState<string | null>(null)
  const [quoteLoading, setQuoteLoading] = useState(false)

  // Re-price on the server whenever the bag or coupon changes (debounced)
  useEffect(() => {
    if (items.length === 0) return
    let cancelled = false
    const t = setTimeout(() => {
      setQuoteLoading(true)
      fetchQuote(items, couponCode)
        .then((r) => {
          if (cancelled) return
          setQuote(r.quote ?? null)
          setQuoteError(r.error ?? null)
        })
        .catch(() => {
          if (!cancelled) setQuoteError('Could not reach the server to price your bag.')
        })
        .finally(() => {
          if (!cancelled) setQuoteLoading(false)
        })
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [items, couponCode])

  const addItem = (product: Product, size: string, customName?: string, weddingDate?: string, quantity = 1) => {
    const customExtra = customName && customName.trim() ? 200 : 0
    const unitPrice = product.salePrice + customExtra
    const itemId = `${product.id}-${size}-${customName || ''}-${weddingDate || ''}`
    setState((prev) => {
      const existing = prev.items.find((i) => i.id === itemId)
      const next = existing
        ? prev.items.map((i) => (i.id === itemId ? { ...i, quantity: i.quantity + quantity } : i))
        : [...prev.items, { id: itemId, product, size, customName, weddingDate, quantity, price: unitPrice }]
      return { ...prev, items: next }
    })
  }

  const removeItem = (itemId: string) =>
    setState((prev) => ({ ...prev, items: prev.items.filter((i) => i.id !== itemId) }))

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) return removeItem(itemId)
    setState((prev) => ({ ...prev, items: prev.items.map((i) => (i.id === itemId ? { ...i, quantity } : i)) }))
  }

  const clearCart = () => {
    setState(() => ({ items: [], couponCode: '' }))
    setQuote(null)
    setQuoteError(null)
  }

  const applyCoupon = async (code: string) => {
    const trimmed = code.trim().toUpperCase()
    if (!trimmed) return { ok: false, message: 'Enter a coupon code.' }
    if (items.length === 0) {
      // Nothing to price yet — remember it and validate once items are added
      setState((prev) => ({ ...prev, couponCode: trimmed }))
      return { ok: true, message: `Coupon ${trimmed} saved. It will be checked when you add items.` }
    }
    try {
      const r = await fetchQuote(items, trimmed)
      if (r.error) return { ok: false, message: r.error }
      if (r.quote?.couponError) return { ok: false, message: r.quote.couponError }
      setState((prev) => ({ ...prev, couponCode: trimmed }))
      setQuote(r.quote ?? null)
      return { ok: true, message: `Coupon ${trimmed} applied.` }
    } catch {
      return { ok: false, message: 'Could not check the coupon. Please try again.' }
    }
  }

  const removeCoupon = () => setState((prev) => ({ ...prev, couponCode: '' }))

  const itemCount = items.reduce((acc, i) => acc + i.quantity, 0)
  const estimate = items.reduce((acc, i) => acc + i.price * i.quantity, 0)
  const live = items.length > 0 ? quote : null

  return (
    <CartContext.Provider
      value={{
        items,
        hydrated,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        itemCount,
        subtotal: live ? live.subtotalPaise / 100 : estimate,
        discount: live ? live.discountPaise / 100 : 0,
        shipping: live ? live.shippingPaise / 100 : 0,
        total: live ? live.totalPaise / 100 : estimate,
        quote: live,
        quoteError: items.length > 0 ? quoteError : null,
        quoteLoading,
        couponCode,
        applyCoupon,
        removeCoupon,
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
