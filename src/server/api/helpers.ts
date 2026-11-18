import { NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { Prisma } from '@prisma/client'
import {
  AuthError,
  PermissionError,
  NotFoundError,
  ValidationError,
  ConflictError,
} from '@/src/server/auth/rbac'

// ---------------------------------------------------------------------------
// Standard API response helpers
// ---------------------------------------------------------------------------

export function ok<T>(data: T, status = 200) {
  return NextResponse.json({ success: true, data }, { status })
}

export function created<T>(data: T) {
  return NextResponse.json({ success: true, data }, { status: 201 })
}

export function noContent() {
  return new NextResponse(null, { status: 204 })
}

// ---------------------------------------------------------------------------
// Error handler — catches all known error types
// ---------------------------------------------------------------------------

export function apiError(error: unknown): NextResponse {
  console.error('[API Error]', error)

  if (error instanceof ZodError) {
    // First issue as a readable message; full list for forms that map fields
    return NextResponse.json(
      { success: false, error: error.issues[0]?.message ?? 'Please check the form', issues: error.issues },
      { status: 422 }
    )
  }

  if (error instanceof AuthError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 401 })
  }

  if (error instanceof PermissionError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 403 })
  }

  if (error instanceof NotFoundError) {
    return NextResponse.json({ success: false, error: error.message }, { status: 404 })
  }

  if (error instanceof ValidationError) {
    return NextResponse.json(
      { success: false, error: error.message, issues: error.issues },
      { status: 422 }
    )
  }

  if (error instanceof ConflictError) {
    return NextResponse.json(
      { success: false, error: error.message, code: error.code },
      { status: 409 }
    )
  }

  // Common database errors → clear messages instead of a bare 500
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      return NextResponse.json({ success: false, error: 'Something with that name or code already exists.' }, { status: 409 })
    }
    if (error.code === 'P2003') {
      return NextResponse.json({ success: false, error: 'This is still used by other records, so it can’t be removed.' }, { status: 409 })
    }
    if (error.code === 'P2025') {
      return NextResponse.json({ success: false, error: 'Not found. It may have been removed already.' }, { status: 404 })
    }
  }

  // Unknown error — don't leak details in production
  const message =
    process.env.NODE_ENV === 'development' && error instanceof Error
      ? error.message
      : 'Internal server error'

  return NextResponse.json({ success: false, error: message }, { status: 500 })
}

// ---------------------------------------------------------------------------
// Route wrapper — catches errors automatically
// ---------------------------------------------------------------------------

type RouteHandler = (req: Request, ctx: { params: Promise<Record<string, string>> }) => Promise<NextResponse>

export function withErrorHandler(handler: RouteHandler): RouteHandler {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx)
    } catch (error) {
      return apiError(error)
    }
  }
}

// ---------------------------------------------------------------------------
// Pagination helper
// ---------------------------------------------------------------------------

export interface PaginationParams {
  page: number
  pageSize: number
  skip: number
  take: number
}

export function getPagination(searchParams: URLSearchParams, defaultPageSize = 20): PaginationParams {
  const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') ?? String(defaultPageSize))))
  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

// ---------------------------------------------------------------------------
// Require auth helper (throws AuthError if no session)
// ---------------------------------------------------------------------------

export function requireAuth(session: { userId: string; role: string } | null): asserts session is { userId: string; role: string } {
  if (!session) throw new AuthError()
}

