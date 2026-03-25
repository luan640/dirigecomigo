/**
 * Testes para a verificação de assinatura do webhook do Mercado Pago.
 *
 * A lógica de negócio está em /app/api/webhooks/mercadopago/route.ts.
 * Aqui testamos a função de verificação de HMAC de forma isolada,
 * pois é o mecanismo de segurança crítico da integração.
 *
 * Referência: https://www.mercadopago.com.br/developers/pt/docs/your-integrations/notifications/webhooks
 */

import { createHmac } from 'crypto'

// ---------------------------------------------------------------------------
// Reimplementação local da função de verificação para teste isolado
// (espelha a lógica de /app/api/webhooks/mercadopago/route.ts)
// ---------------------------------------------------------------------------

function verifyWebhookSignature(params: {
  secret: string
  xSignature: string
  xRequestId: string
  dataId: string
}): boolean {
  const { secret, xSignature, xRequestId, dataId } = params

  const parts = Object.fromEntries(
    xSignature.split(',').map(part => {
      const idx = part.indexOf('=')
      return idx === -1 ? [part, ''] : [part.slice(0, idx), part.slice(idx + 1)]
    }),
  )

  const ts = parts['ts'] || ''
  const v1 = parts['v1'] || ''
  if (!ts || !v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${ts};`
  const expected = createHmac('sha256', secret).update(manifest).digest('hex')
  return expected === v1
}

function buildValidSignature(params: {
  secret: string
  xRequestId: string
  dataId: string
  ts?: string
}): string {
  const ts = params.ts ?? String(Date.now())
  const manifest = `id:${params.dataId};request-id:${params.xRequestId};ts:${ts};`
  const v1 = createHmac('sha256', params.secret).update(manifest).digest('hex')
  return `ts=${ts},v1=${v1}`
}

// ---------------------------------------------------------------------------
// Testes
// ---------------------------------------------------------------------------

const SECRET = 'segredo_webhook_super_secreto'
const REQUEST_ID = 'req-abc-123'
const DATA_ID = '987654321'

describe('verifyWebhookSignature — HMAC-SHA256', () => {
  it('aceita assinatura válida', () => {
    const xSignature = buildValidSignature({ secret: SECRET, xRequestId: REQUEST_ID, dataId: DATA_ID })
    const result = verifyWebhookSignature({ secret: SECRET, xSignature, xRequestId: REQUEST_ID, dataId: DATA_ID })
    expect(result).toBe(true)
  })

  it('rejeita assinatura com secret errado', () => {
    const xSignature = buildValidSignature({ secret: 'outro_segredo', xRequestId: REQUEST_ID, dataId: DATA_ID })
    const result = verifyWebhookSignature({ secret: SECRET, xSignature, xRequestId: REQUEST_ID, dataId: DATA_ID })
    expect(result).toBe(false)
  })

  it('rejeita assinatura com dataId adulterado', () => {
    const xSignature = buildValidSignature({ secret: SECRET, xRequestId: REQUEST_ID, dataId: DATA_ID })
    const result = verifyWebhookSignature({ secret: SECRET, xSignature, xRequestId: REQUEST_ID, dataId: 'outro_id' })
    expect(result).toBe(false)
  })

  it('rejeita assinatura com xRequestId adulterado', () => {
    const xSignature = buildValidSignature({ secret: SECRET, xRequestId: REQUEST_ID, dataId: DATA_ID })
    const result = verifyWebhookSignature({ secret: SECRET, xSignature, xRequestId: 'req-falsificado', dataId: DATA_ID })
    expect(result).toBe(false)
  })

  it('rejeita header x-signature ausente (string vazia)', () => {
    const result = verifyWebhookSignature({ secret: SECRET, xSignature: '', xRequestId: REQUEST_ID, dataId: DATA_ID })
    expect(result).toBe(false)
  })

  it('rejeita header x-signature malformado (sem v1)', () => {
    const result = verifyWebhookSignature({ secret: SECRET, xSignature: 'ts=1234', xRequestId: REQUEST_ID, dataId: DATA_ID })
    expect(result).toBe(false)
  })

  it('rejeita assinatura com ts manipulado', () => {
    const xSignature = buildValidSignature({ secret: SECRET, xRequestId: REQUEST_ID, dataId: DATA_ID, ts: '1000' })
    // Muda o ts no header mas mantém o v1 original — replay attack
    const tamperedSignature = xSignature.replace('ts=1000', 'ts=9999')
    const result = verifyWebhookSignature({ secret: SECRET, xSignature: tamperedSignature, xRequestId: REQUEST_ID, dataId: DATA_ID })
    expect(result).toBe(false)
  })

  it('aceita quando dataId está vazio (notificação de teste do MP)', () => {
    const xSignature = buildValidSignature({ secret: SECRET, xRequestId: REQUEST_ID, dataId: '' })
    const result = verifyWebhookSignature({ secret: SECRET, xSignature, xRequestId: REQUEST_ID, dataId: '' })
    expect(result).toBe(true)
  })

  it('é sensível a maiúsculas/minúsculas no secret', () => {
    const xSignature = buildValidSignature({ secret: SECRET, xRequestId: REQUEST_ID, dataId: DATA_ID })
    const result = verifyWebhookSignature({ secret: SECRET.toUpperCase(), xSignature, xRequestId: REQUEST_ID, dataId: DATA_ID })
    expect(result).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// Tópicos de webhook
// ---------------------------------------------------------------------------

describe('tópicos de webhook reconhecidos', () => {
  const SUBSCRIPTION_TOPICS = ['subscription', 'preapproval', 'authorized_payment', 'subscription_authorized_payment']

  it('todos os tópicos de assinatura são identificados corretamente', () => {
    for (const topic of SUBSCRIPTION_TOPICS) {
      const isSubscription =
        topic.includes('subscription') || topic.includes('preapproval') || topic.includes('authorized_payment')
      expect(isSubscription).toBe(true)
    }
  })

  it('"payment" não é confundido com tópico de assinatura', () => {
    const topic = 'payment'
    const isSubscription =
      topic.includes('subscription') || topic.includes('preapproval') || topic.includes('authorized_payment')
    expect(isSubscription).toBe(false)
  })

  it('"merchant_order" não é confundido com tópico de assinatura', () => {
    const topic = 'merchant_order'
    const isSubscription =
      topic.includes('subscription') || topic.includes('preapproval') || topic.includes('authorized_payment')
    expect(isSubscription).toBe(false)
  })
})
