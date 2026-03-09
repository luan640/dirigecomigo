import { NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'
import Stripe from 'stripe'

import { syncPreapprovalToSubscription } from '@/lib/payments/mercadoPagoSubscription'
import { syncStripeSubscriptionToDb } from '@/lib/payments/stripeSubscription'

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
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (data?.provider === 'mercadopago' && data?.provider_sub_id && accessToken) {
      try {
        const client = new MercadoPagoConfig({ accessToken })
        const preapprovalClient = new PreApproval(client)
        const preapproval = await preapprovalClient.get({ id: String(data.provider_sub_id) })

        const synced = await syncPreapprovalToSubscription({
          db,
          preapproval: preapproval as unknown as Record<string, unknown>,
          fallbackInstructorId: user.id,
          fallbackAmount: Number(data.amount || 15),
        })

        if (!synced.error) {
          return NextResponse.json({ data: synced.data || data, error: null })
        }
      } catch {
        // Keep local status if Mercado Pago request fails.
      }
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

    return NextResponse.json({ data: data || null, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao buscar assinatura.' }, { status: 500 })
  }
}
