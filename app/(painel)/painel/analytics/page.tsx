import AnalyticsClient from './AnalyticsClient'

type BookingRow = {
  status?: string
  created_at?: string
  scheduled_date?: string
  date?: string
  total_amount?: number | string
  gross_amount?: number | string
  platform_fee?: number | string
  instructor_net?: number | string
}

type ManualLessonRow = {
  status?: string
  lesson_date?: string
  amount?: number | string
}

function toNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function getBookingDate(row: BookingRow) {
  return String(row.scheduled_date || row.date || row.created_at || '').slice(0, 10)
}

export default async function AnalyticsPage() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) {
    return null
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: bookings }, { data: manualLessons }] = await Promise.all([
    db
      .from('bookings')
      .select('status,created_at,scheduled_date,total_amount,platform_fee,instructor_net')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: true }),
    db
      .from('manual_lessons')
      .select('status,lesson_date,amount')
      .eq('instructor_id', user.id)
      .order('lesson_date', { ascending: true }),
  ])

  return (
    <AnalyticsClient
      bookings={(Array.isArray(bookings) ? bookings : []).map((row: BookingRow) => {
        const gross = toNumber(row.total_amount ?? row.gross_amount)
        return {
          date: getBookingDate(row),
          status: String(row.status || ''),
          gross,
          net: toNumber(row.instructor_net || gross - toNumber(row.platform_fee)),
        }
      })}
      manualLessons={(Array.isArray(manualLessons) ? manualLessons : []).map((row: ManualLessonRow) => ({
        date: String(row.lesson_date || ''),
        status: String(row.status || ''),
        amount: toNumber(row.amount),
      }))}
    />
  )
}
