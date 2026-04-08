import { addHours, format } from 'date-fns'
import { createClient as createAdminClient } from '@supabase/supabase-js'

import { generateScheduleWindow, normalizeWeeklyScheduleSettings } from '@/lib/schedule'
import { getSaoPauloNow } from '@/lib/timezone'
import type { InstructorCard } from '@/types'

type InstructorRow = Record<string, unknown>
type SubscriptionRow = Record<string, unknown>
type AvailabilityRow = Record<string, unknown>
type BookingRow = Record<string, unknown>
type QueryResult = Promise<{ data: unknown[] | null; error: Error | null }>
type QueryBuilder = {
  eq: (column: string, value: unknown) => {
    order: (column: string, options?: { ascending?: boolean }) => QueryResult
  }
  order: (column: string, options?: { ascending?: boolean }) => QueryResult
}
type DbLike = {
  from: (table: string) => {
    select: (query: string) => QueryBuilder
  }
}

function hasActiveSubscription(row: SubscriptionRow, today: string) {
  const status = String(row.status || '')
  const endRaw = String(row.current_period_end || row.expires_at || '')
  if (status !== 'active') return false
  if (!endRaw) return true
  return endRaw.slice(0, 10) >= today
}

function getOccupiedTodayKeys(bookings: BookingRow[], today: string) {
  return new Set(
    bookings
      .filter((row) => String(row.scheduled_date || '').slice(0, 10) === today)
      .filter((row) => {
        const status = String(row.status || '')
        return status !== 'cancelled' && status !== 'no_show'
      })
      .map((row) => {
        const availabilityId = String(row.availability_slot_id || '').trim()
        if (availabilityId) return `id:${availabilityId}`

        const time = String(row.start_time || '').slice(0, 5)
        return time ? `time:${today}-${time}` : ''
      })
      .filter(Boolean)
  )
}

function getTodayAvailabilityMeta(args: {
  row: InstructorRow
  today: string
  now: Date
  availabilityRows: AvailabilityRow[]
  bookingRows: BookingRow[]
}) {
  const { row, today, now, availabilityRows, bookingRows } = args
  const minAdvanceHours = Number(row.min_advance_booking_hours || 0)
  const cutoff = addHours(now, minAdvanceHours)
  const cutoffTime = format(cutoff, 'HH:mm')
  const occupiedKeys = getOccupiedTodayKeys(bookingRows, today)

  const explicitSlots = availabilityRows
    .filter((slot) => String(slot.date || '').slice(0, 10) === today)
    .map((slot) => ({
      id: String(slot.id || ''),
      start: String(slot.start_time || '').slice(0, 5),
      isBooked:
        Boolean(slot.is_booked) ||
        occupiedKeys.has(`id:${String(slot.id || '')}`) ||
        occupiedKeys.has(`time:${today}-${String(slot.start_time || '').slice(0, 5)}`),
    }))
    .filter((slot) => slot.start)

  let availableCount = explicitSlots.filter((slot) => !slot.isBooked && slot.start >= cutoffTime).length

  if (explicitSlots.length === 0 && row.weekly_schedule) {
    const generatedSlots = generateScheduleWindow({
      settings: normalizeWeeklyScheduleSettings(row.weekly_schedule),
      bookedLookup: occupiedKeys,
      startDate: now,
      daysAhead: 0,
    })

    availableCount = generatedSlots.filter((slot) => {
      const start = slot.start_time.slice(0, 5)
      return slot.date === today && !slot.is_booked && start >= cutoffTime
    }).length
  }

  return {
    available_today: availableCount > 0,
    availability_label:
      availableCount === 0 ? 'unavailable' : availableCount <= 2 ? 'limited' : 'available',
  } as const
}

