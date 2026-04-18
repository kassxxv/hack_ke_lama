export async function getTBToken(code: string): Promise<string> {
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
    throw new Error(`TB token error: ${res.status} ${err}`)
  }

  const data = await res.json() as { access_token: string }
  return data.access_token
}
