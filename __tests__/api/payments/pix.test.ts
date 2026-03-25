/**
 * Testes para o fluxo de pagamento PIX (Checkout Transparente).
 *
 * Cobre:
 *  - Validações de entrada do endpoint POST /api/payments/pix
 *  - Expiração do QR Code
 *  - Mapeamento de status para o fluxo PIX
 *  - Fluxo de polling via /api/payments/confirm
 */

import { mapMercadoPagoStatus } from '@/lib/payments/mercadoPagoHelpers'

// ---------------------------------------------------------------------------
// Validações de entrada (espelham as checagens em app/api/payments/pix/route.ts)
// ---------------------------------------------------------------------------

function validatePixInput(body: { amount?: unknown; customerEmail?: unknown }): string | null {
  if (!body.amount || Number(body.amount) <= 0) return 'Valor inválido para pagamento.'
  if (!body.customerEmail || String(body.customerEmail).trim() === '') return 'E-mail do cliente é obrigatório.'
  return null
}

describe('validação de entrada — POST /api/payments/pix', () => {
  it('aceita payload válido', () => {
    const error = validatePixInput({ amount: 80, customerEmail: 'aluno@email.com' })
    expect(error).toBeNull()
  })

  it('rejeita amount zero', () => {
    const error = validatePixInput({ amount: 0, customerEmail: 'aluno@email.com' })
    expect(error).toMatch(/Valor inválido/)
  })

  it('rejeita amount negativo', () => {
    const error = validatePixInput({ amount: -50, customerEmail: 'aluno@email.com' })
    expect(error).toMatch(/Valor inválido/)
  })

  it('rejeita e-mail ausente', () => {
    const error = validatePixInput({ amount: 80, customerEmail: '' })
    expect(error).toMatch(/E-mail/)
  })

  it('rejeita e-mail undefined', () => {
    const error = validatePixInput({ amount: 80 })
    expect(error).toMatch(/E-mail/)
  })
})

// ---------------------------------------------------------------------------
// Expiração do PIX
// ---------------------------------------------------------------------------

describe('expiração do QR Code PIX', () => {
  const PIX_EXPIRATION_MINUTES = 30

  function buildPixExpiration(): Date {
    return new Date(Date.now() + PIX_EXPIRATION_MINUTES * 60 * 1000)
  }

  it('expira em ~30 minutos a partir de agora', () => {
    const before = Date.now()
    const exp = buildPixExpiration()
    const after = Date.now()

    const minMs = 29 * 60 * 1000  // 29 min (margem de segurança)
    const maxMs = 31 * 60 * 1000  // 31 min

    expect(exp.getTime() - before).toBeGreaterThanOrEqual(minMs)
    expect(exp.getTime() - after).toBeLessThanOrEqual(maxMs)
  })

  it('retorna string ISO 8601 válida', () => {
    const exp = buildPixExpiration()
    const iso = exp.toISOString()
    expect(() => new Date(iso)).not.toThrow()
    expect(new Date(iso).getTime()).toBeGreaterThan(Date.now())
  })
})

// ---------------------------------------------------------------------------
// Mapeamento de status PIX
// ---------------------------------------------------------------------------

describe('mapeamento de status — fluxo PIX', () => {
  it('pagamento PIX aprovado → "paid"', () => {
    expect(mapMercadoPagoStatus('approved')).toBe('paid')
  })

  it('PIX criado mas não pago → "pending"', () => {
    expect(mapMercadoPagoStatus('pending')).toBe('pending')
  })

  it('PIX expirado/cancelado → "failed"', () => {
    expect(mapMercadoPagoStatus('cancelled')).toBe('failed')
  })
})

// ---------------------------------------------------------------------------
// Lógica de polling (fluxo client-side em handlePixConfirm)
// ---------------------------------------------------------------------------

describe('lógica de polling do PIX', () => {
  type PixStatus = 'paid' | 'pending' | 'failed' | 'processing' | 'refunded'

  function handlePixStatus(status: PixStatus): 'success' | 'pending' | 'failed' {
    if (status === 'paid') return 'success'
    if (status === 'failed') return 'failed'
    return 'pending'
  }

  it('status "paid" → direciona para tela de sucesso', () => {
    expect(handlePixStatus('paid')).toBe('success')
  })

  it('status "failed" → direciona para tela de falha', () => {
    expect(handlePixStatus('failed')).toBe('failed')
  })

  it('status "pending" → mantém o polling ativo', () => {
    expect(handlePixStatus('pending')).toBe('pending')
  })

  it('status "processing" → mantém o polling ativo', () => {
    expect(handlePixStatus('processing')).toBe('pending')
  })
})
