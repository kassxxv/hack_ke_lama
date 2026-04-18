import { NextResponse } from 'next/server'

// AISP requires authorization_code flow — user must consent to share account data
export async function GET() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TB_CLIENT_ID!,
    redirect_uri: process.env.TB_REDIRECT_URI!,
    scope: 'AISP',
    state: 'hackathon2026',
  })

  const authorizeUrl = `https://api.tatrabanka.sk/tatrapayplus/sandbox/auth/oauth/v2/authorize?${params}`
  return NextResponse.redirect(authorizeUrl)
}
