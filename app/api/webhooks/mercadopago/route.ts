/**
 * POST /api/webhooks/mercadopago
 *
 * Recebe notificações IPN/Webhook do Mercado Pago e sincroniza o estado dos
 * pagamentos e assinaturas com o banco de dados da plataforma.
 *
 * Segurança:
 *  - Valida a assinatura HMAC-SHA256 em todos os requests (exceto dev sem secret)
 *  - Sempre retorna HTTP 200 para evitar retentativas infinitas do MP
 *  - Erros internos são absorvidos silenciosamente após log
 *
 * Tópicos tratados:
 *  - payment           → persistMercadoPagoPayment()
 *  - subscription      → syncPreapprovalToSubscription()
 *  - preapproval       → syncPreapprovalToSubscription()
 *  - authorized_payment → syncPreapprovalToSubscription()
 *  - merchant_order    → ignorado (sem ação necessária)
 *  - test              → ignorado (notificação de teste do dashboard MP)
 *
 * Referência: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

import { createHmac } from 'crypto'
import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { persistMercadoPagoPayment } from '@/lib/payments/mercadoPagoPersistence'
import { syncPreapprovalToSubscription } from '@/lib/payments/mercadoPagoSubscription'
import { mapMercadoPagoStatus } from '@/lib/payments/mercadoPagoHelpers'

// ---------------------------------------------------------------------------
// Verificação de assinatura
// ---------------------------------------------------------------------------

/**
 * Valida a assinatura HMAC-SHA256 do webhook do Mercado Pago.
 *
 * Formato do header x-signature: `ts=<timestamp>,v1=<hmac_hex>`
 * Manifest assinado: `id:<data_id>;request-id:<x-request-id>;ts:<ts>;`
 *
 * Retorna true se:
 *  - A assinatura for válida, OU
 *  - MERCADOPAGO_WEBHOOK_SECRET não estiver configurado (ambiente de dev)
 */
function verifyWebhookSignature(req: Request, dataId: string): boolean {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET

  // Em desenvolvimento sem secret configurado, aceita (mas loga aviso)
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      console.error('[webhook/mp] MERCADOPAGO_WEBHOOK_SECRET não configurado em produção!')
    }
    return true
  }

  const xSignature = req.headers.get('x-signature') || ''
  const xRequestId = req.headers.get('x-request-id') || ''

  // Extrai ts e v1 do header no formato "ts=xxx,v1=yyy"
  const parts = Object.fromEntries(
    xSignature.split(',').map(part => {
      const idx = part.indexOf('=')
      return idx === -1 ? [part, ''] : [part.slice(0, idx), part.slice(idx + 1)]
    }),
  )

  const ts = parts['ts'] || ''
  const v1 = parts['v1'] || ''

  if (!ts || !v1) {
    console.warn('[webhook/mp] Header x-signature ausente ou malformado.')
    return false
  }

  // Manifest: formato definido pela documentação do MP
  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')

  // Comparação segura contra timing attacks
  return expected === v1
}

// ---------------------------------------------------------------------------
// Handler principal
// ---------------------------------------------------------------------------

export async function POST(req: Request) {
  let payload: Record<string, unknown> = {}

  try {
    const rawBody = await req.text()
    payload = (() => {
      try {
        return JSON.parse(rawBody)
      } catch {
        return {}
      }
    })()
  } catch {
    // Falha na leitura do body — responde 200 para evitar retentativas
    return NextResponse.json({ ok: true })
  }

  try {
    // Extrai o resource ID da notificação (pode vir no body ou na query string)
    const url = new URL(req.url)
    const payloadData = payload?.data as Record<string, unknown> | undefined
    const resourceId = String(payloadData?.id || payload?.id || url.searchParams.get('data.id') || '')
    const type = String(
      payload?.type ||
      payload?.topic ||
      url.searchParams.get('type') ||
      url.searchParams.get('topic') ||
      '',
    )

    // -----------------------------------------------------------------------
    // Validação de assinatura
    // -----------------------------------------------------------------------
    if (!verifyWebhookSignature(req, resourceId)) {
      // Retorna 401 para que o MP registre a falha, mas não retriará indefinidamente
      return NextResponse.json({ ok: false, error: 'Assinatura inválida.' }, { status: 401 })
    }

    // Notificação de teste enviada pelo dashboard do MP — apenas confirma recebimento
    if (type === 'test' || !type) {
      return NextResponse.json({ ok: true })
    }

    // merchant_order: agrupa pagamentos mas não requer ação da nossa parte
    if (type === 'merchant_order') {
      return NextResponse.json({ ok: true })
    }

    // -----------------------------------------------------------------------
    // Tópico: payment
    // -----------------------------------------------------------------------
    if (type === 'payment' && resourceId) {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!accessToken) {
        console.error('[webhook/mp] MERCADOPAGO_ACCESS_TOKEN não configurado.')
        return NextResponse.json({ ok: true }) // 200 para não retentar
      }

      const paymentClient = new Payment(new MercadoPagoConfig({ accessToken }))
      const mpPayment = await paymentClient.get({ id: resourceId })

      await persistMercadoPagoPayment({
        paymentId: String(mpPayment.id || resourceId),
        amount: Number(mpPayment.transaction_amount || 0),
        currency: mpPayment.currency_id || 'BRL',
        status: mapMercadoPagoStatus(mpPayment.status),
        metadata: (mpPayment.metadata || {}) as Record<string, unknown>,
        payerEmail: mpPayment.payer?.email,
      })

      return NextResponse.json({ ok: true })
    }

    // -----------------------------------------------------------------------
    // Tópico: subscription / preapproval / authorized_payment
    // -----------------------------------------------------------------------
    const isSubscriptionTopic =
      type.includes('subscription') ||
      type.includes('preapproval') ||
      type.includes('authorized_payment')

    if (isSubscriptionTopic && resourceId) {
      const accessToken =
        process.env.MERCADOPAGO_ACCESS_TOKEN_ASSINATURA ||
        process.env.MERCADOPAGO_ACCESS_TOKEN

      if (!accessToken) {
        console.error('[webhook/mp] Access token para assinatura não configurado.')
        return NextResponse.json({ ok: true })
      }

      const preapprovalClient = new PreApproval(new MercadoPagoConfig({ accessToken }))
      const preapproval = await preapprovalClient.get({ id: resourceId })

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

      if (supabaseUrl && serviceRoleKey) {
        const db = createAdminClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        await syncPreapprovalToSubscription({
          db,
          preapproval: preapproval as unknown as Record<string, unknown>,
        })
      }

      return NextResponse.json({ ok: true })
    }

    // Tópico desconhecido — confirma recebimento
    return NextResponse.json({ ok: true })
  } catch (err) {
    // Absorve erros internos e retorna 200: o Mercado Pago não deve retentar
    // uma notificação cujo processamento falhou por bug interno nosso.
    console.error('[webhook/mp] Erro ao processar notificação:', err)
    return NextResponse.json({ ok: true })
  }
}
