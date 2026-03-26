import { PLATFORM_CONFIG } from '@/constants/pricing'

export type PlatformPricingSettings = {
  platform_fee_percent: number
  pix_fee_percent: number
  card_fee_percent: number
  subscription_price: number
}

export type PaymentMethod = 'pix' | 'card'

export type PaymentSplit = {
  gross: number
  platformFee: number
  paymentMethodFee: number
  instructorNet: number
  platformFeeRate: number
  paymentMethodRate: number
  totalExtraRate: number
  commissionRate: number
}

export const DEFAULT_PLATFORM_PRICING_SETTINGS: PlatformPricingSettings = {
  platform_fee_percent: PLATFORM_CONFIG.DEFAULT_PLATFORM_FEE_PERCENT,
  pix_fee_percent: PLATFORM_CONFIG.DEFAULT_PIX_FEE_PERCENT,
  card_fee_percent: PLATFORM_CONFIG.DEFAULT_CARD_FEE_PERCENT,
  subscription_price: PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE,
}

function roundCurrency(value: number) {
  return Math.round(value * 100) / 100
}

function normalizePercent(value: unknown, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed)) return fallback
  return Math.min(100, Math.max(0, parsed))
}

function normalizePrice(value: unknown, fallback: number) {
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed <= 0) return fallback
  return Math.round(parsed * 100) / 100
}

export function normalizePlatformPricingSettings(raw?: Partial<PlatformPricingSettings> | null): PlatformPricingSettings {
  return {
    platform_fee_percent: normalizePercent(raw?.platform_fee_percent, DEFAULT_PLATFORM_PRICING_SETTINGS.platform_fee_percent),
    pix_fee_percent: normalizePercent(raw?.pix_fee_percent, DEFAULT_PLATFORM_PRICING_SETTINGS.pix_fee_percent),
    card_fee_percent: normalizePercent(raw?.card_fee_percent, DEFAULT_PLATFORM_PRICING_SETTINGS.card_fee_percent),
    subscription_price: normalizePrice(raw?.subscription_price, DEFAULT_PLATFORM_PRICING_SETTINGS.subscription_price),
  }
}

export function getPaymentMethodFeeRate(
  paymentMethod: PaymentMethod,
  settings?: Partial<PlatformPricingSettings> | null,
): number {
  const normalized = normalizePlatformPricingSettings(settings)
  return paymentMethod === 'card' ? normalized.card_fee_percent : normalized.pix_fee_percent
}

export function calculatePlatformPaymentSplit(
  instructorNetAmount: number,
  paymentMethod: PaymentMethod = 'pix',
  settings?: Partial<PlatformPricingSettings> | null,
): PaymentSplit {
  const instructorNet = roundCurrency(Math.max(0, Number(instructorNetAmount) || 0))
  const normalized = normalizePlatformPricingSettings(settings)
  const platformFeeRate = normalized.platform_fee_percent
  const paymentMethodRate = getPaymentMethodFeeRate(paymentMethod, normalized)
  const totalExtraRate = platformFeeRate + paymentMethodRate

  // Platform fee is a markup on the instructor net
  const platformFee = roundCurrency(instructorNet * (platformFeeRate / 100))
  // Base amount the platform needs to receive (PIX-equivalent price)
  const baseAmount = roundCurrency(instructorNet + platformFee)

  // Payment method fee is applied on the gross by the provider (e.g. MP charges 4.98% on total)
  // So: gross = baseAmount / (1 - paymentMethodRate/100)
  const gross = paymentMethodRate > 0
    ? roundCurrency(baseAmount / (1 - paymentMethodRate / 100))
    : baseAmount
  const paymentMethodFee = roundCurrency(gross - baseAmount)

  return {
    gross,
    platformFee,
    paymentMethodFee,
    instructorNet,
    platformFeeRate,
    paymentMethodRate,
    totalExtraRate,
    commissionRate: totalExtraRate / 100,
  }
}

export function applyAmountToPlatformPaymentSplit(baseSplit: PaymentSplit, finalGrossAmount: number): PaymentSplit {
  const gross = roundCurrency(Math.max(0, Number(finalGrossAmount) || 0))
  const instructorNet = roundCurrency(Math.min(baseSplit.instructorNet, gross))
  const defaultExtras = baseSplit.platformFee + baseSplit.paymentMethodFee
  const currentExtras = Math.max(0, gross - instructorNet)
  const ratio = defaultExtras > 0 ? currentExtras / defaultExtras : 0
  const platformFee = roundCurrency(baseSplit.platformFee * ratio)
  const paymentMethodFee = roundCurrency(Math.max(0, currentExtras - platformFee))

  return {
    ...baseSplit,
    gross,
    instructorNet,
    platformFee,
    paymentMethodFee,
  }
}
