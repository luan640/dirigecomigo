import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import type { PaymentIntent } from '@/types'
import { persistMercadoPagoPayment } from '@/lib/payments/mercadoPagoPersistence'

function mapMercadoPagoStatus(status?: string): PaymentIntent['status'] {
  switch (status) {
    case 'approved':
      return 'paid'
    case 'authorized':
    case 'in_process':
      return 'processing'
    case 'rejected':
    case 'cancelled':
      return 'failed'
    case 'refunded':
    case 'charged_back':
      return 'refunded'
    case 'pending':
    case 'in_mediation':
    default:
      return 'pending'
  }
}

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN não configurado.' }, { status: 500 })
    }

    const body = await req.json()
    const intentId = String(body?.intentId || '')

    if (!intentId) {
      return NextResponse.json({ error: 'intentId é obrigatório.' }, { status: 400 })
    }

    const client = new MercadoPagoConfig({ accessToken })
    const paymentClient = new Payment(client)
    const mpPayment = await paymentClient.get({ id: intentId })

    const intent: PaymentIntent = {
      id: String(mpPayment.id || intentId),
      amount: Number(mpPayment.transaction_amount || 0),
      currency: mpPayment.currency_id || 'BRL',
      status: mapMercadoPagoStatus(mpPayment.status),
      provider: 'mercadopago',
      provider_reference: String(mpPayment.id || intentId),
      pix_qr_code: mpPayment.point_of_interaction?.transaction_data?.qr_code,
      pix_qr_code_base64: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
      expires_at: mpPayment.date_of_expiration,
    }

    await persistMercadoPagoPayment({
      paymentId: String(mpPayment.id || intentId),
      amount: Number(mpPayment.transaction_amount || 0),
      currency: mpPayment.currency_id || 'BRL',
      status: intent.status,
      metadata: (mpPayment.metadata || {}) as Record<string, unknown>,
      payerEmail: mpPayment.payer?.email,
    })

    return NextResponse.json({ data: intent, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao confirmar pagamento.' }, { status: 500 })
  }
}
