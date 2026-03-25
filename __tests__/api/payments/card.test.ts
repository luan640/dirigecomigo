/**
 * Testes para o fluxo de pagamento com cartão (Checkout Transparente).
 *
 * Cobre:
 *  - Validações de entrada do endpoint POST /api/payments
 *  - Mapeamento de status para o fluxo card
 *  - Mensagens de rejeição para os principais status_detail do MP
 *  - Construção do payload com additional_info
 */

import { mapMercadoPagoStatus, resolveMpRejectionMessage, buildAdditionalInfo } from '@/lib/payments/mercadoPagoHelpers'

// ---------------------------------------------------------------------------
// Validações de entrada (espelham as checagens em app/api/payments/route.ts)
// ---------------------------------------------------------------------------

function validateCardPaymentInput(body: {
  amount?: unknown
  customerEmail?: unknown
  formData?: { token?: string; payment_method_id?: string }
}): string | null {
  if (!body.amount || Number(body.amount) <= 0) return 'Valor inválido para pagamento.'
  if (!body.customerEmail || String(body.customerEmail).trim() === '') return 'E-mail do cliente é obrigatório.'
  if (!body.formData?.token || !body.formData?.payment_method_id) {
    return 'Token do cartão não gerado pelo Brick. Recarregue a página e tente novamente.'
  }
  return null
}

describe('validação de entrada — POST /api/payments (cartão)', () => {
  it('aceita payload válido', () => {
    const error = validateCardPaymentInput({
      amount: 150.00,
      customerEmail: 'aluno@email.com',
      formData: { token: 'tok_abc', payment_method_id: 'visa' },
    })
    expect(error).toBeNull()
  })

  it('rejeita amount zero', () => {
    const error = validateCardPaymentInput({
      amount: 0,
      customerEmail: 'aluno@email.com',
      formData: { token: 'tok_abc', payment_method_id: 'visa' },
    })
    expect(error).toMatch(/Valor inválido/)
  })

  it('rejeita amount negativo', () => {
    const error = validateCardPaymentInput({
      amount: -10,
      customerEmail: 'aluno@email.com',
      formData: { token: 'tok_abc', payment_method_id: 'visa' },
    })
    expect(error).toMatch(/Valor inválido/)
  })

  it('rejeita e-mail ausente', () => {
    const error = validateCardPaymentInput({
      amount: 100,
      customerEmail: '',
      formData: { token: 'tok_abc', payment_method_id: 'visa' },
    })
    expect(error).toMatch(/E-mail/)
  })

  it('rejeita token ausente (Brick não inicializado)', () => {
    const error = validateCardPaymentInput({
      amount: 100,
      customerEmail: 'aluno@email.com',
      formData: { token: '', payment_method_id: 'visa' },
    })
    expect(error).toMatch(/Token/)
  })

  it('rejeita payment_method_id ausente', () => {
    const error = validateCardPaymentInput({
      amount: 100,
      customerEmail: 'aluno@email.com',
      formData: { token: 'tok_abc', payment_method_id: '' },
    })
    expect(error).toMatch(/Token/)
  })
})

// ---------------------------------------------------------------------------
// Fluxo de status para cartão (binary_mode: true → aprovado ou recusado)
// ---------------------------------------------------------------------------

describe('mapeamento de status — fluxo cartão', () => {
  it('pagamento aprovado → "paid"', () => {
    expect(mapMercadoPagoStatus('approved')).toBe('paid')
  })

  it('pagamento recusado → "failed"', () => {
    expect(mapMercadoPagoStatus('rejected')).toBe('failed')
  })

  it('em análise (sem binary_mode) → "processing"', () => {
    expect(mapMercadoPagoStatus('in_process')).toBe('processing')
  })
})

// ---------------------------------------------------------------------------
// Mensagens de rejeição críticas (cc_rejected_*)
// ---------------------------------------------------------------------------

describe('resolveMpRejectionMessage — mensagens amigáveis', () => {
  const cases: [string, string][] = [
    ['cc_rejected_insufficient_amount', 'Saldo insuficiente'],
    ['cc_rejected_bad_filled_card_number', 'Número do cartão inválido'],
    ['cc_rejected_bad_filled_security_code', 'Código de segurança inválido'],
    ['cc_rejected_bad_filled_date', 'Data de validade inválida'],
    ['cc_rejected_call_for_authorize', 'autorizar'],
    ['cc_rejected_max_attempts', 'Limite de tentativas'],
    ['cc_rejected_high_risk', 'segurança'],
    ['cc_rejected_card_disabled', 'inativo'],
    ['cc_rejected_duplicated_payment', 'duplicado'],
  ]

  it.each(cases)('status_detail "%s" contém "%s"', (statusDetail, expected) => {
    const msg = resolveMpRejectionMessage(statusDetail)
    expect(msg.toLowerCase()).toContain(expected.toLowerCase())
  })
})

// ---------------------------------------------------------------------------
// Payload additional_info — quality checklist do MP
// ---------------------------------------------------------------------------

describe('buildAdditionalInfo — payload completo', () => {
  const fullPayer = {
    email: 'aluno@email.com',
    firstName: 'Maria',
    lastName: 'Souza',
    phone: '85988887777',
    identificationType: 'CPF',
    identificationNumber: '12345678900',
  }

  const item = {
    id: 'booking_xyz',
    title: 'Aula de direção',
    description: 'Aula com instrutor em 2026-03-25 às 09:00',
    categoryId: 'education',
    quantity: 1,
    unitPrice: 150.0,
  }

  it('gera payload com items e payer corretamente', () => {
    const info = buildAdditionalInfo(fullPayer, item)
    const itemResult = (info.items as Record<string, unknown>[])[0]

    expect(itemResult.id).toBe('booking_xyz')
    expect(itemResult.category_id).toBe('education')
    expect(itemResult.quantity).toBe(1)
    expect(itemResult.unit_price).toBe(150.0)
  })

  it('gera phone com area_code separado do number', () => {
    const info = buildAdditionalInfo(fullPayer, item)
    const payer = info.payer as { phone: { area_code: string; number: string } }

    expect(payer.phone.area_code).toBe('85')
    expect(payer.phone.number).toBe('988887777')
  })

  it('funciona sem campos opcionais (apenas e-mail e item mínimo)', () => {
    const info = buildAdditionalInfo({ email: 'x@x.com' }, { ...item, id: 'min' })
    expect(info).toHaveProperty('items')
    expect(info).toHaveProperty('payer')
  })
})
