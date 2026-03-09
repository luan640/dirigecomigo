import { PLATFORM_CONFIG } from '@/constants/pricing'
import {
  applyAmountToPlatformPaymentSplit,
  calculatePlatformPaymentSplit,
  type PaymentMethod,
  type PaymentSplit,
  type PlatformPricingSettings,
} from '@/lib/platformPricing'

/**
 * Calculate platform fee and instructor net amount for a lesson
 */
export function calculatePaymentSplit(
  instructorNetAmount: number,
  paymentMethod: PaymentMethod = 'pix',
  settings?: Partial<PlatformPricingSettings> | null,
): PaymentSplit {
  return calculatePlatformPaymentSplit(instructorNetAmount, paymentMethod, settings)
}

export function applyAmountToPaymentSplit(split: PaymentSplit, finalGrossAmount: number): PaymentSplit {
  return applyAmountToPlatformPaymentSplit(split, finalGrossAmount)
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
  const fromCommissions = 0
  void totalLessonsGross
  const fromSubscriptions = subscriptions * PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE

  return {
    fromCommissions,
    fromSubscriptions,
    total: fromCommissions + fromSubscriptions,
  }
}
