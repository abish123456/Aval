import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET  /api/admin/settings — store configuration
// POST /api/admin/settings — save it (owner only). Only known keys are accepted.
// Payment keys live in environment variables, never here.
// ---------------------------------------------------------------------------

const phone = z
  .string()
  .trim()
  .transform((v) => v.replace(/\D/g, ''))
  .refine((v) => v === '' || /^(91)?[6-9]\d{9}$/.test(v), 'Enter a valid 10-digit Indian mobile number')

const settingsSchema = z
  .object({
    store_name: z.string().trim().min(2, 'Enter the store name').max(80),
    contact_email: z.string().trim().email('Enter a valid email address').max(120),
    whatsapp_number: phone,
    contact_phone: phone,
    workshop_address: z.string().trim().max(300),
    free_shipping_threshold_paise: z.number().int().min(0).max(100_000_000),
    shipping_flat_fee_paise: z.number().int().min(0).max(1_000_000),
  })
  .partial()
  .strict()

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'settings:read')

    const settings = await prisma.setting.findMany()
    return ok(Object.fromEntries(settings.map((s) => [s.key, s.value])))
  } catch (error) {
    return apiError(error)
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'settings:write')

    const body = settingsSchema.parse(await req.json())
    const entries = Object.entries(body).filter(([, v]) => v !== undefined)

    await prisma.$transaction([
      ...entries.map(([key, value]) =>
        prisma.setting.upsert({ where: { key }, create: { key, value: String(value) }, update: { value: String(value) } })
      ),
      prisma.auditLog.create({
        data: { actorId: session.userId, action: 'UPDATE', entityType: 'Settings', diff: Object.fromEntries(entries) },
      }),
    ])

    return ok({ saved: true })
  } catch (error) {
    return apiError(error)
  }
}
