import { NextResponse } from 'next/server'

export async function GET() {
  try {
    // Step 1: get client_credentials token for consent
    const tokenRes = await fetch(`${process.env.TB_TOKEN_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.TB_CLIENT_ID!,
        client_secret: process.env.TB_CLIENT_SECRET!,
        scope: 'AISP',
      }),
      cache: 'no-store',
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('TB cc token error:', tokenRes.status, err)
      // Fall back to direct authorize
      return buildAuthorizeRedirect()
    }

    const { access_token } = await tokenRes.json() as { access_token: string }

    // Step 2: create consent
    const consentRes = await fetch(`${process.env.TB_ACCOUNTS_BASE}/consents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': crypto.randomUUID(),
        'TPP-Redirect-URI': process.env.TB_REDIRECT_URI!,
        'TPP-Redirect-Preferred': 'true',
      },
      body: JSON.stringify({
        access: { allPsd2: 'allAccounts' },
        recurringIndicator: true,
        validUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequencyPerDay: 4,
        combinedServiceIndicator: false,
      }),
    })

    const consentText = await consentRes.text()
    console.log('TB consent response:', consentRes.status, consentText)

    if (!consentRes.ok) {
      console.error('TB consent failed, trying direct authorize')
      return buildAuthorizeRedirect()
    }

    const consent = JSON.parse(consentText) as { consentId?: string; _links?: { scaRedirect?: { href: string } } }

    // Use scaRedirect if provided (sandbox gives this directly)
    if (consent._links?.scaRedirect?.href) {
      return NextResponse.redirect(consent._links.scaRedirect.href)
    }

    return buildAuthorizeRedirect(consent.consentId)
  } catch (e) {
    console.error('TB auth error:', e)
    return buildAuthorizeRedirect()
  }
}

function buildAuthorizeRedirect(consentId?: string) {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TB_CLIENT_ID!,
    redirect_uri: process.env.TB_REDIRECT_URI!,
    scope: 'AISP',
    state: 'hackathon2026',
  })
  if (consentId) params.set('consentId', consentId)
  return NextResponse.redirect(`${process.env.TB_AUTHORIZE_URL}?${params}`)
}
