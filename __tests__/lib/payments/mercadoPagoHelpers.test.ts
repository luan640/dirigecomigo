/**
 * Testes unitários para lib/payments/mercadoPagoHelpers.ts
 *
 * Cobre os fluxos críticos de:
 *  - Mapeamento de status do Mercado Pago para status interno
 *  - Mensagens de rejeição amigáveis
 *  - Construção de additional_info (quality checklist do MP)
 *  - URL de notificação (webhook)
 */

import {
  mapMercadoPagoStatus,
  resolveMpRejectionMessage,
  buildAdditionalInfo,
  buildIdempotencyKey,
  resolveNotificationUrl,
} from '@/lib/payments/mercadoPagoHelpers'

// ---------------------------------------------------------------------------
// mapMercadoPagoStatus
// ---------------------------------------------------------------------------

describe('mapMercadoPagoStatus', () => {
  it('mapeia "approved" para "paid"', () => {
    expect(mapMercadoPagoStatus('approved')).toBe('paid')
  })

  it('mapeia "authorized" para "processing"', () => {
    expect(mapMercadoPagoStatus('authorized')).toBe('processing')
  })

  it('mapeia "in_process" para "processing"', () => {
    expect(mapMercadoPagoStatus('in_process')).toBe('processing')
  })

  it('mapeia "rejected" para "failed"', () => {
    expect(mapMercadoPagoStatus('rejected')).toBe('failed')
  })

  it('mapeia "cancelled" para "failed"', () => {
    expect(mapMercadoPagoStatus('cancelled')).toBe('failed')
  })

  it('mapeia "refunded" para "refunded"', () => {
    expect(mapMercadoPagoStatus('refunded')).toBe('refunded')
  })

  it('mapeia "charged_back" para "refunded"', () => {
    expect(mapMercadoPagoStatus('charged_back')).toBe('refunded')
  })

  it('mapeia "pending" para "pending"', () => {
    expect(mapMercadoPagoStatus('pending')).toBe('pending')
  })

  it('mapeia "in_mediation" para "pending"', () => {
    expect(mapMercadoPagoStatus('in_mediation')).toBe('pending')
  })

  it('mapeia status desconhecido para "pending" (fallback seguro)', () => {
    expect(mapMercadoPagoStatus('unknown_status')).toBe('pending')
  })

  it('mapeia undefined para "pending"', () => {
    expect(mapMercadoPagoStatus(undefined)).toBe('pending')
  })
})

// ---------------------------------------------------------------------------
// resolveMpRejectionMessage
// ---------------------------------------------------------------------------

describe('resolveMpRejectionMessage', () => {
  it('retorna mensagem traduzida para cc_rejected_insufficient_amount', () => {
    const msg = resolveMpRejectionMessage('cc_rejected_insufficient_amount')
    expect(msg).toContain('Saldo insuficiente')
  })

  it('retorna mensagem traduzida para cc_rejected_bad_filled_card_number', () => {
    const msg = resolveMpRejectionMessage('cc_rejected_bad_filled_card_number')
    expect(msg).toContain('Número do cartão inválido')
  })

  it('retorna fallback para código desconhecido', () => {
    const fallback = 'Pagamento não processado.'
    const msg = resolveMpRejectionMessage('cc_rejected_totally_unknown_code', fallback)
    expect(msg).toBe(fallback)
  })

  it('retorna fallback padrão quando statusDetail é undefined', () => {
    const msg = resolveMpRejectionMessage(undefined)
    expect(msg).toBe('Pagamento recusado.')
  })
})

// ---------------------------------------------------------------------------
// buildAdditionalInfo
// ---------------------------------------------------------------------------

