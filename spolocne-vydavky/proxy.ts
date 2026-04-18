import { NextRequest, NextResponse } from 'next/server'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  const isPublic =
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/api/auth') ||
    pathname.startsWith('/api/seed') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon')

  if (isPublic) return NextResponse.next()

  const userId = req.cookies.get('sv_user_id')?.value
  if (!userId) {
    return NextResponse.redirect(new URL('/onboarding', req.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
