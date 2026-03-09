import { format } from 'date-fns'
import type Stripe from 'stripe'

import { ensureInstructorRow } from '@/lib/payments/mercadoPagoSubscription'

type DbClient = {
  from: (table: string) => {
    select: (fields: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
        order: (column: string, options: { ascending: boolean }) => {
          limit: (value: number) => {
            maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
          }
        }
      }
    }
    insert: (payload: Record<string, unknown>) => {
      select: (fields: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
      }
    }
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => {
        select: (fields: string) => {
          maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
        }
      }
    }
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function mapStripeSubscriptionStatus(status?: Stripe.Subscription.Status): 'active' | 'pending' | 'expired' | 'cancelled' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active'
    case 'canceled':
      return 'cancelled'
    case 'incomplete_expired':
      return 'expired'
    case 'incomplete':
    case 'past_due':
    case 'paused':
    case 'unpaid':
    default:
      return 'pending'
  }
}

function toDateString(unixSeconds?: number | null) {
  if (!unixSeconds) return null
  return format(new Date(unixSeconds * 1000), 'yyyy-MM-dd')
}

function resolveSubscriptionPeriod(subscription: Stripe.Subscription) {
  const primaryItem = subscription.items.data[0]
  const currentPeriodStart =
    toDateString(primaryItem?.current_period_start) ||
    toDateString(subscription.trial_start) ||
    toDateString(subscription.billing_cycle_anchor)
  const currentPeriodEnd =
    toDateString(primaryItem?.current_period_end) ||
    toDateString(subscription.trial_end)

  return {
    currentPeriodStart,
    currentPeriodEnd,
  }
}

async function resolveInstructorId(db: DbClient, args: {
  fallbackInstructorId?: string
  fallbackEmail?: string
  metadata?: Stripe.Metadata | null
}) {
  const metadataInstructorId = String(args.metadata?.instructor_id || args.metadata?.instructorId || '').trim()
  if (isUuid(metadataInstructorId)) return metadataInstructorId
  if (args.fallbackInstructorId && isUuid(args.fallbackInstructorId)) return args.fallbackInstructorId

  const email = String(args.fallbackEmail || args.metadata?.email || '').trim()
  if (!email) return null

  const { data: profile } = await db
    .from('profiles')
    .select('id,email')
    .eq('email', email)
    .maybeSingle()

  if (!profile?.id) return null
  return String(profile.id)
}

export async function syncStripeSubscriptionToDb(args: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any
  subscription: Stripe.Subscription
  fallbackInstructorId?: string
  fallbackEmail?: string
  fallbackAmount?: number
}) {
  const { db, subscription, fallbackInstructorId, fallbackEmail, fallbackAmount } = args
  const instructorId = await resolveInstructorId(db as DbClient, {
    fallbackInstructorId,
    fallbackEmail,
    metadata: subscription.metadata,
  })

  if (!instructorId) {
    return { data: null, error: 'Nao foi possivel identificar o instrutor da assinatura Stripe.' }
  }

  const ensured = await ensureInstructorRow(db as DbClient, instructorId)
  if (!ensured.ok) return { data: null, error: ensured.error }

  const now = new Date()
  const period = resolveSubscriptionPeriod(subscription)
  const currentPeriodStart = period.currentPeriodStart || format(now, 'yyyy-MM-dd')
  const currentPeriodEnd = period.currentPeriodEnd || format(now, 'yyyy-MM-dd')
  const amount = subscription.items.data[0]?.price?.unit_amount
    ? subscription.items.data[0].price.unit_amount / 100
    : (fallbackAmount || 15)
  const mappedStatus = mapStripeSubscriptionStatus(subscription.status)
  const payload = {
    instructor_id: instructorId,
    status: mappedStatus,
    amount,
    current_period_start: currentPeriodStart,
    current_period_end: currentPeriodEnd,
    provider: 'stripe',
    provider_sub_id: subscription.id,
    cancelled_at: mappedStatus === 'cancelled' ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }

  const updateByProvider = await db
    .from('subscriptions')
    .update(payload)
    .eq('provider_sub_id', subscription.id)
    .select('*')
    .maybeSingle()

  if (!updateByProvider.error && updateByProvider.data) {
    return { data: updateByProvider.data, error: null }
  }

  const { data: latest } = await db
    .from('subscriptions')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest?.id) {
    const updateLatest = await db
      .from('subscriptions')
      .update(payload)
      .eq('id', latest.id)
      .select('*')
      .maybeSingle()

    if (!updateLatest.error && updateLatest.data) {
      return { data: updateLatest.data, error: null }
    }
  }

  const insertNew = await db
    .from('subscriptions')
    .insert(payload)
    .select('*')
    .single()

  if (insertNew.error) return { data: null, error: insertNew.error.message }
  return { data: insertNew.data, error: null }
}
