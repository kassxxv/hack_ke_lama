import { NextResponse } from 'next/server'

// PSD2 sandbox: skip consent, go directly to authorize without scope
export async function GET() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.TB_CLIENT_ID!,
    redirect_uri: process.env.TB_REDIRECT_URI!,
    scope: 'AISP',
    state: 'hackathon2026',
  })

  return NextResponse.redirect(`${process.env.TB_AUTHORIZE_URL}?${params}`)
}
