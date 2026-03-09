import { createClient as createAdminClient } from '@supabase/supabase-js'

import { normalizeWeeklyScheduleSettings } from '@/lib/schedule'
import type { InstructorCard } from '@/types'

type InstructorRow = Record<string, unknown>
type SubscriptionRow = Record<string, unknown>

function buildInstructorCard(row: InstructorRow): InstructorCard {
  const profile = (row.profile as Record<string, unknown>) || {}
  const rawCategories = Array.isArray(row.categories) ? row.categories : []

  return {
    id: String(row.id || ''),
    name: String(profile.full_name || 'Instrutor'),
    avatar_url: String(profile.avatar_url || '').trim() || null,
    rating: Number(row.rating || 0),
    review_count: Number(row.review_count || 0),
    price_per_lesson: Number(row.price_per_lesson || 0),
    price_per_lesson_a: row.price_per_lesson_a !== null && row.price_per_lesson_a !== undefined ? Number(row.price_per_lesson_a) : null,
    price_per_lesson_b: row.price_per_lesson_b !== null && row.price_per_lesson_b !== undefined ? Number(row.price_per_lesson_b) : null,
    neighborhood: String(row.neighborhood || ''),
    city: String(row.city || 'Fortaleza'),
    state: String(row.state || 'CE'),
    bio: row.bio ? String(row.bio) : null,
    category: String(row.category || 'B') as InstructorCard['category'],
    categories: rawCategories.map(item => String(item) as InstructorCard['category']),
    vehicle_type: row.vehicle_type ? String(row.vehicle_type) : null,
    vehicle_brand: row.vehicle_brand ? String(row.vehicle_brand) : null,
    total_lessons: Number(row.total_lessons || 0),
    latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
    weekly_schedule: row.weekly_schedule ? normalizeWeeklyScheduleSettings(row.weekly_schedule) : null,
    is_verified: Boolean(row.is_verified),
    available_today: true,
    availability_label: 'available',
    min_advance_booking_hours: Number(row.min_advance_booking_hours || 0),
    cancellation_notice_hours: Number(row.cancellation_notice_hours || 24),
  }
}

function hasActiveSubscription(row: SubscriptionRow, today: string) {
  const status = String(row.status || '')
  const endRaw = String(row.current_period_end || row.expires_at || '')
  if (status !== 'active') return false
  if (!endRaw) return true
  return endRaw.slice(0, 10) >= today
}

export async function loadPublicInstructors(): Promise<InstructorCard[]> {
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const today = new Date().toISOString().slice(0, 10)

  try {
    if (serviceUrl && serviceKey) {
      const db = createAdminClient(serviceUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }) as unknown as {
        from: (table: string) => {
          select: (query: string) => {
            eq: (column: string, value: unknown) => {
              order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: unknown[] | null; error: Error | null }>
            }
            order: (column: string, options?: { ascending?: boolean }) => Promise<{ data: unknown[] | null; error: Error | null }>
          }
        }
      }

      const [{ data: instructors, error: instructorsError }, { data: subscriptions, error: subscriptionsError }] = await Promise.all([
        db
          .from('instructors')
          .select('*,profile:profiles(full_name,avatar_url)')
          .order('rating', { ascending: false }),
        db
          .from('subscriptions')
          .select('*')
          .order('updated_at', { ascending: false }),
      ])

      if (instructorsError || subscriptionsError || !Array.isArray(instructors)) return []

      const subscriptionsByInstructor = new Map<string, SubscriptionRow[]>()
      for (const row of Array.isArray(subscriptions) ? subscriptions : []) {
        const instructorId = String((row as SubscriptionRow).instructor_id || '')
        if (!instructorId) continue
        const current = subscriptionsByInstructor.get(instructorId) || []
        current.push(row as SubscriptionRow)
        subscriptionsByInstructor.set(instructorId, current)
      }

      return instructors
        .filter(row => (row as InstructorRow).is_active !== false)
        .filter(row => {
          const instructorId = String((row as InstructorRow).id || '')
          const instructorSubscriptions = subscriptionsByInstructor.get(instructorId) || []
          return instructorSubscriptions.some(subscription => hasActiveSubscription(subscription, today))
        })
        .map(row => buildInstructorCard(row as InstructorRow))
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('instructors')
      .select('*,profile:profiles(full_name,avatar_url)')
      .order('rating', { ascending: false })

    if (error || !Array.isArray(data)) return []
    return data
      .filter((row: InstructorRow) => row.is_active !== false)
      .map((row: InstructorRow) => buildInstructorCard(row))
  } catch {
    return []
  }
}
