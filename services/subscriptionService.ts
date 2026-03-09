import type { Subscription, SubscriptionStatus, ApiResponse } from '@/types'
import { PLATFORM_CONFIG } from '@/constants/pricing'
import { addMonths, isAfter, parseISO } from 'date-fns'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

/**
 * Demo subscription data
 */
const DEMO_SUBSCRIPTION: Subscription = {
  id: 'demo-sub-1',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  instructor_id: 'demo-instructor',
  status: 'active',
  amount: PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE,
  started_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
  expires_at: addMonths(new Date(), 1).toISOString(),
  provider: 'mock',
  provider_reference: 'mock_sub_demo',
  cancelled_at: null,
}

/**
 * Subscription service — manages instructor monthly subscriptions.
 */
export const subscriptionService = {
  /**
   * Get the current active subscription for an instructor
   */
  async getInstructorSubscription(instructorId: string): Promise<ApiResponse<Subscription | null>> {
    if (DEMO_MODE) {
      return { data: { ...DEMO_SUBSCRIPTION, instructor_id: instructorId }, error: null }
    }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const { data, error } = await supabase
        .from('subscriptions')
        .select('*')
        .eq('instructor_id', instructorId)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  /**
   * Check if an instructor has an active subscription
   */
  async isSubscriptionActive(instructorId: string): Promise<boolean> {
    if (DEMO_MODE) return true

    const { data } = await subscriptionService.getInstructorSubscription(instructorId)
    if (!data) return false

    return (
      data.status === 'active' &&
      isAfter(parseISO(data.expires_at), new Date())
    )
  },

  /**
   * Create or renew a subscription (called after payment success)
   */
  async createSubscription(params: {
    instructor_id: string
    provider: string
    provider_reference?: string
  }): Promise<ApiResponse<Subscription>> {
    if (DEMO_MODE) {
      const sub: Subscription = {
        ...DEMO_SUBSCRIPTION,
        instructor_id: params.instructor_id,
        id: `demo-sub-${Date.now()}`,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        started_at: new Date().toISOString(),
        expires_at: addMonths(new Date(), 1).toISOString(),
      }
      return { data: sub, error: null }
    }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      const now = new Date()
      const expiresAt = addMonths(now, 1)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error } = await (supabase as any)
        .from('subscriptions')
        .insert({
          ...params,
          status: 'active',
          amount: PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE,
          started_at: now.toISOString(),
          expires_at: expiresAt.toISOString(),
        })
        .select()
        .single()

      if (error) throw error
      return { data, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  /**
   * Cancel a subscription
   */
  async cancelSubscription(subscriptionId: string): Promise<ApiResponse<null>> {
    if (DEMO_MODE) return { data: null, error: null }

    try {
      const { createClient } = await import('@/lib/supabase/server')
      const supabase = await createClient()

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase as any)
        .from('subscriptions')
        .update({ status: 'cancelled', cancelled_at: new Date().toISOString() })
        .eq('id', subscriptionId)

      if (error) throw error
      return { data: null, error: null }
    } catch (err) {
      return { data: null, error: (err as Error).message }
    }
  },

  /**
   * Get subscription status label and color for UI
   */
  getStatusDisplay(status: SubscriptionStatus): { label: string; color: string } {
    const map: Record<SubscriptionStatus, { label: string; color: string }> = {
      active: { label: 'Ativa', color: 'text-emerald-700 bg-emerald-100' },
      pending: { label: 'Pendente', color: 'text-amber-700 bg-amber-100' },
      expired: { label: 'Vencida', color: 'text-red-700 bg-red-100' },
      cancelled: { label: 'Cancelada', color: 'text-gray-700 bg-gray-100' },
    }
    return map[status]
  },
}
