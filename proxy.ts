import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { jwtVerify } from 'jose'

// ---------------------------------------------------------------------------
// Optimistic admin gate: anyone without a valid, unexpired session token is
// sent to /admin/login before an admin page renders. Roles and revocation are
// still enforced by every /api/admin route (which checks the DB session), and
// the admin layout redirects signed-in customers away.
// ---------------------------------------------------------------------------

const SESSION_COOKIE = 'aval_session'

function secret(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? 'dev_jwt_secret_change_in_production_32byteslong!!'
  )
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl
  if (pathname === '/admin/login') return NextResponse.next()

  const token = request.cookies.get(SESSION_COOKIE)?.value
  if (token) {
    try {
      await jwtVerify(token, secret())
      return NextResponse.next()
    } catch {
      // invalid or expired — fall through to login
    }
  }

  const login = new URL('/admin/login', request.url)
  if (pathname !== '/admin') login.searchParams.set('next', pathname)
  return NextResponse.redirect(login)
}

export const config = {
  matcher: ['/admin', '/admin/:path*'],
}
