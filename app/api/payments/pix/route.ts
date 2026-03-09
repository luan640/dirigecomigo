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
    const amount = Number(body?.amount)
    const description = String(body?.description || 'Pagamento Direcao Facil')
    const customerEmail = String(body?.customerEmail || '')
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {}

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido para pagamento.' }, { status: 400 })
    }

    if (!customerEmail) {
      return NextResponse.json({ error: 'E-mail do cliente é obrigatório.' }, { status: 400 })
    }

    const client = new MercadoPagoConfig({ accessToken })
    const paymentClient = new Payment(client)

    const notificationBaseUrl = process.env.NEXT_PUBLIC_APP_URL
    let notificationUrl: string | undefined
    if (notificationBaseUrl) {
      try {
        const parsed = new URL(notificationBaseUrl)
        const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:'
        const isLocalhost =
          parsed.hostname === 'localhost' ||
          parsed.hostname === '127.0.0.1' ||
          parsed.hostname.endsWith('.local')

        if (isHttp && !isLocalhost) {
          notificationUrl = `${notificationBaseUrl.replace(/\/$/, '')}/api/webhooks/mercadopago`
        }
      } catch {
        notificationUrl = undefined
      }
    }

    const mpPayment = await paymentClient.create({
      body: {
        transaction_amount: amount,
        description,
        payment_method_id: 'pix',
        payer: {
          email: customerEmail,
        },
        external_reference: String(metadata?.slotId || `pix_${Date.now()}`),
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
        metadata,
      },
    })

    const intent: PaymentIntent = {
      id: String(mpPayment.id || ''),
      amount: Number(mpPayment.transaction_amount || amount),
      currency: mpPayment.currency_id || 'BRL',
      status: mapMercadoPagoStatus(mpPayment.status),
      provider: 'mercadopago',
      provider_reference: String(mpPayment.id || ''),
      pix_qr_code: mpPayment.point_of_interaction?.transaction_data?.qr_code,
      pix_qr_code_base64: mpPayment.point_of_interaction?.transaction_data?.qr_code_base64,
      expires_at: mpPayment.date_of_expiration,
    }

    await persistMercadoPagoPayment({
      paymentId: String(mpPayment.id || ''),
      amount: Number(mpPayment.transaction_amount || amount),
      currency: mpPayment.currency_id || 'BRL',
      status: intent.status,
      metadata: (mpPayment.metadata || metadata) as Record<string, unknown>,
      payerEmail: customerEmail,
    })

    return NextResponse.json({ data: intent, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao criar PIX.' }, { status: 500 })
  }
}
