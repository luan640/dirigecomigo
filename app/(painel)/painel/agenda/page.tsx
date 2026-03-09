import AgendaClient from './AgendaClient'

type BookingRow = {
  id?: string
  student_id?: string
  scheduled_date?: string
  start_time?: string
  end_time?: string
  status?: string
  instructor_net?: number | string
  platform_fee?: number | string
  total_amount?: number | string
}

type ProfileRow = {
  id?: string
  full_name?: string
  phone?: string
}

type AgendaBooking = {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  instructor_net: number
  student_name: string
  student_phone: string
}

function toNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeBooking(row: BookingRow, profile?: ProfileRow): AgendaBooking {
  const gross = toNumber(row.total_amount)
  const net = toNumber(row.instructor_net || gross - toNumber(row.platform_fee))

  return {
    id: String(row.id || ''),
    date: String(row.scheduled_date || ''),
    start_time: String(row.start_time || ''),
    end_time: String(row.end_time || ''),
    status: String(row.status || 'pending'),
    instructor_net: net,
    student_name: String(profile?.full_name || 'Aluno'),
    student_phone: String(profile?.phone || '').trim(),
  }
}

async function loadBookings(): Promise<AgendaBooking[]> {
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (DEMO_MODE) return []

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return []

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('bookings')
      .select('id,student_id,scheduled_date,start_time,end_time,status,instructor_net,platform_fee,total_amount')
      .eq('instructor_id', user.id)
      .order('scheduled_date', { ascending: true })
      .order('start_time', { ascending: true })

    if (error || !Array.isArray(data)) return []

    const studentIds = Array.from(
      new Set(
        data
          .map((row: BookingRow) => String(row.student_id || '').trim())
          .filter(Boolean),
      ),
    )

    let profileMap = new Map<string, ProfileRow>()
    if (studentIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id,full_name,phone')
        .in('id', studentIds)

      profileMap = new Map(
        (Array.isArray(profiles) ? profiles : []).map((profile: ProfileRow) => [String(profile.id || ''), profile]),
      )
    }

    return data
      .map((row: BookingRow) => normalizeBooking(row, profileMap.get(String(row.student_id || ''))))
      .filter(booking => booking.date)
      .sort((a, b) => {
        const dateDiff = new Date(`${a.date}T${a.start_time}`).getTime() - new Date(`${b.date}T${b.start_time}`).getTime()
        return dateDiff
      })
  } catch {
    return []
  }
}

export default async function PainelAgendaPage() {
  const bookings = await loadBookings()

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-extrabold text-gray-900">Agenda</h1>
      <AgendaClient bookings={bookings} />
    </div>
  )
}
