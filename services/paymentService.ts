import type { PaymentIntent, ApiResponse } from '@/types'
import { calculatePaymentSplit } from '@/utils/payment'
import type { PaymentMethod, PlatformPricingSettings } from '@/lib/platformPricing'

/**
 * Payment provider interface — swap implementations for different gateways.
 * Currently uses mock mode; production-ready for Mercado Pago or Stripe.
 */
export interface IPaymentProvider {
  createPaymentIntent(params: CreatePaymentParams): Promise<ApiResponse<PaymentIntent>>
  confirmPayment(intentId: string, paymentData?: unknown): Promise<ApiResponse<PaymentIntent>>
  refund(chargeId: string, amount?: number): Promise<ApiResponse<{ refund_id: string }>>
}

export interface CreatePaymentParams {
  amount: number
  currency?: string
  description: string
  customerEmail: string
  /** Telefone do comprador (ex: "85999999999"). Enviado como additional_info.payer.phone ao MP. */
  customerPhone?: string
  paymentMethod?: 'card' | 'pix'
  metadata?: Record<string, string>
}

// ─────────────────────────────────────────
//  Mock Provider (Development / Demo)
// ─────────────────────────────────────────
const mockProvider: IPaymentProvider = {
  async createPaymentIntent(params) {
    await new Promise(r => setTimeout(r, 600))

    const intent: PaymentIntent = {
      id: `mock_pi_${Date.now()}`,
      amount: params.amount,
      currency: params.currency || 'BRL',
      status: 'pending',
      client_secret: `mock_secret_${Date.now()}`,
      provider: 'mock',
    }

    return { data: intent, error: null }
  },

  async confirmPayment(intentId) {
    await new Promise(r => setTimeout(r, 800))

    // 95% success rate in mock
    const success = Math.random() > 0.05
    if (!success) {
      return { data: null, error: 'Pagamento recusado. Tente outro cartão.' }
    }

    const intent: PaymentIntent = {
      id: intentId,
      amount: 0,
      currency: 'BRL',
      status: 'paid',
      provider: 'mock',
      provider_reference: `mock_charge_${Date.now()}`,
    }

    return { data: intent, error: null }
  },

  async refund() {
    await new Promise(r => setTimeout(r, 600))
    return { data: { refund_id: `mock_refund_${Date.now()}` }, error: null }
  },
}

// ─────────────────────────────────────────
//  Mercado Pago Provider (Production)
// ─────────────────────────────────────────
const mercadoPagoProvider: IPaymentProvider = {
  async createPaymentIntent(params) {
    try {
      const response = await fetch('/api/payments/pix', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
      })

      const payload = await response.json()
      if (!response.ok) {
        return { data: null, error: payload?.error || 'Erro ao criar pagamento PIX.' }
      }

      return { data: payload.data as PaymentIntent, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  async confirmPayment(intentId) {
    try {
      const response = await fetch('/api/payments/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intentId }),
      })

      const payload = await response.json()
      if (!response.ok) {
        return { data: null, error: payload?.error || 'Erro ao confirmar pagamento.' }
      }

      return { data: payload.data as PaymentIntent, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  async refund() {
    return { data: null, error: 'Mercado Pago não configurado' }
  },
}

// ─────────────────────────────────────────
//  Payment Service — public API
// ─────────────────────────────────────────
function getProvider(): IPaymentProvider {
  const demo = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

  if (demo) return mockProvider
  return mercadoPagoProvider
}

export const paymentService = {
  /**
   * Calculate the payment split before showing checkout
   */
  calculateSplit(instructorNetAmount: number, paymentMethod: PaymentMethod = 'pix', settings?: Partial<PlatformPricingSettings> | null) {
    return calculatePaymentSplit(instructorNetAmount, paymentMethod, settings)
  },

  /**
   * Create a payment intent for checkout.
   * Card payments are tokenized client-side via MercadoPagoCardBrick and go directly
   * to /api/payments — this method is only called for PIX.
   */
  async createPaymentIntent(params: CreatePaymentParams): Promise<ApiResponse<PaymentIntent>> {
    const provider = getProvider()
    return provider.createPaymentIntent(params)
  },

  /**
   * Confirm/process the payment
   */
  async confirmPayment(intentId: string, paymentData?: unknown): Promise<ApiResponse<PaymentIntent>> {
    if (intentId.startsWith('mock_')) {
      return mockProvider.confirmPayment(intentId, paymentData)
    }

    const provider = getProvider()
    return provider.confirmPayment(intentId, paymentData)
  },

  /**
   * Process a refund
   */
  async refund(chargeId: string, amount?: number) {
    const provider = getProvider()
    return provider.refund(chargeId, amount)
  },

  /**
   * Record payment in the database after successful charge
   */
  async recordPayment(params: {
    booking_id: string
    student_id: string
    amount: number
    provider: string
    provider_reference?: string
    paymentMethod?: PaymentMethod
    platformSettings?: Partial<PlatformPricingSettings> | null
  }) {
    const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    if (DEMO_MODE) return { data: { id: `demo-payment-${Date.now()}` }, error: null }

    const { platformFee, instructorNet } = calculatePaymentSplit(
      params.amount,
      params.paymentMethod || 'pix',
      params.platformSettings,
    )

    try {
      const { createBrowserClient } = await import('@supabase/ssr')
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('payments')
        .insert({
          ...params,
          platform_fee: platformFee,
          instructor_net: instructorNet,
          status: 'paid',
        })
        .select('id')
        .single()

      if (error) throw error
      return { data: { id: data.id }, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },
}
