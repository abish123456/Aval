import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import nodemailer from 'nodemailer'

// ---------------------------------------------------------------------------
// GET /api/cron/send-emails
// Drains the EmailOutbox table — call every minute
// ---------------------------------------------------------------------------

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT ?? '2525'),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function GET(req: NextRequest): Promise<NextResponse> {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret')

  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Pick up to 20 unsent emails
    const pending = await prisma.emailOutbox.findMany({
      where: { sentAt: null, attempts: { lt: 3 } },
      take: 20,
      orderBy: { createdAt: 'asc' },
    })

    let sent = 0
    let failed = 0

    for (const email of pending) {
      try {
        await transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: email.to,
          subject: email.subject,
          html: email.htmlBody,
        })

        await prisma.emailOutbox.update({
          where: { id: email.id },
          data: { sentAt: new Date(), attempts: { increment: 1 } },
        })
        sent++
      } catch (err) {
        await prisma.emailOutbox.update({
          where: { id: email.id },
          data: {
            attempts: { increment: 1 },
            lastError: err instanceof Error ? err.message : String(err),
          },
        })
        failed++
      }
    }

    return NextResponse.json({ success: true, sent, failed })
  } catch (error) {
    console.error('[CRON send-emails]', error)
    return NextResponse.json({ success: false }, { status: 500 })
  }
}

