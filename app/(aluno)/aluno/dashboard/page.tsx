import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { MOCK_STUDENT_BOOKINGS } from '@/lib/mock-data'
import DashboardUpcomingLessons from './DashboardUpcomingLessons'

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
  if (DEMO_MODE) return MOCK_STUDENT_BOOKINGS

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
          id,
          neighborhood,
          cancellation_notice_hours,
          profile:profiles(full_name)
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

async function loadStudentName(): Promise<string> {
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (DEMO_MODE) return 'Aluno'

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return 'Aluno'

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle()

    const profileName = String(data?.full_name || '').trim()
    if (profileName) return profileName

    const emailName = String(user.email || '').split('@')[0]
    return emailName || 'Aluno'
  } catch {
    return 'Aluno'
  }
}

export default async function StudentDashboardPage() {
  const bookings = await loadBookings()
  const studentName = await loadStudentName()
  const upcoming = bookings.filter(b => b.status === 'confirmed' || b.status === 'pending')

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Bem-vindo, {studentName}!</h1>
        <p className="mt-1 text-sm text-gray-500">Acompanhe suas aulas e horarios agendados.</p>
      </div>

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
          <h2 className="font-bold text-gray-900">Proximas aulas</h2>
          <Link href="/aluno/aulas" className="flex items-center gap-1 text-sm text-blue-700 hover:underline">
            Ver todas <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {upcoming.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">Nenhuma aula agendada</p>
              <Link href="/instrutores" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">
                Buscar instrutor
              </Link>
            </div>
          ) : (
            <DashboardUpcomingLessons bookings={upcoming} />
          )}
        </div>
      </div>
    </div>
  )
}
