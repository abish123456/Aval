'use client'

import React, { createContext, useContext } from 'react'

// Contact details from admin Settings, provided by the storefront layout.

export interface StoreContactValue {
  storeName: string
  whatsapp: string
  phone: string
  email: string
  address: string
}

const FALLBACK: StoreContactValue = {
  storeName: 'AVAL Store',
  whatsapp: '919840212345',
  phone: '919840212345',
  email: 'contact@avalstore.com',
  address: 'Kanyakumari, Tamil Nadu',
}

const Ctx = createContext<StoreContactValue>(FALLBACK)

export function StoreContactProvider({ value, children }: { value: StoreContactValue; children: React.ReactNode }) {
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export function useStoreContact() {
  const c = useContext(Ctx)
  return {
    ...c,
    /** +91 98402 12345 */
    displayPhone: (digits: string) => {
      const d = digits.replace(/\D/g, '')
      return d.length === 12 && d.startsWith('91') ? `+91 ${d.slice(2, 7)} ${d.slice(7)}` : `+${d}`
    },
    whatsappLink: (text?: string) => `https://wa.me/${c.whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`,
  }
}
