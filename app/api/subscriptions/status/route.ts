import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { findLatestStripeSubscriptionByEmail, syncStripeSubscriptionToDb } from '@/lib/payments/stripeSubscription'

type SubscriptionStatusRow = {
  provider?: string | null
  provider_sub_id?: string | null
  amount?: number | null
  status?: string | null
}

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data, error } = await db
      .from('subscriptions')
      .select('*')
      .eq('instructor_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle() as { data: SubscriptionStatusRow | null; error: Error | null }

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    if (data?.provider && data.provider !== 'stripe') {
      return NextResponse.json({ error: 'Este endpoint suporta apenas assinaturas Stripe.' }, { status: 400 })
    }

    const stripeSecretKey = process.env.STRIPE_SECRET_KEY
    if (data?.provider === 'stripe' && data?.provider_sub_id && stripeSecretKey) {
      try {
        const stripe = new Stripe(stripeSecretKey)
        const subscription = await stripe.subscriptions.retrieve(String(data.provider_sub_id))

        const synced = await syncStripeSubscriptionToDb({
          db,
          subscription,
          fallbackInstructorId: user.id,
          fallbackAmount: Number(data.amount || 15),
        })

        if (!synced.error) {
          return NextResponse.json({ data: synced.data || data, error: null })
        }
      } catch {
        // Keep local status if Stripe request fails.
      }
    }

    if (stripeSecretKey && user.email && (!data || data.status === 'cancelled' || data.status === 'expired')) {
      try {
        const stripe = new Stripe(stripeSecretKey)
        const subscription = await findLatestStripeSubscriptionByEmail(stripe, user.email)

        if (subscription) {
          const synced = await syncStripeSubscriptionToDb({
            db,
            subscription,
            fallbackInstructorId: user.id,
            fallbackEmail: user.email,
            fallbackAmount: Number(data?.amount || 15),
          })

          if (!synced.error) {
            return NextResponse.json({ data: synced.data || data, error: null })
          }
        }
      } catch {
        // Keep local status if Stripe recovery fails.
      }
    }

    return NextResponse.json({ data: data || null, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao buscar assinatura.' }, { status: 500 })
  }
}
