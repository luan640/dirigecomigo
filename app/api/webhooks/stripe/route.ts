import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import Stripe from 'stripe'

import { syncStripeSubscriptionToDb } from '@/lib/payments/stripeSubscription'

export const runtime = 'nodejs'

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!supabaseUrl || !serviceRoleKey) return null

  return createAdminClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

async function resolveCustomerEmail(stripe: Stripe, customerId: string | Stripe.Customer | Stripe.DeletedCustomer | null) {
  if (!customerId) return null
  if (typeof customerId !== 'string') {
    return 'email' in customerId ? String(customerId.email || '').trim() || null : null
  }

  const customer = await stripe.customers.retrieve(customerId)
  if (customer.deleted) return null
  return String(customer.email || '').trim() || null
}

export async function POST(req: Request) {
  const secretKey = process.env.STRIPE_SECRET_KEY
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

  if (!secretKey || !webhookSecret) {
    return NextResponse.json({ ok: false, error: 'Credenciais do Stripe nao configuradas.' }, { status: 500 })
  }

  const signature = req.headers.get('stripe-signature')
  if (!signature) {
    return NextResponse.json({ ok: false, error: 'Assinatura do webhook ausente.' }, { status: 400 })
  }

  const stripe = new Stripe(secretKey)
  const body = await req.text()

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err) {
    return NextResponse.json({ ok: false, error: `Webhook invalido: ${String((err as Error).message || err)}` }, { status: 400 })
  }

  const service = getAdminClient()
  if (!service) {
    return NextResponse.json({ ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription' || !session.subscription) break

        const subscription = typeof session.subscription === 'string'
          ? await stripe.subscriptions.retrieve(session.subscription)
          : session.subscription
        const customerEmail = String(session.customer_details?.email || session.customer_email || '').trim() || null

        await syncStripeSubscriptionToDb({
          db: service,
          subscription,
          fallbackInstructorId: String(session.client_reference_id || session.metadata?.instructor_id || '').trim() || undefined,
          fallbackEmail: customerEmail || undefined,
        })
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerEmail = await resolveCustomerEmail(stripe, subscription.customer)

        await syncStripeSubscriptionToDb({
          db: service,
          subscription,
          fallbackEmail: customerEmail || undefined,
        })
        break
      }

      default:
        break
    }

    return NextResponse.json({ ok: true })
  } catch {
    // Acknowledge the event to avoid unnecessary retries while the local state catches up.
    return NextResponse.json({ ok: true })
  }
}
