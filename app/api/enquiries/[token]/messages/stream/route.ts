// GET /api/enquiries/[token]/messages/stream — Server-Sent Events stream for real-time chat
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'
import { canViewEnquiry } from '@/src/server/enquiry/access'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params
  const enquiry = await prisma.enquiry.findUnique({
    where: { token },
    select: { id: true, status: true, trackingNumber: true },
  })

  if (!enquiry) {
    return new Response('Enquiry not found', { status: 404 })
  }
  if (!(await canViewEnquiry(req, token))) {
    return new Response('Verification required', { status: 401 })
  }

  const enquiryId = enquiry.id
  // Cursor = createdAt of the newest message already delivered, so a message
  // written while a poll is running is picked up by the next poll.
  let lastCheckedAt = new Date()
  // Track last known status and tracking number to emit status events on change
  let lastStatus: string = enquiry.status
  let lastTracking: string | null = enquiry.trackingNumber

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Initial ping
      controller.enqueue(encoder.encode(`event: connected\ndata: "ok"\n\n`))

      // Check for new messages and status changes periodically
      const interval = setInterval(async () => {
        try {
          // Poll messages
          const newMessages = await prisma.enquiryMessage.findMany({
            where: {
              enquiryId,
              createdAt: { gt: lastCheckedAt },
            },
            orderBy: { createdAt: 'asc' },
          })

          if (newMessages.length > 0) {
            lastCheckedAt = newMessages[newMessages.length - 1].createdAt
            for (const msg of newMessages) {
              controller.enqueue(
                encoder.encode(`event: message\ndata: ${JSON.stringify(msg)}\n\n`)
              )
            }
          }

          // Poll status changes
          const currentEnquiry = await prisma.enquiry.findUnique({
            where: { id: enquiryId },
            select: { status: true, trackingNumber: true },
          })
          if (currentEnquiry) {
            if (currentEnquiry.status !== lastStatus || currentEnquiry.trackingNumber !== lastTracking) {
              lastStatus = currentEnquiry.status
              lastTracking = currentEnquiry.trackingNumber
              controller.enqueue(
                encoder.encode(`event: status\ndata: ${JSON.stringify({ status: currentEnquiry.status, trackingNumber: currentEnquiry.trackingNumber })}\n\n`)
              )
            }
          }

          // Heartbeat if nothing was sent
          if (newMessages.length === 0) {
            controller.enqueue(encoder.encode(`: ping\n\n`))
          }
        } catch {
          clearInterval(interval)
          controller.close()
        }
      }, 1500)

      req.signal.addEventListener('abort', () => {
        clearInterval(interval)
        try {
          controller.close()
        } catch {
          // already closed
        }
      })
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
    },
  })
}