function buildInstructorCard(args: {
  row: InstructorRow
  availabilityRows: AvailabilityRow[]
  bookingRows: BookingRow[]
  today: string
  now: Date
}): InstructorCard {
  const { row, availabilityRows, bookingRows, today, now } = args
  const profile = (row.profile as Record<string, unknown>) || {}
  const rawCategories = Array.isArray(row.categories) ? row.categories : []
  const availabilityMeta = getTodayAvailabilityMeta({
    row,
    today,
    now,
    availabilityRows,
    bookingRows,
  })

  return {
    id: String(row.id || ''),
    name: String(profile.full_name || 'Instrutor'),
    avatar_url: String(profile.avatar_url || '').trim() || null,
    rating: Number(row.rating || 0),
    review_count: Number(row.review_count || 0),
    price_per_lesson: Number(row.price_per_lesson || 0),
    price_per_lesson_a:
      row.price_per_lesson_a !== null && row.price_per_lesson_a !== undefined
        ? Number(row.price_per_lesson_a)
        : null,
    price_per_lesson_b:
      row.price_per_lesson_b !== null && row.price_per_lesson_b !== undefined
        ? Number(row.price_per_lesson_b)
        : null,
    neighborhood: String(row.neighborhood || ''),
    city: String(row.city || 'Fortaleza'),
    state: String(row.state || 'CE'),
    bio: row.bio ? String(row.bio) : null,
    category: String(row.category || 'B') as InstructorCard['category'],
    categories: rawCategories.map((item) => String(item) as InstructorCard['category']),
    vehicle_type: row.vehicle_type ? String(row.vehicle_type) : null,
    vehicle_brand: row.vehicle_brand ? String(row.vehicle_brand) : null,
    total_lessons: Number(row.total_lessons || 0),
    latitude: row.latitude !== null && row.latitude !== undefined ? Number(row.latitude) : null,
    longitude: row.longitude !== null && row.longitude !== undefined ? Number(row.longitude) : null,
    weekly_schedule: row.weekly_schedule ? normalizeWeeklyScheduleSettings(row.weekly_schedule) : null,
    is_verified: Boolean(row.is_verified),
    available_today: availabilityMeta.available_today,
    availability_label: availabilityMeta.availability_label,
    min_advance_booking_hours: Number(row.min_advance_booking_hours || 0),
    cancellation_notice_hours: Number(row.cancellation_notice_hours || 24),
  }
}

