import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(_req: NextRequest) {
  const base = new URL(process.env.TB_REDIRECT_URI!).origin

  // Step 1: client_credentials token (app-level, not user)
  const ccRes = await fetch(process.env.TB_TOKEN_URL!, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.TB_CLIENT_ID!,
      client_secret: process.env.TB_CLIENT_SECRET!,
    }),
    cache: 'no-store',
  })

  if (!ccRes.ok) {
    console.error('TB client_credentials error:', await ccRes.text())
    return NextResponse.redirect(`${base}/?tb_error=1`)
  }

  const { access_token: appToken } = await ccRes.json() as { access_token: string }

  // Step 2: create consent — returns consentId + scaRedirect URL
  const consentRes = await fetch(`${process.env.TB_ACCOUNTS_BASE}/consents`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${appToken}`,
      'Content-Type': 'application/json',
      'X-Request-ID': crypto.randomUUID(),
      'PSU-IP-Address': '127.0.0.1',
    },
    body: JSON.stringify({
      access: { allPsd2: 'allAccounts' },
      recurringIndicator: true,
      validUntil: '2026-04-20',
      frequencyPerDay: 4,
    }),
    cache: 'no-store',
  })

  if (!consentRes.ok) {
    console.error('TB consent creation error:', await consentRes.text())
    return NextResponse.redirect(`${base}/?tb_error=1`)
  }

  const consentData = await consentRes.json() as {
    consentId: string
    _links: { scaRedirect?: { href: string } }
  }

  const { consentId } = consentData
  const scaBase = consentData._links?.scaRedirect?.href

  // Store consentId in cookie so callback can retrieve it
  const cookieStore = await cookies()
  cookieStore.set('tb_consent_pending', consentId, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })

  // Step 3: redirect to scaRedirect URL with extra OAuth params
  // scaRedirect already contains client_id + scope=AIS:<consentId>
  const authorizeUrl = new URL(scaBase ?? process.env.TB_AUTHORIZE_URL!)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('redirect_uri', process.env.TB_REDIRECT_URI!)
  authorizeUrl.searchParams.set('state', 'hackathon2026')

  return NextResponse.redirect(authorizeUrl.toString())
}
