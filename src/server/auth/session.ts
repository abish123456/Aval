import { SignJWT, jwtVerify } from 'jose'
import { cookies } from 'next/headers'
import { prisma } from '@/lib/db'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const SESSION_COOKIE = 'aval_session'
const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET ?? 'dev_jwt_secret_change_in_production_32byteslong!!'
)
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? '7d'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SessionPayload {
  sessionId: string
  userId: string
  role: string
}

export interface SessionUser {
  id: string
  name: string
  email: string
  role: string
}

// ---------------------------------------------------------------------------
// Create session
// ---------------------------------------------------------------------------

export async function createSession(userId: string): Promise<string> {
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days

  // Create DB session record
  const session = await prisma.session.create({
    data: { userId, expiresAt, token: '' }, // token filled below
  })

  // Sign JWT with sessionId embedded
  const token = await new SignJWT({ sessionId: session.id, userId } satisfies Omit<SessionPayload, 'role'>)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(JWT_EXPIRES_IN)
    .sign(JWT_SECRET)

  // Store token hash in DB (store the full token so we can revoke it)
  await prisma.session.update({
    where: { id: session.id },
    data: { token },
  })

  // Set cookie
  const cookieStore = await cookies()
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    expires: expiresAt,
    path: '/',
  })

  return token
}

// ---------------------------------------------------------------------------
// Get session from current request
// ---------------------------------------------------------------------------

export async function getSession(): Promise<SessionPayload | null> {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get(SESSION_COOKIE)?.value
    if (!token) return null

    const { payload } = await jwtVerify(token, JWT_SECRET)
    const { sessionId, userId } = payload as unknown as SessionPayload

    // Verify session exists in DB and is not expired
    const session = await prisma.session.findUnique({
      where: { id: sessionId },
      include: { user: { select: { role: true } } },
    })

    if (!session || session.expiresAt < new Date()) {
      return null
    }

    return { sessionId, userId, role: session.user.role }
  } catch {
    return null
  }
}

// ---------------------------------------------------------------------------
// Get full user from session
// ---------------------------------------------------------------------------

export async function getSessionUser(): Promise<SessionUser | null> {
  const session = await getSession()
  if (!session) return null

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { id: true, name: true, email: true, role: true },
  })

  return user ? { id: user.id, name: user.name, email: user.email, role: user.role } : null
}

// ---------------------------------------------------------------------------
// Delete session (logout)
// ---------------------------------------------------------------------------

export async function deleteSession(): Promise<void> {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value

  if (token) {
    await prisma.session.deleteMany({ where: { token } })
    cookieStore.delete(SESSION_COOKIE)
  }
}

// ---------------------------------------------------------------------------
// Delete all sessions for a user (force logout everywhere)
// ---------------------------------------------------------------------------

export async function deleteAllUserSessions(userId: string): Promise<void> {
  await prisma.session.deleteMany({ where: { userId } })
}

