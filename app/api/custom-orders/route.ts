import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// POST /api/custom-orders — Public submission
// ---------------------------------------------------------------------------

const customOrderSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(10),
  description: z.string().min(10),
  budget: z.string().optional(),
  weddingDate: z.string().optional(),
  occasion: z.string().optional(),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
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
          htmlBody: `<p>Dear ${body.name},</p><p>Thank you for your custom bridal accessory request! Our artisans in Kanyakumari will review your request and send you a personalised quote within 2–3 business days.</p><p><strong>Your Request ID:</strong> ${customOrder.id}</p><p>With warmth,<br/>The AVAL Team</p>`,
        },
        {
          to: process.env.EMAIL_FROM ?? 'hello@avalstore.in',
          subject: `New custom order request from ${body.name}`,
          htmlBody: `<p>New custom order request received:</p><p><strong>Name:</strong> ${body.name}<br/><strong>Email:</strong> ${body.email}<br/><strong>Phone:</strong> ${body.phone}<br/><strong>Description:</strong> ${body.description}<br/><strong>Budget:</strong> ${body.budget ?? 'Not specified'}<br/><strong>Wedding Date:</strong> ${body.weddingDate ?? 'Not specified'}</p>`,
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
