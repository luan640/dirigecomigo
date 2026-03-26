import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, PaymentRefund } from 'mercadopago'
import { createClient } from '@/lib/supabase/server'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function isMissingRefundsTableError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error || '')
  return message.includes("Could not find the table 'public.payment_refunds'") || message.includes('payment_refunds')
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle() as { data: { role?: string | null } | null; error: Error | null }

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const service = getServiceClient()
    if (!service) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })
    }

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!accessToken) {
      return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN nao configurado.' }, { status: 500 })
    }

    const body = await req.json()
    const paymentId = String(body?.paymentId || '').trim()
    const amount = asNumber(body?.amount)
    const reason = asString(body?.reason).trim()

    if (!paymentId) {
      return NextResponse.json({ error: 'paymentId obrigatorio.' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = service as any
    const paymentLookup = await db
      .from('payments')
      .select('*')
      .eq('id', paymentId)
      .limit(1)
      .maybeSingle()

    const payment = paymentLookup.data as Record<string, unknown> | null
    if (paymentLookup.error || !payment) {
      return NextResponse.json({ error: paymentLookup.error?.message || 'Pagamento nao encontrado.' }, { status: 404 })
    }

    const provider = asString(payment.provider).toLowerCase()
    const providerPaymentId = asString(payment.provider_payment_id || payment.provider_reference)
    const paymentAmount = asNumber(payment.amount)
    const bookingId = asString(payment.booking_id) || null
    const currentStatus = asString(payment.status).toLowerCase()

    if (provider !== 'mercadopago' || !providerPaymentId) {
      return NextResponse.json({ error: 'Somente pagamentos Mercado Pago com provider_payment_id podem ser reembolsados.' }, { status: 400 })
    }

    if (currentStatus === 'refunded') {
      return NextResponse.json({ error: 'Este pagamento ja esta reembolsado.' }, { status: 400 })
    }

    const refundRows = await db
      .from('payment_refunds')
      .select('amount')
      .eq('payment_id', paymentId)

    if (refundRows.error) {
      if (isMissingRefundsTableError(refundRows.error)) {
        return NextResponse.json(
          { error: 'A tabela payment_refunds ainda nao existe neste ambiente. Rode a migration de reembolsos no Supabase antes de usar essa funcao.' },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: refundRows.error.message || 'Falha ao consultar historico de reembolsos.' }, { status: 500 })
    }

    const refundedAmount = (Array.isArray(refundRows.data) ? refundRows.data : [])
      .reduce((sum: number, row: { amount?: number | string }) => sum + asNumber(row.amount), 0)

    const remainingAmount = Math.max(0, paymentAmount - refundedAmount)
    if (remainingAmount <= 0) {
      return NextResponse.json({ error: 'Nao ha saldo restante para reembolso.' }, { status: 400 })
    }

    const refundAmount = amount > 0 ? amount : remainingAmount
    if (refundAmount <= 0 || refundAmount > remainingAmount) {
      return NextResponse.json({ error: 'Valor de reembolso invalido.' }, { status: 400 })
    }

    const mpClient = new PaymentRefund(new MercadoPagoConfig({ accessToken }))
    const refundResponse = refundAmount < paymentAmount
      ? await mpClient.create({ payment_id: providerPaymentId, body: { amount: refundAmount } })
      : await mpClient.total({ payment_id: providerPaymentId })

    const refundStatus = asString(refundResponse.status || 'approved').toLowerCase() || 'approved'
    const providerRefundId = String(refundResponse.id || '')

    const insertAudit = await db.from('payment_refunds').insert({
      payment_id: paymentId,
      booking_id: bookingId,
      provider: 'mercadopago',
      provider_refund_id: providerRefundId || null,
      amount: refundAmount,
      reason: reason || null,
      status: refundStatus,
      refunded_by: user.id,
      metadata: refundResponse,
    }).select('id').single()

    if (insertAudit.error) {
      if (isMissingRefundsTableError(insertAudit.error)) {
        return NextResponse.json(
          { error: 'O pagamento foi reembolsado no Mercado Pago, mas a tabela payment_refunds nao existe neste ambiente para auditar a operacao. Rode a migration antes de tentar novos reembolsos.' },
          { status: 500 },
        )
      }
      return NextResponse.json({ error: insertAudit.error.message || 'Falha ao salvar auditoria de reembolso.' }, { status: 500 })
    }

    const nextRefundedAmount = refundedAmount + refundAmount
    const isFullyRefunded = nextRefundedAmount >= paymentAmount - 0.0001
    const refundRecordedAt = new Date().toISOString()

    const metadata = payment.metadata && typeof payment.metadata === 'object' ? payment.metadata as Record<string, unknown> : {}
    const nextMetadata = {
      ...metadata,
      refunded_amount: nextRefundedAmount,
      last_refund_reason: reason || metadata.last_refund_reason || null,
    }

    const paymentUpdate = await db
      .from('payments')
      .update({
        status: isFullyRefunded ? 'refunded' : payment.status,
        refunded_at: isFullyRefunded ? new Date().toISOString() : payment.refunded_at || null,
        metadata: nextMetadata,
      })
      .eq('id', paymentId)

    if (paymentUpdate.error) {
      return NextResponse.json({ error: paymentUpdate.error.message || 'Falha ao atualizar pagamento apos reembolso.' }, { status: 500 })
    }

    return NextResponse.json({
      data: {
        paymentId,
        refundId: providerRefundId,
        refundAmount,
        refundedAmount: nextRefundedAmount,
        remainingAmount: Math.max(0, paymentAmount - nextRefundedAmount),
        paymentStatus: isFullyRefunded ? 'refunded' : currentStatus,
        refundStatus,
        refundedAt: isFullyRefunded ? refundRecordedAt : null,
        refundRecordedAt,
      },
      error: null,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao processar reembolso.' }, { status: 500 })
  }
}
