import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/db'
import { getSession } from '@/src/server/auth/session'
import { requirePermission, AuthError } from '@/src/server/auth/rbac'
import { ok, apiError } from '@/src/server/api/helpers'

// ---------------------------------------------------------------------------
// GET /api/admin/settings — Load store configuration
// ---------------------------------------------------------------------------

export async function GET(): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'settings:read')

    const settings = await prisma.setting.findMany()
    const map: Record<string, string> = {}
    for (const s of settings) {
      map[s.key] = s.value
    }

    return ok(map)
  } catch (error) {
    return apiError(error)
  }
}

// ---------------------------------------------------------------------------
// POST /api/admin/settings — Save store configuration
// ---------------------------------------------------------------------------

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const session = await getSession()
    if (!session) throw new AuthError()
    requirePermission(session.role, 'settings:write')

    const body = (await req.json()) as Record<string, unknown>

    for (const [key, val] of Object.entries(body)) {
      if (val !== undefined && val !== null) {
        await prisma.setting.upsert({
          where: { key },
          create: { key, value: String(val) },
          update: { value: String(val) },
        })
      }
    }

    return ok({ saved: true })
  } catch (error) {
    return apiError(error)
  }
}

