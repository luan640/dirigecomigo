import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
}

function resolveNotificationUrl(req: Request): string | undefined {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const forwardedProto = req.headers.get('x-forwarded-proto')
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host')

  const requestOrigin =
    forwardedProto && forwardedHost
      ? `${forwardedProto.split(',')[0].trim()}://${forwardedHost.split(',')[0].trim()}`
      : appUrl || ''

  try {
    const parsed = new URL(requestOrigin)
    const isHttps = parsed.protocol === 'https:'
    const isLocalhost =
      parsed.hostname === 'localhost' ||
      parsed.hostname === '127.0.0.1' ||
      parsed.hostname.endsWith('.local')

    if (!isHttps || isLocalhost) return undefined
    return `${parsed.toString().replace(/\/$/, '')}/api/webhooks/mercadopago`
  } catch {
    return undefined
  }
}

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN nao configurado.' }, { status: 500 })
    }

    const body = await req.json()
    const amount = Number(body?.amount || 0)
    const description = String(body?.description || 'Pagamento MeuInstrutor')
    const metadata = isRecord(body?.metadata) ? body.metadata : {}
    const rawFormData = isRecord(body?.formData) ? body.formData : {}
    const inputEmail = String(body?.customerEmail || '').trim()
    const isTestMode = accessToken.startsWith('TEST-')

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor invalido para pagamento.' }, { status: 400 })
    }

    const paymentMethodId = String(rawFormData.payment_method_id || rawFormData.paymentMethodId || '').trim()
    const token = String(rawFormData.token || '').trim()
    const installments = Number(rawFormData.installments || 1)
    const issuerId = String(rawFormData.issuer_id || rawFormData.issuerId || '').trim()
    const rawPayer = isRecord(rawFormData.payer) ? rawFormData.payer : {}
    const rawIdentification = isRecord(rawPayer.identification) ? rawPayer.identification : {}
    const identificationType = String(
      rawIdentification.type || rawFormData.identificationType || rawFormData.identification_type || '',
    ).trim()
    const identificationNumber = String(
      rawIdentification.number || rawFormData.identificationNumber || rawFormData.identification_number || '',
    ).trim()
    const cardholderName = String(rawFormData.cardholderName || rawFormData.cardholder_name || '').trim()
    const payerEmail =
      isTestMode && inputEmail.toLowerCase().endsWith('@testuser.com')
        ? `checkout.bricks.${Date.now()}@example.com`
        : inputEmail

    if (!paymentMethodId || !token) {
      return NextResponse.json({ error: 'Dados do cartao nao foram gerados pelo Brick.' }, { status: 400 })
    }

    if (!payerEmail) {
      return NextResponse.json({ error: 'E-mail do cliente e obrigatorio.' }, { status: 400 })
    }

    const [firstName, ...lastNameParts] = cardholderName.split(' ').filter(Boolean)
    const notificationUrl = resolveNotificationUrl(req)

    const paymentBody: Record<string, unknown> = {
      transaction_amount: amount,
      description,
      token,
      installments: Number.isFinite(installments) && installments > 0 ? installments : 1,
      payment_method_id: paymentMethodId,
      payer: {
        email: payerEmail,
        ...(firstName ? { first_name: firstName } : {}),
        ...(lastNameParts.length ? { last_name: lastNameParts.join(' ') } : {}),
        ...(identificationType && identificationNumber
          ? {
              identification: {
                type: identificationType,
                number: identificationNumber,
              },
            }
          : {}),
      },
      external_reference: String(metadata.slotId || metadata.bookingId || `lesson_${Date.now()}`),
      metadata,
      binary_mode: true,
    }

    if (issuerId) {
      paymentBody.issuer_id = Number(issuerId)
    }

    if (notificationUrl) {
      paymentBody.notification_url = notificationUrl
    }

    const mpResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        'X-Idempotency-Key': randomUUID(),
      },
      body: JSON.stringify(paymentBody),
    })

    const mpPayment = await mpResponse.json()
    if (!mpResponse.ok) {
      const cause = Array.isArray(mpPayment?.cause) ? mpPayment.cause[0] : null
      const errorMessage =
        cause?.description || mpPayment?.message || 'Mercado Pago recusou o pagamento com cartao.'
      return NextResponse.json({ error: String(errorMessage) }, { status: mpResponse.status })
    }

    const intent: PaymentIntent = {
      id: String(mpPayment.id || ''),
      amount: Number(mpPayment.transaction_amount || amount),
      currency: mpPayment.currency_id || 'BRL',
      status: mapMercadoPagoStatus(mpPayment.status),
      provider: 'mercadopago',
      provider_reference: String(mpPayment.id || ''),
    }

    await persistMercadoPagoPayment({
      paymentId: String(mpPayment.id || ''),
      amount: Number(mpPayment.transaction_amount || amount),
      currency: mpPayment.currency_id || 'BRL',
      status: intent.status,
      metadata: (mpPayment.metadata || metadata) as Record<string, unknown>,
      payerEmail,
    })

    return NextResponse.json({ data: intent, error: null })
  } catch (err) {
    return NextResponse.json(
      { error: (err as Error).message || 'Erro ao processar pagamento com cartao.' },
      { status: 500 },
    )
  }
}