describe('buildAdditionalInfo', () => {
  const basePayer = { email: 'comprador@email.com', firstName: 'João', lastName: 'Silva' }
  const baseItem = {
    id: 'slot_123',
    title: 'Aula de direção',
    description: 'Aula com instrutor em 2026-03-25',
    categoryId: 'education',
    quantity: 1,
    unitPrice: 120.0,
  }

  it('retorna objeto com items e payer', () => {
    const info = buildAdditionalInfo(basePayer, baseItem)
    expect(info).toHaveProperty('items')
    expect(info).toHaveProperty('payer')
  })

  it('items contém todos os campos obrigatórios do quality checklist do MP', () => {
    const info = buildAdditionalInfo(basePayer, baseItem)
    const item = (info.items as Record<string, unknown>[])[0]
    expect(item).toHaveProperty('id', 'slot_123')
    expect(item).toHaveProperty('title', 'Aula de direção')
    expect(item).toHaveProperty('description')
    expect(item).toHaveProperty('category_id', 'education')
    expect(item).toHaveProperty('quantity', 1)
    expect(item).toHaveProperty('unit_price', 120.0)
  })

  it('payer contém first_name e last_name quando fornecidos', () => {
    const info = buildAdditionalInfo(basePayer, baseItem)
    const payer = info.payer as Record<string, unknown>
    expect(payer).toHaveProperty('first_name', 'João')
    expect(payer).toHaveProperty('last_name', 'Silva')
  })

  it('payer inclui phone quando fornecido', () => {
    const info = buildAdditionalInfo({ ...basePayer, phone: '85999998888' }, baseItem)
    const payer = info.payer as Record<string, unknown>
    expect(payer).toHaveProperty('phone')
    const phone = payer.phone as Record<string, string>
    expect(phone.area_code).toBe('85')
    expect(phone.number).toBe('999998888')
  })

  it('payer não inclui phone quando não fornecido', () => {
    const info = buildAdditionalInfo(basePayer, baseItem)
    const payer = info.payer as Record<string, unknown>
    expect(payer).not.toHaveProperty('phone')
  })

  it('payer não inclui first_name quando não fornecido', () => {
    const info = buildAdditionalInfo({ email: 'a@b.com' }, baseItem)
    const payer = info.payer as Record<string, unknown>
    expect(payer).not.toHaveProperty('first_name')
  })
})

// ---------------------------------------------------------------------------
// buildIdempotencyKey
// ---------------------------------------------------------------------------

describe('buildIdempotencyKey', () => {
  it('retorna uma string não vazia', () => {
    const key = buildIdempotencyKey()
    expect(typeof key).toBe('string')
    expect(key.length).toBeGreaterThan(0)
  })

  it('retorna chaves únicas em chamadas distintas', () => {
    const key1 = buildIdempotencyKey('pix_abc')
    const key2 = buildIdempotencyKey('pix_abc')
    expect(key1).not.toBe(key2)
  })

  it('inclui o seed no prefixo da chave', () => {
    const key = buildIdempotencyKey('booking_xyz')
    expect(key.startsWith('booking_xyz-')).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// resolveNotificationUrl
// ---------------------------------------------------------------------------

describe('resolveNotificationUrl', () => {
  const makeRequest = (headers: Record<string, string>, url = 'https://app.dirigecomigo.com.br/api/payments') => {
    return new Request(url, { headers })
  }

  it('retorna URL de webhook para host HTTPS público', () => {
    const req = makeRequest({
      'x-forwarded-proto': 'https',
      'x-forwarded-host': 'app.dirigecomigo.com.br',
    })
    const url = resolveNotificationUrl(req)
    expect(url).toBe('https://app.dirigecomigo.com.br/api/webhooks/mercadopago')
  })

  it('retorna undefined para localhost', () => {
    const req = makeRequest({
      'x-forwarded-proto': 'http',
      'x-forwarded-host': 'localhost:3000',
    })
    const url = resolveNotificationUrl(req)
    expect(url).toBeUndefined()
  })

  it('retorna undefined para HTTP não-local (sem HTTPS)', () => {
    const req = makeRequest({
      'x-forwarded-proto': 'http',
      'x-forwarded-host': 'app.dirigecomigo.com.br',
    })
    const url = resolveNotificationUrl(req)
    expect(url).toBeUndefined()
  })

  it('remove barra final do APP_URL antes de montar o path', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://app.dirigecomigo.com.br/'
    const req = makeRequest({})
    const url = resolveNotificationUrl(req)
    if (url) {
      // Não deve ter // no caminho (fora do protocolo https://)
      const path = url.replace('https://', '')
      expect(path).not.toContain('//')
    }
  })
})
