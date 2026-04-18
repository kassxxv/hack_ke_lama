import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET() {
  const base = new URL(process.env.TB_REDIRECT_URI!).origin
  const basicAuth = Buffer.from(`${process.env.TB_CLIENT_ID!}:${process.env.TB_CLIENT_SECRET!}`).toString('base64')

  // client_credentials with Basic auth header (required by some OAuth servers)
  const ccRes = await fetch(process.env.TB_TOKEN_URL!, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: `Basic ${basicAuth}`,
    },
    body: new URLSearchParams({ grant_type: 'client_credentials' }),
    cache: 'no-store',
  })

  if (!ccRes.ok) {
    console.error('TB client_credentials error:', await ccRes.text())
    return NextResponse.redirect(`${base}/?tb_error=1`)
  }

  const { access_token: appToken } = await ccRes.json() as { access_token: string }

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
  const cookieStore = await cookies()
  cookieStore.set('tb_consent_pending', consentId, {
    httpOnly: true,
    maxAge: 600,
    path: '/',
    sameSite: 'lax',
  })

  // TB authorize URL requires scope=AIS:<consentId> (not just AIS)
  const scaBase = consentData._links?.scaRedirect?.href
  const authorizeUrl = new URL(scaBase ?? process.env.TB_AUTHORIZE_URL!)
  authorizeUrl.searchParams.set('response_type', 'code')
  authorizeUrl.searchParams.set('redirect_uri', process.env.TB_REDIRECT_URI!)
  authorizeUrl.searchParams.set('state', 'hackathon2026')

  return NextResponse.redirect(authorizeUrl.toString())
}