export async function loadPublicInstructors(): Promise<InstructorCard[]> {
  const serviceUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const now = getSaoPauloNow()
  const today = format(now, 'yyyy-MM-dd')

  try {
    if (serviceUrl && serviceKey) {
      const db = createAdminClient(serviceUrl, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      }) as unknown as DbLike

      const [
        { data: instructors, error: instructorsError },
        { data: subscriptions, error: subscriptionsError },
        { data: availabilityRows, error: availabilityError },
        { data: bookingRows, error: bookingError },
      ] = await Promise.all([
        db
          .from('instructors')
          .select('*,profile:profiles(full_name,avatar_url)')
          .order('rating', { ascending: false }),
        db
          .from('subscriptions')
          .select('*')
          .order('updated_at', { ascending: false }),
        db
          .from('instructor_availability')
          .select('id,instructor_id,date,start_time,end_time,is_booked')
          .eq('date', today)
          .order('start_time', { ascending: true }),
        db
          .from('bookings')
          .select('instructor_id,availability_slot_id,scheduled_date,start_time,status')
          .eq('scheduled_date', today)
          .order('start_time', { ascending: true }),
      ])

      if (
        instructorsError ||
        subscriptionsError ||
        availabilityError ||
        bookingError ||
        !Array.isArray(instructors)
      ) {
        return []
      }

      const subscriptionsByInstructor = new Map<string, SubscriptionRow[]>()
      for (const row of Array.isArray(subscriptions) ? subscriptions : []) {
        const instructorId = String((row as SubscriptionRow).instructor_id || '')
        if (!instructorId) continue
        const current = subscriptionsByInstructor.get(instructorId) || []
        current.push(row as SubscriptionRow)
        subscriptionsByInstructor.set(instructorId, current)
      }

      const availabilityByInstructor = new Map<string, AvailabilityRow[]>()
      for (const row of Array.isArray(availabilityRows) ? availabilityRows : []) {
        const instructorId = String((row as AvailabilityRow).instructor_id || '')
        if (!instructorId) continue
        const current = availabilityByInstructor.get(instructorId) || []
        current.push(row as AvailabilityRow)
        availabilityByInstructor.set(instructorId, current)
      }

      const bookingsByInstructor = new Map<string, BookingRow[]>()
      for (const row of Array.isArray(bookingRows) ? bookingRows : []) {
        const instructorId = String((row as BookingRow).instructor_id || '')
        if (!instructorId) continue
        const current = bookingsByInstructor.get(instructorId) || []
        current.push(row as BookingRow)
        bookingsByInstructor.set(instructorId, current)
      }

      return instructors
        .filter((row) => (row as InstructorRow).is_active === true)
        .filter((row) => String((row as InstructorRow).status || '') === 'approved')
        .filter((row) => {
          const instructorId = String((row as InstructorRow).id || '')
          const instructorSubscriptions = subscriptionsByInstructor.get(instructorId) || []
          return instructorSubscriptions.some((subscription) => hasActiveSubscription(subscription, today))
        })
        .map((row) =>
          buildInstructorCard({
            row: row as InstructorRow,
            availabilityRows: availabilityByInstructor.get(String((row as InstructorRow).id || '')) || [],
            bookingRows: bookingsByInstructor.get(String((row as InstructorRow).id || '')) || [],
            today,
            now,
          })
        )
    }

    const { createClient } = await import('@/lib/supabase/server')
    const supabase = (await createClient()) as unknown as DbLike
    const [instructorResult, availabilityResult, bookingResult] = await Promise.all([
      supabase
        .from('instructors')
        .select('*,profile:profiles(full_name,avatar_url)')
        .order('rating', { ascending: false }),
      supabase
        .from('instructor_availability')
        .select('id,instructor_id,date,start_time,end_time,is_booked')
        .eq('date', today)
        .order('start_time', { ascending: true }),
      supabase
        .from('bookings')
        .select('instructor_id,availability_slot_id,scheduled_date,start_time,status')
        .eq('scheduled_date', today)
        .order('start_time', { ascending: true }),
    ])

    if (instructorResult.error || !Array.isArray(instructorResult.data)) return []

    const availabilityByInstructor = new Map<string, AvailabilityRow[]>()
    for (const row of Array.isArray(availabilityResult.data) ? availabilityResult.data : []) {
      const instructorId = String((row as AvailabilityRow).instructor_id || '')
      if (!instructorId) continue
      const current = availabilityByInstructor.get(instructorId) || []
      current.push(row as AvailabilityRow)
      availabilityByInstructor.set(instructorId, current)
    }

    const bookingsByInstructor = new Map<string, BookingRow[]>()
    for (const row of Array.isArray(bookingResult.data) ? bookingResult.data : []) {
      const instructorId = String((row as BookingRow).instructor_id || '')
      if (!instructorId) continue
      const current = bookingsByInstructor.get(instructorId) || []
      current.push(row as BookingRow)
      bookingsByInstructor.set(instructorId, current)
    }

    const instructorRows = instructorResult.data as InstructorRow[]

    return instructorRows
      .filter((row: InstructorRow) => row.is_active === true)
      .filter((row: InstructorRow) => String(row.status || '') === 'approved')
      .map((row: InstructorRow) =>
        buildInstructorCard({
          row,
          availabilityRows: availabilityByInstructor.get(String(row.id || '')) || [],
          bookingRows: bookingsByInstructor.get(String(row.id || '')) || [],
          today,
          now,
        })
      )
  } catch {
    return []
  }
}
