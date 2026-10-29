import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import crypto from 'crypto'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

const quotePayloadSchema = z.object({
  quotePricePaise: z.number().int().positive(),
  quoteNote: z.string().min(5),
  validDays: z.number().int().min(1).max(30).default(7),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'custom_orders:write')

    const { id } = await params
    const body = quotePayloadSchema.parse(await req.json())

    const quoteToken = crypto.randomBytes(24).toString('hex')
    const quoteExpiresAt = new Date(Date.now() + body.validDays * 24 * 60 * 60 * 1000)

    const updated = await prisma.customOrder.update({
      where: { id },
      data: {
        status: 'QUOTE_SENT',
        assignedToId: session.userId,
        quoteToken,
        quotePricePaise: body.quotePricePaise,
        quoteNote: body.quoteNote,
        quoteSentAt: new Date(),
        quoteExpiresAt,
      },
    })

    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
    const quoteLink = `${appUrl}/account?quote=${quoteToken}`

    // Queue email to bride
    await prisma.emailOutbox.create({
      data: {
        to: updated.email,
        subject: `Your Bespoke Quote from AVAL Store (₹${body.quotePricePaise / 100})`,
        htmlBody: `
          <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px;">
            <h2 style="color: #7A1026;">Your Custom Bridal Quote is Ready!</h2>
            <p>Dear ${updated.name},</p>
            <p>Our master artisans in Kanyakumari have prepared a bespoke quote for your custom request:</p>
            <div style="background: #FBF7F3; padding: 16px; border-radius: 8px; margin: 16px 0;">
              <p><strong>Quote Amount:</strong> ₹${body.quotePricePaise / 100}</p>
              <p><strong>Artisan Note:</strong> ${body.quoteNote}</p>
              <p style="font-size: 12px; color: #666;">This quote is valid until ${quoteExpiresAt.toLocaleDateString('en-IN')}.</p>
            </div>
            <p>
              <a href="${quoteLink}" style="background: #7A1026; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Review &amp; Accept Quote
              </a>
            </p>
            <p style="font-size: 13px; color: #888;">With love,<br/>AVAL Kanyakumari Studio</p>
          </div>
        `,
      },
    })

    return ok({ success: true, customOrder: updated, quoteToken })
  } catch (error) {
    return apiError(error)
  }
}

