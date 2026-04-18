import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    console.error('TB OAuth error:', error)
    return NextResponse.redirect(new URL('/?tb_error=1', req.url))
  }

  const body = new URLSearchParams({
    grant_type: 'authorization_code',
    code,
    redirect_uri: process.env.TB_REDIRECT_URI!,
    client_id: process.env.TB_CLIENT_ID!,
    client_secret: process.env.TB_CLIENT_SECRET!,
  })

  const res = await fetch('https://api.tatrabanka.sk/tatrapayplus/sandbox/auth/oauth/v2/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
    cache: 'no-store',
  })

  if (!res.ok) {
    const err = await res.text()
    console.error('TB token exchange error:', err)
    return NextResponse.redirect(new URL('/?tb_error=1', req.url))
  }

  const data = await res.json() as { access_token: string; expires_in: number }
  const cookieStore = await cookies()
  cookieStore.set('tb_token', data.access_token, {
    httpOnly: true,
    maxAge: data.expires_in ?? 3600,
    path: '/',
    sameSite: 'lax',
  })

  return NextResponse.redirect(new URL('/?tb_connected=1', req.url))
}
