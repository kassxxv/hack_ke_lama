import { NextResponse } from 'next/server'

// Step 1: Create consent using client_credentials
// Step 2: Redirect user to TB authorize URL with consentId
export async function GET() {
  try {
    // Get client_credentials token for consent creation
    const tokenRes = await fetch(`${process.env.TB_TOKEN_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: process.env.TB_CLIENT_ID!,
        client_secret: process.env.TB_CLIENT_SECRET!,
      }),
      cache: 'no-store',
    })

    if (!tokenRes.ok) {
      const err = await tokenRes.text()
      console.error('TB client_credentials error:', err)
      return NextResponse.redirect(new URL('/?tb_error=consent', process.env.TB_REDIRECT_URI!))
    }

    const { access_token } = await tokenRes.json() as { access_token: string }

    // Create global consent (allAccounts)
    const consentRes = await fetch(`${process.env.TB_ACCOUNTS_BASE}/consents`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${access_token}`,
        'Content-Type': 'application/json',
        'X-Request-ID': crypto.randomUUID(),
        'TPP-Redirect-URI': process.env.TB_REDIRECT_URI!,
      },
      body: JSON.stringify({
        access: { allPsd2: 'allAccounts' },
        recurringIndicator: true,
        validUntil: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        frequencyPerDay: 4,
        combinedServiceIndicator: false,
      }),
    })

    if (!consentRes.ok) {
      const err = await consentRes.text()
      console.error('TB consent error:', err)
      // Fall back to direct authorize without consent
      const params = new URLSearchParams({
        response_type: 'code',
        client_id: process.env.TB_CLIENT_ID!,
        redirect_uri: process.env.TB_REDIRECT_URI!,
        scope: 'AISP',
        state: 'hackathon2026',
      })
      return NextResponse.redirect(`${process.env.TB_AUTHORIZE_URL}?${params}`)
    }

    const consent = await consentRes.json() as { consentId: string; _links?: { scaRedirect?: { href: string } } }

    // If TB returns a direct SCA redirect link, use it
    if (consent._links?.scaRedirect?.href) {
      return NextResponse.redirect(consent._links.scaRedirect.href)
    }

    // Otherwise build the authorize URL with consentId
    const params = new URLSearchParams({
      response_type: 'code',
      client_id: process.env.TB_CLIENT_ID!,
      redirect_uri: process.env.TB_REDIRECT_URI!,
      scope: 'AISP',
      state: 'hackathon2026',
      consentId: consent.consentId,
    })

    return NextResponse.redirect(`${process.env.TB_AUTHORIZE_URL}?${params}`)
  } catch (e) {
    console.error('TB auth error:', e)
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
