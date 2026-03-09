import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { PLATFORM_CONFIG } from '@/constants/pricing'
import { syncStripeSubscriptionToDb } from '@/lib/payments/stripeSubscription'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

function resolveBaseUrl(req: Request) {
  const forwardedHost = req.headers.get('x-forwarded-host')
  const forwardedProto = req.headers.get('x-forwarded-proto') || 'https'

  if (forwardedHost) {
    return `${forwardedProto}://${forwardedHost}`.replace(/\/$/, '')
  }

  try {
    return new URL(req.url).origin.replace(/\/$/, '')
  } catch {
    return process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, '') || null
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
      const fakeSubscription = {
        id: `demo_sub_${Date.now()}`,
        status: 'active',
        metadata: {
          instructor_id: user.id,
          email: user.email || '',
        },
        current_period_start: Math.floor(Date.now() / 1000),
        current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000),
        items: {
          data: [
            {
              price: {
                unit_amount: Math.round(PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE * 100),
              },
            },
          ],
        },
      }

      const synced = await syncStripeSubscriptionToDb({
        db,
        subscription: fakeSubscription as unknown as Stripe.Subscription,
        fallbackInstructorId: user.id,
        fallbackEmail: user.email || undefined,
        fallbackAmount: PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE,
      })

      if (synced.error) return NextResponse.json({ error: synced.error }, { status: 400 })
      return NextResponse.json({ data: synced.data, error: null })
    }

    if (!user.email) {
      return NextResponse.json({ error: 'Usuario sem e-mail para criar assinatura.' }, { status: 400 })
    }

    const secretKey = process.env.STRIPE_SECRET_KEY
    const priceId = process.env.STRIPE_PRICE_ID
    const appUrl = resolveBaseUrl(req)

    if (!secretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY nao configurado.' }, { status: 500 })
    }
    if (!priceId) {
      return NextResponse.json({ error: 'STRIPE_PRICE_ID nao configurado.' }, { status: 500 })
    }
    if (!appUrl) {
      return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL nao configurado.' }, { status: 500 })
    }

    const stripe = new Stripe(secretKey)
    const baseUrl = appUrl.replace(/\/$/, '')

    if (intent === 'manage-payment-method') {
      const { data: subscription, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('instructor_id', user.id)
        .eq('provider', 'stripe')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) return NextResponse.json({ error: error.message }, { status: 400 })
      if (!subscription?.provider_sub_id) {
        return NextResponse.json({ error: 'Nenhuma assinatura Stripe encontrada para gerenciar.' }, { status: 400 })
      }

      const stripeSubscription = await stripe.subscriptions.retrieve(String(subscription.provider_sub_id))
      const customerId = typeof stripeSubscription.customer === 'string'
        ? stripeSubscription.customer
        : stripeSubscription.customer?.id

      if (!customerId) {
        return NextResponse.json({ error: 'Nao foi possivel identificar o cliente no Stripe.' }, { status: 400 })
      }

      const portalSession = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: `${baseUrl}/painel/assinatura?portal=returned`,
      })

      return NextResponse.json({
        data: null,
        redirect_url: portalSession.url,
        error: null,
      })
    }

    const lineItem = priceId.startsWith('price_')
      ? {
          price: priceId,
          quantity: 1,
        }
      : {
          price_data: {
            currency: 'brl',
            unit_amount: Math.round(PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE * 100),
            recurring: { interval: 'month' as const },
            product_data: {
              name: 'Direcao Facil Pro',
              description: 'Assinatura mensal recorrente para instrutores',
            },
          },
          quantity: 1,
        }

    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      success_url: `${baseUrl}/painel/assinatura?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/painel/assinatura?checkout=cancelled`,
      client_reference_id: user.id,
      customer_email: user.email,
      metadata: {
        instructor_id: user.id,
        email: user.email,
      },
      subscription_data: {
        metadata: {
          instructor_id: user.id,
          email: user.email,
        },
      },
      line_items: [lineItem],
      allow_promotion_codes: true,
    })

    return NextResponse.json({
      data: null,
      redirect_url: session.url,
      error: null,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao ativar assinatura.' }, { status: 500 })
  }
}
