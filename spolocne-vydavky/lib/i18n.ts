export type Lang = 'sk' | 'en'

export const T = {
  sk: {
    recentTx: 'Posledné pohyby',
    allTx: 'Všetky pohyby',
    sharedExpenses: 'Spoločné výdavky',
    cardPayment: 'Platba kartou',
    split: 'Rozdeliť',
    swipeLeft: 'potiahnuť doľava →',
    owedToYou: (amt: string) => `Dlhujú ti celkom ${amt} €`,
    youOwe: (amt: string) => `Dlhuješ celkom ${amt} €`,
    allSettled: 'Všetko vyrovnané 🎉',
    groups: (n: number) => n === 1 ? '1 skupina' : n < 5 ? `${n} skupiny` : `${n} skupín`,
    shareIban: 'Zdieľať IBAN',
    requestPayment: 'Vyžiadať platbu',
    atm: 'Výber z bankomatu',
    standingOrders: 'Trvalé príkazy',
    exportPdf: 'Exportovať\ndo PDF',
    splitExpense: 'Rozdeliť výdavok',
    pdfSoon: 'Export do PDF bude čoskoro dostupný',
    comingSoon: 'Táto funkcia bude čoskoro dostupná',
    balanceLabel: 'Účtovný zostatok platný k 18.04.2026 11:43',
    nav: { home: 'Domov', analytics: 'Prehľady', pay: 'Platba', cards: 'Karty', bank: 'Banka' },
  },
  en: {
    recentTx: 'Recent transactions',
    allTx: 'All transactions',
    sharedExpenses: 'Shared Expenses',
    cardPayment: 'Card payment',
    split: 'Split',
    swipeLeft: 'swipe left →',
    owedToYou: (amt: string) => `You are owed ${amt} €`,
    youOwe: (amt: string) => `You owe ${amt} €`,
    allSettled: 'All settled 🎉',
    groups: (n: number) => n === 1 ? '1 group' : `${n} groups`,
    shareIban: 'Share IBAN',
    requestPayment: 'Request payment',
    atm: 'ATM withdrawal',
    standingOrders: 'Standing orders',
    exportPdf: 'Export\nto PDF',
    splitExpense: 'Split expense',
    pdfSoon: 'PDF export coming soon',
    comingSoon: 'This feature is coming soon',
    balanceLabel: 'Account balance as of 18.04.2026 11:43',
    nav: { home: 'Home', analytics: 'Analytics', pay: 'Pay', cards: 'Cards', bank: 'Bank' },
  },
} satisfies Record<Lang, object>

export function getLang(cookieValue?: string): Lang {
  return cookieValue === 'en' ? 'en' : 'sk'
}
