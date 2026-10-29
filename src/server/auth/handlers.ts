import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createSession, getSession, deleteSession } from '@/src/server/auth/session'
import { ok, apiError } from '@/src/server/api/helpers'
import { AuthError } from '@/src/server/auth/rbac'

// ---------------------------------------------------------------------------
// POST /api/auth/register
// ---------------------------------------------------------------------------

const registerSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  password: z.string().min(8).max(100),
  phone: z.string().optional(),
})

export async function POST_register(req: NextRequest): Promise<NextResponse> {
  try {
    const body = registerSchema.parse(await req.json())

    const existing = await prisma.user.findUnique({ where: { email: body.email } })
    if (existing) {
      return NextResponse.json({ success: false, error: 'An account with this email already exists' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(body.password, 12)

    const user = await prisma.user.create({
      data: {
        name: body.name,
        email: body.email,
        passwordHash,
        phone: body.phone,
        role: 'CUSTOMER',
      },
      select: { id: true, name: true, email: true, role: true },
    })

    await createSession(user.id)
    return NextResponse.json({ success: true, data: user }, { status: 201 })
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export async function POST_login(req: NextRequest): Promise<NextResponse> {
  try {
    const body = loginSchema.parse(await req.json())

    const user = await prisma.user.findUnique({ where: { email: body.email } })

    // Generic error — don't reveal which field is wrong
    const invalid = () =>
      NextResponse.json({ success: false, error: 'Invalid email or password' }, { status: 401 })

    if (!user) return invalid()

    const passwordMatch = await bcrypt.compare(body.password, user.passwordHash)
    if (!passwordMatch) return invalid()

    await createSession(user.id)

    return ok({ id: user.id, name: user.name, email: user.email, role: user.role })
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/auth/logout
// ---------------------------------------------------------------------------

export async function POST_logout(): Promise<NextResponse> {
  try {
    await deleteSession()
    return ok({ message: 'Logged out' })
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// GET /api/auth/me
// ---------------------------------------------------------------------------

export async function GET_me(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()

    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { id: true, name: true, email: true, role: true, phone: true, createdAt: true },
    })

    if (!user) throw new AuthError()
    return ok(user)
  } catch (error) {
    return apiError(error)
  }
}

