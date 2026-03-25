/**
 * POST /api/payments/pix
 *
 * Cria um pagamento PIX via Checkout Transparente do Mercado Pago.
 * Retorna o QR Code (texto e imagem base64) para exibição ao comprador.
 *
 * Fluxo:
 *  1. Frontend solicita criação do PIX com valor e e-mail do comprador
 *  2. Backend cria o pagamento na API do Mercado Pago (payment_method_id: 'pix')
 *  3. Mercado Pago retorna qr_code + qr_code_base64
 *  4. Frontend exibe o QR Code e faz polling via /api/payments/confirm
 *  5. Ao detectar status 'approved', a reserva é criada
 */

import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import type { PaymentIntent } from '@/types'
import { persistMercadoPagoPayment } from '@/lib/payments/mercadoPagoPersistence'
import {
  mapMercadoPagoStatus,
  resolveNotificationUrl,
  buildAdditionalInfo,
} from '@/lib/payments/mercadoPagoHelpers'

/** Tempo de expiração do PIX em minutos (padrão: 30 min) */
const PIX_EXPIRATION_MINUTES = 30

function buildPixExpiration(): string {
  const exp = new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000)
  return exp.toISOString()
}

export async function POST(req: Request) {
  try {
    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json(
        { error: 'MERCADOPAGO_ACCESS_TOKEN não configurado.' },
        { status: 500 },
      )
    }

    // -----------------------------------------------------------------------
    // Parse e validação
    // -----------------------------------------------------------------------
    const body = await req.json()
    const amount = Number(body?.amount)
    const description = String(body?.description || 'Aula de direção — DirigeComigo')
    const customerEmail = String(body?.customerEmail || '').trim()
    const customerPhone = String(body?.customerPhone || '').trim()
    const metadata =
      body?.metadata && typeof body.metadata === 'object' ? body.metadata : {}

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido para pagamento.' }, { status: 400 })
    }

    if (!customerEmail) {
      return NextResponse.json(
        { error: 'E-mail do cliente é obrigatório.' },
        { status: 400 },
      )
    }

    // -----------------------------------------------------------------------
    // Preparação do payload
    // -----------------------------------------------------------------------
    const externalReference = String(metadata?.slotId || `pix_${Date.now()}`)
    const notificationUrl = resolveNotificationUrl(req)

    // additional_info: melhora taxa de aprovação — obrigatório pelo quality checklist
    const additionalInfo = buildAdditionalInfo(
      {
        email: customerEmail,
        phone: customerPhone || undefined,
      },
      {
        id: externalReference,
        title: description,
        description,
        categoryId: 'education',
        quantity: 1,
        unitPrice: amount,
      },
    )

    // -----------------------------------------------------------------------
    // Criação do pagamento via SDK oficial
    // -----------------------------------------------------------------------
    const client = new MercadoPagoConfig({ accessToken })
    const paymentClient = new Payment(client)

    const mpPayment = await paymentClient.create({
      body: {
        transaction_amount: amount,
        description,
        payment_method_id: 'pix',
        payer: { email: customerEmail },
        external_reference: externalReference,
        // PIX expira em 30 minutos para incentivar pagamento imediato
        date_of_expiration: buildPixExpiration(),
        // statement_descriptor: texto na notificação de débito do comprador
        statement_descriptor: 'DIRIGECOMIGO',
        additional_info: additionalInfo,
        metadata,
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      },
      requestOptions: {
        // Idempotência: mesmo QR não é gerado duas vezes para a mesma sessão
        idempotencyKey: randomUUID(),
      },
    })

    // -----------------------------------------------------------------------
    // Montagem da resposta
    // -----------------------------------------------------------------------
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
    console.error('[payments/pix] Erro inesperado:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Erro ao criar PIX.' },
      { status: 500 },
    )
  }
}
