// GET /api/enquiries/[token]/messages/stream — Server-Sent Events stream for real-time chat
import { NextRequest } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ token: string }> }
) {
  const { token } = await ctx.params
  const enquiry = await prisma.enquiry.findUnique({
    where: { token },
    select: { id: true },
  })

  if (!enquiry) {
    return new Response('Enquiry not found', { status: 404 })
  }

  const enquiryId = enquiry.id
  let lastCheckedAt = new Date()

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder()

      // Initial ping
      controller.enqueue(encoder.encode(`event: connected\ndata: "ok"\n\n`))

      // Check for new messages periodically
      const interval = setInterval(async () => {
        try {
          const newMessages = await prisma.enquiryMessage.findMany({
            where: {
              enquiryId,
              createdAt: { gt: lastCheckedAt },
            },
            orderBy: { createdAt: 'asc' },
          })

          if (newMessages.length > 0) {
            lastCheckedAt = new Date()
            for (const msg of newMessages) {
              controller.enqueue(
                encoder.encode(`event: message\ndata: ${JSON.stringify(msg)}\n\n`)
              )
            }
          } else {
            // Heartbeat to keep connection alive
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

