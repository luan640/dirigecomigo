import { NextResponse } from 'next/server'
import Stripe from 'stripe'

import { syncStripeSubscriptionToDb } from '@/lib/payments/stripeSubscription'

type ActiveSubscriptionRow = {
  id?: string | null
  provider?: string | null
  provider_sub_id?: string | null
  amount?: number | null
}

export async function POST() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const nowIso = new Date().toISOString()

    const { data: currentSubs, error: subsError } = await db
      .from('subscriptions')
      .select('*')
      .eq('instructor_id', user.id)
      .in('status', ['active', 'trial'])
      .order('updated_at', { ascending: false })

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 400 })
    }

    const activeSubs: ActiveSubscriptionRow[] = Array.isArray(currentSubs) ? currentSubs : []
    if (!activeSubs.length) {
      return NextResponse.json({ data: null, error: null })
    }

    const unsupportedProvider = activeSubs.find(
      row => row.provider && row.provider !== 'stripe',
    )
    if (unsupportedProvider) {
      return NextResponse.json({ error: 'Este endpoint suporta apenas assinaturas Stripe.' }, { status: 400 })
    }

    const stripeSubs = activeSubs.filter(
      row => row.provider === 'stripe' && row.provider_sub_id,
    )
    if (stripeSubs.length) {
      const secretKey = process.env.STRIPE_SECRET_KEY
      if (!secretKey) {
        return NextResponse.json({ error: 'STRIPE_SECRET_KEY nao configurado.' }, { status: 500 })
      }

      const stripe = new Stripe(secretKey)
      for (const row of stripeSubs) {
        try {
          const cancelledSubscription = await stripe.subscriptions.cancel(String(row.provider_sub_id))

          const synced = await syncStripeSubscriptionToDb({
            db,
            subscription: cancelledSubscription,
            fallbackInstructorId: user.id,
            fallbackAmount: Number(row.amount || 15),
          })

          if (synced.error) {
            return NextResponse.json({ error: synced.error }, { status: 400 })
          }
        } catch (err) {
          const message = String((err as Error)?.message || '')
          const ignorable = message.includes('404') || message.toLowerCase().includes('not found')
          if (!ignorable) {
            return NextResponse.json({ error: `Falha ao cancelar no Stripe: ${message}` }, { status: 400 })
          }
        }
      }
    }

    const subIds = activeSubs
      .map(row => String(row.id || ''))
      .filter(Boolean)

    const tryNew = await db
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: nowIso, updated_at: nowIso })
      .in('id', subIds)
      .select('*')

    if (!tryNew.error && tryNew.data?.length) {
      return NextResponse.json({ data: tryNew.data[0], error: null })
    }

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao cancelar assinatura.' }, { status: 500 })
  }
}
