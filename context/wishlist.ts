'use client'

import { useSyncExternalStore } from 'react'
import type { Product } from '@/lib/data'

// Device-local wishlist (no account needed), stored in localStorage.

const KEY = 'aval_wishlist'
const EMPTY: Product[] = []
let cache: Product[] | null = null
const listeners = new Set<() => void>()

function read(): Product[] {
  try {
    const raw = localStorage.getItem(KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function snapshot(): Product[] {
  if (cache === null) cache = read()
  return cache
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      cache = read()
      listener()
    }
  }
  window.addEventListener('storage', onStorage)
  return () => {
    listeners.delete(listener)
    window.removeEventListener('storage', onStorage)
  }
}

function write(next: Product[]) {
  cache = next
  try {
    localStorage.setItem(KEY, JSON.stringify(next))
  } catch {
    // storage unavailable — keep in memory
  }
  listeners.forEach((l) => l())
}

export function useWishlist() {
  const items = useSyncExternalStore(subscribe, snapshot, () => EMPTY)
  return {
    items,
    has: (id: string) => items.some((p) => p.id === id),
    toggle: (product: Product) =>
      write(items.some((p) => p.id === product.id) ? items.filter((p) => p.id !== product.id) : [...items, product]),
    remove: (id: string) => write(items.filter((p) => p.id !== id)),
  }
}
