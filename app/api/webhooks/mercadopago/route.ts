import { NextResponse } from 'next/server'
import { MercadoPagoConfig, Payment, PreApproval } from 'mercadopago'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { persistMercadoPagoPayment } from '@/lib/payments/mercadoPagoPersistence'
import { syncPreapprovalToSubscription } from '@/lib/payments/mercadoPagoSubscription'

function mapMercadoPagoStatus(status?: string): 'pending' | 'processing' | 'paid' | 'failed' | 'refunded' {
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

export async function POST(req: Request) {
  try {
    const payload = await req.json().catch(() => ({}))
    const url = new URL(req.url)
    const type = String(payload?.type || payload?.topic || url.searchParams.get('type') || url.searchParams.get('topic') || '')
    const resourceId = String(payload?.data?.id || payload?.id || '')

    if (type === 'payment' && resourceId) {
      const paymentsAccessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!paymentsAccessToken) {
        return NextResponse.json({ ok: false, error: 'MERCADOPAGO_ACCESS_TOKEN nao configurado.' }, { status: 500 })
      }

      const paymentClient = new Payment(new MercadoPagoConfig({ accessToken: paymentsAccessToken }))
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

    const isSubscriptionTopic =
      type.includes('subscription') ||
      type.includes('preapproval') ||
      type.includes('authorized_payment')

    if (isSubscriptionTopic && resourceId) {
      const subscriptionAccessToken =
        process.env.MERCADOPAGO_ACCESS_TOKEN_ASSINATURA ||
        process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!subscriptionAccessToken) {
        return NextResponse.json(
          { ok: false, error: 'MERCADOPAGO_ACCESS_TOKEN_ASSINATURA nao configurado.' },
          { status: 500 },
        )
      }

      const preapprovalClient = new PreApproval(new MercadoPagoConfig({ accessToken: subscriptionAccessToken }))
      const preapproval = await preapprovalClient.get({ id: resourceId })

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
      if (supabaseUrl && serviceRoleKey) {
        const service = createAdminClient(supabaseUrl, serviceRoleKey, {
          auth: { persistSession: false, autoRefreshToken: false },
        })

        await syncPreapprovalToSubscription({
          db: service,
          preapproval: preapproval as unknown as Record<string, unknown>,
        })
      }
    }

    return NextResponse.json({ ok: true })
  } catch {
    return NextResponse.json({ ok: true })
  }
}
