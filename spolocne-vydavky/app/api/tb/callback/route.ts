import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  const base = new URL(req.url).origin
  const code = req.nextUrl.searchParams.get('code')
  const error = req.nextUrl.searchParams.get('error')

  if (error || !code) {
    console.error('TB OAuth callback error:', error)
    return NextResponse.redirect(`${base}/?tb_error=1`)
  }

  const tokenRes = await fetch(process.env.TB_TOKEN_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.TB_REDIRECT_URI!,
      client_id: process.env.TB_CLIENT_ID!,
      client_secret: process.env.TB_CLIENT_SECRET!,
    }),
    cache: 'no-store',
  })

  if (!tokenRes.ok) {
    console.error('TB token exchange error:', await tokenRes.text())
    return NextResponse.redirect(`${base}/?tb_error=1`)
  }

  const data = await tokenRes.json() as {
    access_token: string
    refresh_token?: string
    expires_in: number
  }

  const cookieStore = await cookies()

  // Retrieve the consentId stored before redirecting to TB
  const consentId = cookieStore.get('tb_consent_pending')?.value

  cookieStore.set('tb_token', data.access_token, {
    httpOnly: true,
    maxAge: data.expires_in ?? 3600,
    path: '/',
    sameSite: 'lax',
  })

  if (data.refresh_token) {
    cookieStore.set('tb_refresh', data.refresh_token, {
      httpOnly: true,
      maxAge: 181 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    })
  }

  if (consentId) {
    cookieStore.set('tb_consent_id', consentId, {
      httpOnly: true,
      maxAge: 181 * 24 * 60 * 60,
      path: '/',
      sameSite: 'lax',
    })
    cookieStore.delete('tb_consent_pending')
  }

  return NextResponse.redirect(`${base}/?tb_connected=1`)
}
