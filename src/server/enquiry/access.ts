import crypto from 'crypto'
import type { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/src/server/auth/session'
import { hasPermission } from '@/src/server/auth/rbac'

// ---------------------------------------------------------------------------
// Private order link access
//
// The order link (/o/<token>) is protected by the last 4 digits of the
// customer's WhatsApp number. Once verified, the server sets an httpOnly
// cookie holding an HMAC of the token. Every enquiry API checks that cookie
// (or a staff session) — the browser can no longer skip the check.
// ---------------------------------------------------------------------------

const ACCESS_MAX_AGE_SECONDS = 30 * 24 * 60 * 60 // 30 days

function secret(): string {
  const value = process.env.JWT_SECRET
  if (value && value.length >= 32) return value
  if (process.env.NODE_ENV === 'production') {
    throw new Error('JWT_SECRET must be set (32+ characters) in production')
  }
  return 'dev_jwt_secret_change_in_production_32byteslong!!'
}

function cookieName(token: string): string {
  return `aval_o_${token}`
}

function sign(token: string): string {
  return crypto.createHmac('sha256', secret()).update(`enquiry-access:${token}`).digest('hex')
}

export function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a)
  const bb = Buffer.from(b)
  return ab.length === bb.length && crypto.timingSafeEqual(ab, bb)
}

/** Attach the access cookie for this order token to a response. */
export function grantEnquiryAccess(res: NextResponse, token: string): NextResponse {
  res.cookies.set(cookieName(token), sign(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: ACCESS_MAX_AGE_SECONDS,
  })
  return res
}

/** True when this browser has verified the order link. */
export function hasEnquiryAccess(req: NextRequest, token: string): boolean {
  const value = req.cookies.get(cookieName(token))?.value
  return !!value && safeEqual(value, sign(token))
}

/** True when the request comes from a signed-in staff member who can read orders. */
export async function isStaffRequest(): Promise<boolean> {
  const session = await getSession()
  return !!session && hasPermission(session.role, 'orders:read')
}

/** Customer who verified the link, or staff. */
export async function canViewEnquiry(req: NextRequest, token: string): Promise<boolean> {
  return hasEnquiryAccess(req, token) || (await isStaffRequest())
}

/** Generate an unguessable order token (12 chars, ~70 bits). */
export function generateEnquiryToken(): string {
  const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789'
  let token = ''
  for (let i = 0; i < 12; i++) token += chars[crypto.randomInt(chars.length)]
  return token
}

/** Last 10 digits of a phone number (strips +91, spaces, dashes). */
export function last10(phone: string | null | undefined): string {
  return (phone ?? '').replace(/\D/g, '').slice(-10)
}
