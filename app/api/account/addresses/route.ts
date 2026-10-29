import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/account/addresses — List user addresses
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()

    const addresses = await prisma.address.findMany({
      where: { userId: session.userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    })

    return ok(addresses)
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/account/addresses — Create address
// ---------------------------------------------------------------------------

const addressSchema = z.object({
  label: z.string().default('Home'),
  name: z.string().min(2),
  phone: z.string().min(10),
  street: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6).max(10),
  isDefault: z.boolean().default(false),
})

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()

    const body = addressSchema.parse(await req.json())

    // If new address is default, clear existing defaults
    if (body.isDefault) {
      await prisma.address.updateMany({
        where: { userId: session.userId },
        data: { isDefault: false },
      })
    }

    const address = await prisma.address.create({
      data: {
        ...body,
        userId: session.userId,
      },
    })

    return NextResponse.json({ success: true, data: address }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// DELETE /api/account/addresses?id=... — Delete address
// ---------------------------------------------------------------------------

export async function DELETE(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()

    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ success: false, error: 'Address ID required' }, { status: 400 })

    await prisma.address.deleteMany({
      where: { id, userId: session.userId },
    })

    return ok({ deleted: true })
  } catch (error) {
    return apiError(error)
  }
}

