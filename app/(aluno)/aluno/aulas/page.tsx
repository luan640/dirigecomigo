import Link from 'next/link'
import { MOCK_STUDENT_BOOKINGS } from '@/lib/mock-data'
import StudentLessonsList from './StudentLessonsList'

type UIBooking = {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  gross_amount: number
  availability_id?: string | null
  cancellation_reason?: string | null
  instructor: {
    id: string
    name: string
    neighborhood: string
    cancellation_notice_hours?: number
  }
}

async function loadBookings(): Promise<UIBooking[]> {
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (DEMO_MODE) {
    return [...MOCK_STUDENT_BOOKINGS].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('bookings')
      .select(`
        *,
        instructor:instructors(
          *,
          profile:profiles(*)
        )
      `)
      .eq('student_id', user.id)
      .order('created_at', { ascending: false })

    if (error || !Array.isArray(data)) return []

    return data.map((row: Record<string, unknown>) => {
      const instructor = (row.instructor as Record<string, unknown>) || {}
      const profile = (instructor.profile as Record<string, unknown>) || {}
      return {
        id: String(row.id || ''),
        date: String(row.scheduled_date || row.date || ''),
        start_time: String(row.start_time || ''),
        end_time: String(row.end_time || ''),
        status: String(row.status || 'pending'),
        gross_amount: Number(row.total_amount || row.gross_amount || 0),
        availability_id: String(row.availability_slot_id || row.availability_id || '') || null,
        cancellation_reason: row.cancellation_reason ? String(row.cancellation_reason) : null,
        instructor: {
          id: String(instructor.id || ''),
          name: String(profile.full_name || 'Instrutor'),
          neighborhood: String(instructor.neighborhood || ''),
          cancellation_notice_hours: Number(instructor.cancellation_notice_hours || 24),
        },
      }
    })
  } catch {
    return []
  }
}

export default async function StudentLessonsPage() {
  const bookings = await loadBookings()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold text-gray-900">Minhas aulas</h1>

      {bookings.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-gray-400">Nenhuma aula encontrada.</p>
          <Link href="/instrutores" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">
            Buscar instrutor
          </Link>
        </div>
      ) : (
        <StudentLessonsList bookings={bookings} />
      )}
    </div>
  )
}
