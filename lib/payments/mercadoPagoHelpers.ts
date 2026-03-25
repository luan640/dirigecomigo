/**
 * Utilitários compartilhados para a integração com o Mercado Pago.
 *
 * Centraliza funções usadas em múltiplas rotas da API para evitar duplicação
 * e garantir consistência no mapeamento de status e na construção de payloads.
 */

import { randomUUID } from 'crypto'
import type { PaymentIntent } from '@/types'

// ---------------------------------------------------------------------------
// Status mapping
// ---------------------------------------------------------------------------

/**
 * Mapeia o status retornado pela API do Mercado Pago para o status interno da
 * plataforma. Consulte a documentação oficial em:
 * https://www.mercadopago.com.br/developers/pt/docs/checkout-api/response-handling/collection-results
 */
export function mapMercadoPagoStatus(status?: string): PaymentIntent['status'] {
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

// ---------------------------------------------------------------------------
// Error handling
// ---------------------------------------------------------------------------

/**
 * Códigos de rejeição do Mercado Pago e suas mensagens amigáveis.
 * Fonte: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/response-handling/collection-results
 */
const MP_REJECTION_MESSAGES: Record<string, string> = {
  cc_rejected_bad_filled_card_number: 'Número do cartão inválido. Verifique e tente novamente.',
  cc_rejected_bad_filled_date: 'Data de validade inválida. Verifique e tente novamente.',
  cc_rejected_bad_filled_other: 'Dados do cartão incorretos. Verifique e tente novamente.',
  cc_rejected_bad_filled_security_code: 'Código de segurança inválido. Verifique e tente novamente.',
  cc_rejected_blacklist: 'Cartão não pode ser processado. Utilize outro cartão.',
  cc_rejected_call_for_authorize: 'Você precisa autorizar este pagamento junto ao seu banco.',
  cc_rejected_card_disabled: 'Cartão inativo. Contate seu banco ou utilize outro cartão.',
  cc_rejected_card_error: 'Não foi possível processar o cartão. Tente novamente.',
  cc_rejected_duplicated_payment: 'Pagamento duplicado detectado. Aguarde ou utilize outro cartão.',
  cc_rejected_high_risk: 'Pagamento recusado por segurança. Utilize outro método de pagamento.',
  cc_rejected_insufficient_amount: 'Saldo insuficiente. Verifique seu limite ou utilize outro cartão.',
  cc_rejected_invalid_installments: 'Número de parcelas inválido para este cartão.',
  cc_rejected_max_attempts: 'Limite de tentativas atingido. Utilize outro cartão ou tente amanhã.',
  cc_rejected_other_reason: 'Pagamento recusado. Tente novamente ou utilize outro método.',
}

/**
 * Retorna a mensagem de erro amigável para o código de status_detail do MP.
 * Se não houver tradução, retorna o fallback fornecido.
 */
export function resolveMpRejectionMessage(statusDetail?: string, fallback = 'Pagamento recusado.'): string {
  if (!statusDetail) return fallback
  return MP_REJECTION_MESSAGES[statusDetail] ?? fallback
}

// ---------------------------------------------------------------------------
// Idempotency
// ---------------------------------------------------------------------------

/**
 * Gera uma chave de idempotência para evitar cobranças duplicadas.
 * Utiliza o paymentMethod + referência externa como semente quando disponível,
 * garantindo idempotência real em retentativas do mesmo pagamento.
 */
export function buildIdempotencyKey(seed?: string): string {
  return seed ? `${seed}-${randomUUID()}` : randomUUID()
}

// ---------------------------------------------------------------------------
// Notification URL
// ---------------------------------------------------------------------------

/**
 * Resolve a URL de notificação (webhook) a partir dos headers da requisição ou
 * da variável de ambiente NEXT_PUBLIC_APP_URL.
 *
 * Retorna undefined em ambientes localhost ou sem HTTPS, pois o Mercado Pago
 * não aceita URLs de notificação não-públicas.
 */
export function resolveNotificationUrl(req: Request): string | undefined {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL
  const forwardedProto = req.headers.get('x-forwarded-proto')
  const forwardedHost = req.headers.get('x-forwarded-host') || req.headers.get('host')

  const origin =
    forwardedProto && forwardedHost
      ? `${forwardedProto.split(',')[0].trim()}://${forwardedHost.split(',')[0].trim()}`
      : appUrl || ''

  try {
    const parsed = new URL(origin)
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

// ---------------------------------------------------------------------------
// Additional info (quality checklist do Mercado Pago)
// ---------------------------------------------------------------------------

export type MpPayerInfo = {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  identificationType?: string
  identificationNumber?: string
}

export type MpItemInfo = {
  id: string
  title: string
  description: string
  categoryId: string
  quantity: number
  unitPrice: number
}

/**
 * Constrói o objeto `additional_info` exigido pelo quality checklist do
 * Mercado Pago para aumentar a taxa de aprovação e reduzir chargebacks.
 *
 * Campos avaliados:
 * - items[].id, title, description, category_id, quantity, unit_price
 * - payer.first_name, last_name, phone
 *
 * Referência: https://www.mercadopago.com.br/developers/pt/docs/checkout-api/best-practices/additional-info
 */
export function buildAdditionalInfo(payer: MpPayerInfo, item: MpItemInfo) {
  const info: Record<string, unknown> = {
    items: [
      {
        id: item.id,
        title: item.title,
        description: item.description,
        category_id: item.categoryId,
        quantity: item.quantity,
        unit_price: item.unitPrice,
      },
    ],
    payer: {
      ...(payer.firstName ? { first_name: payer.firstName } : {}),
      ...(payer.lastName ? { last_name: payer.lastName } : {}),
      ...(payer.phone
        ? {
            phone: {
              area_code: payer.phone.replace(/\D/g, '').slice(0, 2),
              number: payer.phone.replace(/\D/g, '').slice(2),
            },
          }
        : {}),
    },
  }

  return info
}
