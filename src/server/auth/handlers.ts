import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/db'
import { createSession, getSession, deleteSession } from '@/src/server/auth/session'
import { ok, apiError } from '@/src/server/api/helpers'
import { AuthError } from '@/src/server/auth/rbac'
import { rateLimit, clientIp } from '@/src/server/api/rate-limit'

function tooMany(seconds: number) {
  return NextResponse.json(
    { success: false, error: `Too many attempts. Please try again in ${Math.ceil(seconds / 60)} minutes.` },
    { status: 429, headers: { 'Retry-After': String(seconds) } }
  )
}

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
    const limit = rateLimit(`register:${clientIp(req)}`, 5, 60 * 60 * 1000)
    if (!limit.ok) return tooMany(limit.retryAfterSeconds)
    const parsed = registerSchema.parse(await req.json())
    const body = { ...parsed, email: parsed.email.trim().toLowerCase() }

    const existing = await prisma.user.findFirst({ where: { email: { equals: body.email, mode: 'insensitive' } } })
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
    const parsed = loginSchema.safeParse(await req.json().catch(() => ({})))
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Enter a valid email and password' }, { status: 400 })
    }
    const body = { ...parsed.data, email: parsed.data.email.trim().toLowerCase() }

    // 10 attempts per account and 30 per connection every 15 minutes
    const byIp = rateLimit(`login:ip:${clientIp(req)}`, 30, 15 * 60 * 1000)
    const byEmail = rateLimit(`login:email:${body.email}`, 10, 15 * 60 * 1000)
    if (!byIp.ok || !byEmail.ok) return tooMany(Math.max(byIp.retryAfterSeconds, byEmail.retryAfterSeconds))

    const user = await prisma.user.findFirst({ where: { email: { equals: body.email, mode: 'insensitive' } } })

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

