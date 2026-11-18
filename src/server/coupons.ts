import { z } from 'zod'

// Shared coupon validation for the admin coupon APIs.
// valueBp holds basis points for PERCENT coupons and paise for FIXED ones.

const dateString = z
  .string()
  .trim()
  .refine((v) => !Number.isNaN(Date.parse(v)), 'Enter a valid date')

export const couponFields = {
  description: z.string().trim().max(200),
  discountType: z.enum(['PERCENT', 'FIXED']),
  valueBp: z.number().int().positive('Enter the discount'),
  minSpendPaise: z.number().int().min(0).max(100_000_000),
  usageLimit: z.number().int().positive().max(1_000_000).nullable(),
  perCustomerLimit: z.number().int().min(1).max(100),
  startsAt: dateString.nullable(),
  expiresAt: dateString.nullable(),
  active: z.boolean(),
}

export function checkCouponRules(c: {
  discountType?: 'PERCENT' | 'FIXED'
  valueBp?: number
  startsAt?: string | null
  expiresAt?: string | null
}): string | null {
  if (c.discountType === 'PERCENT' && c.valueBp !== undefined && (c.valueBp < 100 || c.valueBp > 9000)) {
    return 'A percentage discount must be between 1% and 90%.'
  }
  if (c.startsAt && c.expiresAt && Date.parse(c.expiresAt) <= Date.parse(c.startsAt)) {
    return 'The end date must be after the start date.'
  }
  return null
}

export const toDate = (v: string | null | undefined) => (v ? new Date(v) : v === null ? null : undefined)
