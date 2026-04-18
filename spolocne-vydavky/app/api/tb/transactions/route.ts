import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export type TBTransaction = {
  transactionId: string
  bookingDate: string
  transactionAmount: { amount: string; currency: string }
  creditorName?: string
  debtorName?: string
  remittanceInformationUnstructured?: string
  proprietaryBankTransactionCode?: string
}

export async function GET() {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get('tb_token')?.value
    if (!token) return NextResponse.json({ transactions: getMockTransactions(), source: 'mock' })

    // Fetch accounts list first to get account ID
    const accountsRes = await fetch(`${process.env.TB_ACCOUNTS_BASE}/accounts`, {
      headers: {
        Authorization: `Bearer ${token}`,
        'X-Request-ID': crypto.randomUUID(),
        'Content-Type': 'application/json',
      },
    })

    if (!accountsRes.ok) {
      const err = await accountsRes.text()
      console.error('TB accounts error:', err)
      // Fall back to mock data if API not available yet
      return NextResponse.json({ transactions: getMockTransactions(), source: 'mock' })
    }

    const accountsData = await accountsRes.json()
    const accountId = accountsData?.accounts?.[0]?.resourceId ?? accountsData?.accounts?.[0]?.iban

    if (!accountId) {
      return NextResponse.json({ transactions: getMockTransactions(), source: 'mock' })
    }

    const txRes = await fetch(
      `${process.env.TB_ACCOUNTS_BASE}/accounts/${accountId}/transactions?bookingStatus=booked&dateFrom=2026-04-01`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'X-Request-ID': crypto.randomUUID(),
          'Content-Type': 'application/json',
        },
      }
    )

    if (!txRes.ok) {
      return NextResponse.json({ transactions: getMockTransactions(), source: 'mock' })
    }

    const txData = await txRes.json()
    const raw: TBTransaction[] = txData?.transactions?.booked ?? txData?.transactions ?? []

    const transactions = raw.map(tx => ({
      id: tx.transactionId,
      merchant: tx.creditorName ?? tx.remittanceInformationUnstructured ?? 'Neznámy obchodník',
      amount: parseFloat(tx.transactionAmount.amount),
      date: new Date(tx.bookingDate).toLocaleDateString('sk-SK', { day: 'numeric', month: 'long', year: 'numeric' }),
      category: guessCategory(tx.creditorName ?? ''),
      canSplit: true,
    }))

    return NextResponse.json({ transactions, source: 'live' })
  } catch (e) {
    console.error('TB API error:', e)
    return NextResponse.json({ transactions: getMockTransactions(), source: 'mock' })
  }
}

function guessCategory(merchant: string): string {
  const m = merchant.toLowerCase()
  if (m.includes('kaufland') || m.includes('lidl') || m.includes('tesco') || m.includes('billa')) return 'Potraviny'
  if (m.includes('shell') || m.includes('benzin') || m.includes('tank') || m.includes('mol')) return 'Doprava'
  if (m.includes('netflix') || m.includes('spotify') || m.includes('youtube')) return 'Predplatné'
  if (m.includes('cinema') || m.includes('kino') || m.includes('theatre')) return 'Zábava'
  return 'Iné'
}

function getMockTransactions() {
  return [
    { id: 't1', merchant: 'KAUFLAND Poprad', amount: -12.33, date: '18. apríl 2026', category: 'Potraviny', canSplit: true },
    { id: 't2', merchant: 'Shell — Ružomberok', amount: -48.00, date: '17. apríl 2026', category: 'Doprava', canSplit: true },
    { id: 't3', merchant: 'Tatranská Lomnica', amount: -89.00, date: '16. apríl 2026', category: 'Zábava', canSplit: true },
    { id: 't4', merchant: 'Lidl Košice', amount: -23.45, date: '15. apríl 2026', category: 'Potraviny', canSplit: true },
    { id: 't5', merchant: 'Netflix', amount: -15.99, date: '1. apríl 2026', category: 'Predplatné', canSplit: true },
  ]
}
