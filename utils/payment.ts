import { PLATFORM_CONFIG } from '@/constants/pricing'

/**
 * Calculate platform fee and instructor net amount for a lesson
 */
export function calculatePaymentSplit(grossAmount: number): {
  gross: number
  platformFee: number
  instructorNet: number
  commissionRate: number
} {
  const platformFee = Math.round(grossAmount * PLATFORM_CONFIG.COMMISSION_RATE * 100) / 100
  const instructorNet = Math.round((grossAmount - platformFee) * 100) / 100

  return {
    gross: grossAmount,
    platformFee,
    instructorNet,
    commissionRate: PLATFORM_CONFIG.COMMISSION_RATE,
  }
}

/**
 * Format a BRL currency value
 */
export function formatBRL(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Calculate monthly platform earnings from lessons
 */
export function calculateMonthlyPlatformRevenue(
  totalLessonsGross: number,
  subscriptions: number
): { fromCommissions: number; fromSubscriptions: number; total: number } {
  const fromCommissions = Math.round(totalLessonsGross * PLATFORM_CONFIG.COMMISSION_RATE * 100) / 100
  const fromSubscriptions = subscriptions * PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE

  return {
    fromCommissions,
    fromSubscriptions,
    total: fromCommissions + fromSubscriptions,
  }
}
