import { addDays, addMinutes } from 'date-fns'
import { NextResponse } from 'next/server'

import { PLATFORM_CONFIG } from '@/constants/pricing'
import {
  findLatestMercadoPagoPreapproval,
  getMercadoPagoPlanId,
  getMercadoPagoSubscriptionClient,
  mapPreapprovalStatus,
  syncPreapprovalToSubscription,
} from '@/lib/payments/mercadoPagoSubscription'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

function resolveBaseUrl(req: Request) {
  const configuredAppUrl = String(process.env.NEXT_PUBLIC_APP_URL || '').trim().replace(/\/$/, '')
  if (configuredAppUrl) {
    return configuredAppUrl
  }

  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https'

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '')
  }

  try {
    return new URL(req.url).origin.replace(/\/$/, '')
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

    const body = await req.json().catch(() => ({}))
    const intent = String(body?.intent || 'activate').trim()

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any

    if (DEMO_MODE) {
      const now = new Date()
      const fakePreapproval = {
        id: `demo_preapproval_${Date.now()}`,
        status: 'authorized',
        payer_email: user.email || '',
        external_reference: user.id,
        next_payment_date: addDays(now, 30).toISOString(),
        auto_recurring: {
          transaction_amount: PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE,
          currency_id: 'BRL',
        },
      }

      const synced = await syncPreapprovalToSubscription({
        db,
        preapproval: fakePreapproval,
        fallbackInstructorId: user.id,
        fallbackAmount: PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE,
      })

      if (synced.error) return NextResponse.json({ error: synced.error }, { status: 400 })
      return NextResponse.json({ data: synced.data, error: null })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'Usuario sem e-mail para criar assinatura.' }, { status: 400 })
    }

    if (intent === 'manage-payment-method') {
      return NextResponse.json(
        { error: 'O Mercado Pago nao oferece portal de gestao de cartao neste fluxo. Cancele e refaca a assinatura.' },
        { status: 400 },
      )
    }

    const appUrl = resolveBaseUrl(req)
    if (!appUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL nao configurado.' }, { status: 500 })
    }

    const currentSubscription = await findLatestMercadoPagoPreapproval({
      payerEmail: user.email,
      externalReference: user.id,
    })

    if (currentSubscription) {
      const remoteStatus = mapPreapprovalStatus(currentSubscription.status)
      if (remoteStatus === 'active') {
        const synced = await syncPreapprovalToSubscription({
          db,
          preapproval: currentSubscription as unknown as Record<string, unknown>,
          fallbackInstructorId: user.id,
          fallbackAmount: PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE,
        })

        if (synced.error) return NextResponse.json({ error: synced.error }, { status: 400 })
        return NextResponse.json({ data: synced.data, error: null })
      }

      const pendingInitPoint = String(currentSubscription.init_point || '').trim()
      if (remoteStatus === 'pending' && pendingInitPoint) {
        return NextResponse.json({
          data: null,
          redirect_url: pendingInitPoint,
          preapproval_id: currentSubscription.id || null,
          error: null,
        })
      }
    }

    const client = getMercadoPagoSubscriptionClient()
    const backUrl = new URL('/painel/assinatura?checkout=success', `${appUrl.replace(/\/$/, '')}/`).toString()
    const planId = getMercadoPagoPlanId()
    const reason = 'MeuInstrutor Pro'

    const payload = planId
      ? {
          preapproval_plan_id: planId,
          payer_email: user.email,
          external_reference: user.id,
          back_url: backUrl,
          reason,
          status: 'pending',
        }
      : {
          payer_email: user.email,
          external_reference: user.id,
          back_url: backUrl,
          reason,
          status: 'pending',
          auto_recurring: {
            frequency: 1,
            frequency_type: 'months',
            transaction_amount: PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE,
            currency_id: 'BRL',
            start_date: addMinutes(new Date(), 10).toISOString(),
          },
        }

    const preapproval = await client.create({
      body: payload,
    })

    return NextResponse.json({
      data: null,
      redirect_url: preapproval.init_point || null,
      preapproval_id: preapproval.id || null,
      error: preapproval.init_point ? null : 'Mercado Pago nao retornou URL de autorizacao.',
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao ativar assinatura.' }, { status: 500 })
  }
}
