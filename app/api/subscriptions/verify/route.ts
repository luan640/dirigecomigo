import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { syncStripeSubscriptionToDb } from '@/lib/payments/stripeSubscription'

export async function GET(req: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

    const secretKey = process.env.STRIPE_SECRET_KEY
    if (!secretKey) {
      return NextResponse.json({ error: 'STRIPE_SECRET_KEY nao configurado.' }, { status: 500 })
    }

    const sessionId = new URL(req.url).searchParams.get('session_id')
    if (!sessionId) {
      return NextResponse.json({ error: 'session_id obrigatorio.' }, { status: 400 })
    }

    const stripe = new Stripe(secretKey)
    const session = await stripe.checkout.sessions.retrieve(sessionId)
    if (session.mode !== 'subscription' || !session.subscription) {
      return NextResponse.json({ error: 'Sessao Stripe sem assinatura vinculada.' }, { status: 400 })
    }

    const subscription = typeof session.subscription === 'string'
      ? await stripe.subscriptions.retrieve(session.subscription)
      : session.subscription

    const customerEmail = String(session.customer_details?.email || session.customer_email || user.email || '').trim() || undefined
    const fallbackInstructorId = String(session.client_reference_id || session.metadata?.instructor_id || user.id).trim() || user.id

    const synced = await syncStripeSubscriptionToDb({
      db: supabase,
      subscription,
      fallbackInstructorId,
      fallbackEmail: customerEmail,
    })

    if (synced.error) {
      return NextResponse.json({ error: synced.error }, { status: 400 })
    }

    return NextResponse.json({ data: synced.data, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao verificar checkout.' }, { status: 500 })
  }
}
