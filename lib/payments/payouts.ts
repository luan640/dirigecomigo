import { addDays } from 'date-fns'

export type WalletReleaseStatus = 'available' | 'pending'

export type WalletPayoutEntry = {
  amount: number
  lessonDate: string
  endTime: string
  bookingStatus: string
  paymentStatus: string
}

export type PayoutRequestBalanceRow = {
  amount: number
  status: string
}

export function isBusinessDay(date: Date) {
  const day = date.getDay()
  return day !== 0 && day !== 6
}

export function addBusinessDays(date: Date, businessDays: number) {
  let current = new Date(date)
  let added = 0

  while (added < businessDays) {
    current = addDays(current, 1)
    if (isBusinessDay(current)) {
      added += 1
    }
  }

  return current
}

export function getWalletReleaseDate(lessonDate: string, endTime: string) {
  if (!lessonDate) return null
  const lessonEndAt = endTime
    ? new Date(`${lessonDate}T${endTime}`)
    : new Date(`${lessonDate}T23:59:59`)

  if (Number.isNaN(lessonEndAt.getTime())) return null
  return addBusinessDays(lessonEndAt, 5)
}

export function getWalletReleaseStatus(entry: WalletPayoutEntry): {
  releaseAt: string
  releaseStatus: WalletReleaseStatus
} {
  const paymentStatus = String(entry.paymentStatus || '').toLowerCase()
  const bookingStatus = String(entry.bookingStatus || '').toLowerCase()

  if (paymentStatus !== 'paid' && paymentStatus !== 'approved') {
    return { releaseAt: '', releaseStatus: 'pending' }
  }

  const releaseAtDate = getWalletReleaseDate(entry.lessonDate, entry.endTime)
  const releaseStatus: WalletReleaseStatus =
    bookingStatus === 'completed' &&
    releaseAtDate !== null &&
    releaseAtDate <= new Date()
      ? 'available'
      : 'pending'

  return {
    releaseAt: releaseAtDate ? releaseAtDate.toISOString() : '',
    releaseStatus,
  }
}

export function computePayoutBalances(entries: WalletPayoutEntry[], requests: PayoutRequestBalanceRow[]) {
  const normalizedEntries = entries
    .map(entry => ({
      amount: Number(entry.amount || 0),
      ...getWalletReleaseStatus(entry),
    }))
    .filter(entry => Number.isFinite(entry.amount) && entry.amount > 0)

  const releasedBalance = normalizedEntries
    .filter(entry => entry.releaseStatus === 'available')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const pendingReleaseBalance = normalizedEntries
    .filter(entry => entry.releaseStatus === 'pending')
    .reduce((sum, entry) => sum + entry.amount, 0)

  const totalReceived = normalizedEntries.reduce((sum, entry) => sum + entry.amount, 0)

  const reservedBalance = requests
    .filter(request => ['pending', 'processing'].includes(String(request.status || '').toLowerCase()))
    .reduce((sum, request) => sum + Number(request.amount || 0), 0)

  const paidOutBalance = requests
    .filter(request => String(request.status || '').toLowerCase() === 'paid')
    .reduce((sum, request) => sum + Number(request.amount || 0), 0)

  return {
    releasedBalance,
    pendingReleaseBalance,
    reservedBalance,
    paidOutBalance,
    totalReceived,
    availableToWithdraw: Math.max(0, releasedBalance - reservedBalance - paidOutBalance),
  }
}
