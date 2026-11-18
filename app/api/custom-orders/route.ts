import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'
import { escapeHtml } from '@/src/server/api/html'
import { rateLimit, clientIp } from '@/src/server/api/rate-limit'

// ---------------------------------------------------------------------------
// POST /api/custom-orders — Public submission
// ---------------------------------------------------------------------------

const customOrderSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10).max(20),
  description: z.string().min(10).max(3000),
  budget: z.string().max(100).optional(),
  weddingDate: z.string().max(40).optional(),
  occasion: z.string().max(100).optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const limit = rateLimit(`custom-order:${clientIp(req)}`, 5, 60 * 60 * 1000)
    if (!limit.ok) {
      return NextResponse.json(
        { success: false, error: 'Too many requests. Please try again later.' },
        { status: 429, headers: { 'Retry-After': String(limit.retryAfterSeconds) } }
      )
    }
    const session = await getSession()
    const body = customOrderSchema.parse(await req.json())

    const customOrder = await prisma.customOrder.create({
      data: {
        ...body,
        userId: session?.userId,
        status: 'PENDING',
      },
    })

    // Queue confirmation email to customer + notification to admin
    await prisma.emailOutbox.createMany({
      data: [
        {
          to: body.email,
          subject: 'Your custom bridal order request — AVAL Store',
          htmlBody: `<p>Dear ${escapeHtml(body.name)},</p><p>Thank you for your custom bridal accessory request! Our artisans in Kanyakumari will review your request and send you a personalised quote within 2–3 business days.</p><p><strong>Your Request ID:</strong> ${customOrder.id}</p><p>With warmth,<br/>The AVAL Team</p>`,
        },
        {
          to: process.env.EMAIL_FROM ?? 'hello@avalstore.in',
          subject: `New custom order request from ${body.name.replace(/[\r\n]+/g, ' ')}`,
          htmlBody: `<p>New custom order request received:</p><p><strong>Name:</strong> ${escapeHtml(body.name)}<br/><strong>Email:</strong> ${escapeHtml(body.email)}<br/><strong>Phone:</strong> ${escapeHtml(body.phone)}<br/><strong>Description:</strong> ${escapeHtml(body.description)}<br/><strong>Budget:</strong> ${escapeHtml(body.budget ?? 'Not specified')}<br/><strong>Wedding Date:</strong> ${escapeHtml(body.weddingDate ?? 'Not specified')}</p>`,
        },
      ],
    })

    return NextResponse.json({ success: true, data: { id: customOrder.id } }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// GET /api/custom-orders — Admin list
// ---------------------------------------------------------------------------

export async function GET(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'custom_orders:read')

    const { searchParams } = new URL(req.url)
    const status = searchParams.get('status')

    const where = status ? { status: status as never } : {}

    const orders = await prisma.customOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { name: true, email: true } },
        assignedTo: { select: { name: true } },
      },
    })

    return ok(orders)
  } catch (error) {
    return apiError(error)
  }
}
