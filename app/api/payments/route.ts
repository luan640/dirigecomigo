/**
 * POST /api/payments
 *
 * Processa pagamentos com cartão de crédito via Checkout Transparente do
 * Mercado Pago. O token do cartão é gerado pelo Card Brick (MercadoPago.js v2)
 * no frontend — nenhum dado de cartão trafega pelo servidor da plataforma,
 * garantindo conformidade PCI DSS.
 *
 * Fluxo:
 *  1. Frontend tokeniza o cartão via Card Brick (MP.js v2)
 *  2. Frontend envia token + dados do pagador para este endpoint
 *  3. Backend cria o pagamento na API do Mercado Pago usando a SDK oficial
 *  4. Resposta com status mapeado é retornada ao frontend
 *  5. Pagamento é persistido no banco de dados
 */

import { randomUUID } from 'crypto'
import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import type { PaymentIntent } from '@/types'
import { persistMercadoPagoPayment } from '@/lib/payments/mercadoPagoPersistence'
import {
  mapMercadoPagoStatus,
  resolveMpRejectionMessage,
  resolveNotificationUrl,
  buildAdditionalInfo,
} from '@/lib/payments/mercadoPagoHelpers'

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value)
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
    // Parse e validação do body
    // -----------------------------------------------------------------------
    const body = await req.json()
    const amount = Number(body?.amount || 0)
    const description = String(body?.description || 'Aula de direção — DirigeComigo')
    const metadata = isRecord(body?.metadata) ? body.metadata : {}
    const rawFormData = isRecord(body?.formData) ? body.formData : {}
    const inputEmail = String(body?.customerEmail || '').trim()
    const customerPhone = String(body?.customerPhone || '').trim()
    const isTestMode = accessToken.startsWith('TEST-')

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Valor inválido para pagamento.' }, { status: 400 })
    }

    // -----------------------------------------------------------------------
    // Extração dos dados do Card Brick
    // -----------------------------------------------------------------------
    const paymentMethodId = String(
      rawFormData.payment_method_id || rawFormData.paymentMethodId || '',
    ).trim()
    const token = String(rawFormData.token || '').trim()
    const installments = Number(rawFormData.installments || 1)
    const issuerId = String(rawFormData.issuer_id || rawFormData.issuerId || '').trim()
    const rawPayer = isRecord(rawFormData.payer) ? rawFormData.payer : {}
    const rawIdentification = isRecord(rawPayer.identification) ? rawPayer.identification : {}
    const identificationType = String(
      rawIdentification.type ||
        rawFormData.identificationType ||
        rawFormData.identification_type ||
        '',
    ).trim()
    const identificationNumber = String(
      rawIdentification.number ||
        rawFormData.identificationNumber ||
        rawFormData.identification_number ||
        '',
    ).trim()
    const cardholderName = String(
      rawFormData.cardholderName || rawFormData.cardholder_name || '',
    ).trim()

    // Em modo de teste, o MP rejeita e-mails @testuser.com vindos do Brick.
    const payerEmail =
      isTestMode && inputEmail.toLowerCase().endsWith('@testuser.com')
        ? `checkout.bricks.${Date.now()}@example.com`
        : inputEmail

    if (!paymentMethodId || !token) {
      return NextResponse.json(
        { error: 'Token do cartão não gerado pelo Brick. Recarregue a página e tente novamente.' },
        { status: 400 },
      )
    }

    if (!payerEmail) {
      return NextResponse.json(
        { error: 'E-mail do cliente é obrigatório.' },
        { status: 400 },
      )
    }

    // -----------------------------------------------------------------------
    // Preparação do payload
    // -----------------------------------------------------------------------
    const [firstName, ...lastNameParts] = cardholderName.split(' ').filter(Boolean)
    const notificationUrl = resolveNotificationUrl(req)
    const externalReference = String(
      metadata.slotId || metadata.bookingId || `lesson_${Date.now()}`,
    )

    // additional_info: melhora taxa de aprovação e reduz chargebacks
    // Obrigatório pelo quality checklist do Mercado Pago
    const additionalInfo = buildAdditionalInfo(
      {
        email: payerEmail,
        firstName: firstName || undefined,
        lastName: lastNameParts.join(' ') || undefined,
        phone: customerPhone || undefined,
        identificationType: identificationType || undefined,
        identificationNumber: identificationNumber || undefined,
      },
      {
        id: externalReference,
        title: description,
        description,
        // Serviços educacionais (código padrão MP para cursos/aulas)
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
        token,
        installments: Number.isFinite(installments) && installments > 0 ? installments : 1,
        payment_method_id: paymentMethodId,
        issuer_id: issuerId ? Number(issuerId) : undefined,
        payer: {
          email: payerEmail,
          ...(firstName ? { first_name: firstName } : {}),
          ...(lastNameParts.length ? { last_name: lastNameParts.join(' ') } : {}),
          ...(identificationType && identificationNumber
            ? { identification: { type: identificationType, number: identificationNumber } }
            : {}),
        },
        external_reference: externalReference,
        // binary_mode: true garante aprovação ou rejeição imediata (sem "em análise")
        binary_mode: true,
        // statement_descriptor: texto que aparece na fatura do cartão do comprador
        // Reduz a probabilidade de chargeback por desconhecimento da compra
        statement_descriptor: 'DIRIGECOMIGO',
        additional_info: additionalInfo,
        metadata,
        ...(notificationUrl ? { notification_url: notificationUrl } : {}),
      },
      requestOptions: {
        // Chave de idempotência: evita cobranças duplicadas em caso de retentativa
        idempotencyKey: randomUUID(),
      },
    })

    // -----------------------------------------------------------------------
    // Tratamento de status e resposta
    // -----------------------------------------------------------------------
    const mappedStatus = mapMercadoPagoStatus(mpPayment.status)

    // Para pagamentos rejeitados, retorna mensagem amigável com base no status_detail
    if (mappedStatus === 'failed') {
      const message = resolveMpRejectionMessage(
        mpPayment.status_detail,
        'Pagamento recusado. Verifique os dados do cartão ou utilize outro método.',
      )
      return NextResponse.json({ error: message, status_detail: mpPayment.status_detail }, { status: 422 })
    }

    const intent: PaymentIntent = {
      id: String(mpPayment.id || ''),
      amount: Number(mpPayment.transaction_amount || amount),
      currency: mpPayment.currency_id || 'BRL',
      status: mappedStatus,
      provider: 'mercadopago',
      provider_reference: String(mpPayment.id || ''),
    }

    // Persistência assíncrona — não bloqueia a resposta ao frontend
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
    console.error('[payments/card] Erro inesperado:', err)
    return NextResponse.json(
      { error: (err as Error).message || 'Erro ao processar pagamento com cartão.' },
      { status: 500 },
    )
  }
}
