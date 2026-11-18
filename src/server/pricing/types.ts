// ---------------------------------------------------------------------------
// Pricing Engine — Types
// All monetary values are INTEGER PAISE (₹1 = 100 paise). No floats.
// ---------------------------------------------------------------------------

export interface CartLineInput {
  productId: string
  qty?: number
  quantity?: number
  size?: string
  customisation?: string
}

export interface PricedLine {
  productId: string
  name: string
  slug: string
  image: string
  size?: string
  customisation?: string
  qty: number
  unitPricePaise: number       // sale price
  regularPricePaise: number   // original price
  itemOfferDiscountPaise: number
  lineTotalPaise: number      // after item offer
  customisationChargePaise: number
}

export interface DiscountBreakdown {
  type: 'ITEM_OFFER' | 'CART_PROMO' | 'COUPON' | 'SHIPPING'
  label: string
  amountPaise: number
}

export interface ShippingResult {
  amountPaise: number
  isFree: boolean
  freeShippingRemainingPaise: number | null // null if already free
}

export interface CouponResult {
  valid: boolean
  code: string
  discountPaise: number
  errorCode?: 'EXPIRED' | 'NOT_FOUND' | 'INACTIVE' | 'MIN_SPEND' | 'USAGE_LIMIT' | 'SCOPE'
  errorMessage?: string
}

export interface QuoteResult {
  lines: PricedLine[]
  subtotalPaise: number           // sum of lineTotals before cart promo + coupon
  itemOfferDiscountPaise: number  // total item-level discounts
  cartPromoDiscountPaise: number
  coupon: CouponResult | null
  couponDiscountPaise: number
  shippingPaise: number
  taxPaise: number
  taxMode: 'NONE' | 'INCLUSIVE' | 'EXCLUSIVE'
  taxRateBp: number               // basis points, 0 if NONE
  totalPaise: number
  discounts: DiscountBreakdown[]
  shipping: ShippingResult
  messages: string[]              // e.g. "Add ₹150 more for free shipping"
}

export interface PricingSettings {
  freeShippingThresholdPaise: number  // 0 = no free shipping threshold
  flatShippingPaise: number
  taxMode: 'NONE' | 'INCLUSIVE' | 'EXCLUSIVE'
  taxRateBp: number
  stackItemOffers: boolean
}

export const DEFAULT_PRICING_SETTINGS: PricingSettings = {
  freeShippingThresholdPaise: 50000,   // ₹500
  flatShippingPaise: 8000,             // ₹80
  taxMode: 'NONE',
  taxRateBp: 0,
  stackItemOffers: false,
}

