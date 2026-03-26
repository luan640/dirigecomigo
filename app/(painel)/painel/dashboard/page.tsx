import { DollarSign, TrendingUp, Users } from 'lucide-react'
import Link from 'next/link'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import DashboardUpcomingLessons from './DashboardUpcomingLessons'
import { formatCurrency } from '@/utils/format'

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

type ManualLessonRow = {
  id?: string
  student_name?: string
  lesson_date?: string
  start_time?: string
  end_time?: string
  amount?: number | string
  status?: string
}

type DashboardBooking = {
  id: string
  date: string
  start_time: string
  end_time: string
  status: string
  instructor_net: number
  gross_amount: number
  student_name: string
  student_phone: string
}

function toNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function getBookingDate(row: BookingRow) {
  return String(row.scheduled_date || '').slice(0, 10)
}

function normalizeBooking(row: BookingRow, profile?: ProfileRow): DashboardBooking {
  const gross = toNumber(row.total_amount)
  const net = toNumber(row.instructor_net || gross - toNumber(row.platform_fee))

  return {
    id: String(row.id || ''),
    date: getBookingDate(row),
    start_time: String(row.start_time || ''),
    end_time: String(row.end_time || ''),
    status: String(row.status || 'pending'),
    instructor_net: net,
    gross_amount: gross,
    student_name: String(profile?.full_name || 'Aluno'),
    student_phone: String(profile?.phone || '').trim(),
  }
}

export default async function PainelDashboardPage() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: bookings }, { data: manualLessons }] = await Promise.all([
    db.from('bookings')
      .select('id,student_id,scheduled_date,start_time,end_time,status,instructor_net,platform_fee,total_amount')
      .eq('instructor_id', user.id)
      .order('created_at', { ascending: true }),
    db.from('manual_lessons')
      .select('id,student_name,lesson_date,start_time,end_time,amount,status')
      .eq('instructor_id', user.id)
      .order('lesson_date', { ascending: false })
      .order('start_time', { ascending: false })
      .limit(5),
  ])

  const studentIds = Array.from(
    new Set(
      (Array.isArray(bookings) ? bookings : [])
        .map((row: BookingRow) => String(row.student_id || '').trim())
        .filter(Boolean),
    ),
  )

  let profileMap = new Map<string, ProfileRow>()
  if (studentIds.length > 0) {
    const { data: studentProfiles } = await supabase
      .from('profiles')
      .select('id,full_name,phone')
      .in('id', studentIds)

    profileMap = new Map(
      (Array.isArray(studentProfiles) ? studentProfiles : []).map((studentProfile: ProfileRow) => [String(studentProfile.id || ''), studentProfile]),
    )
  }

  const bookingRows: DashboardBooking[] = Array.isArray(bookings)
    ? bookings
        .map((row: BookingRow) => normalizeBooking(row, profileMap.get(String(row.student_id || ''))))
        .filter((booking: DashboardBooking) => booking.date)
    : []

  const upcoming = bookingRows
    .filter(booking => booking.status === 'confirmed' || booking.status === 'pending')
    .sort((a, b) => new Date(`${a.date}T${a.start_time}`).getTime() - new Date(`${b.date}T${b.start_time}`).getTime())

  const completed = bookingRows.filter(booking => booking.status === 'completed')
  const todayMonth = new Date().toISOString().slice(0, 7)
  const monthCompleted = completed.filter(booking => booking.date.startsWith(todayMonth))
  const manualLessonRows: ManualLessonRow[] = Array.isArray(manualLessons) ? manualLessons : []
  const completedManualLessons = manualLessonRows.filter(lesson => String(lesson.status || 'completed') === 'completed')
  const monthManualLessons = completedManualLessons.filter(lesson => String(lesson.lesson_date || '').startsWith(todayMonth))

  const totalNetThisMonth = monthCompleted.reduce((acc, booking) => acc + booking.instructor_net, 0)
  const manualRevenueThisMonth = monthManualLessons.reduce((acc, lesson) => acc + toNumber(lesson.amount), 0)
  const completedLessons = completed.length
  const stats = [
    { label: 'Receita da plataforma no mes', value: formatCurrency(totalNetThisMonth), icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Receita externa no mes', value: formatCurrency(manualRevenueThisMonth), icon: DollarSign, color: 'text-amber-700', bg: 'bg-amber-50' },
    { label: 'Aulas concluidas na plataforma', value: String(completedLessons), icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Proximas aulas da plataforma', value: String(upcoming.length), icon: Users, color: 'text-purple-700', bg: 'bg-purple-50' },
  ]

  return (
    <div className="w-full space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${bg}`}>
              <Icon className={`h-5 w-5 ${color}`} />
            </div>
            <p className="text-xl font-extrabold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      <DashboardUpcomingLessons bookings={upcoming} />

      <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <div>
            <h2 className="font-bold text-slate-900">Aulas externas recentes</h2>
            <p className="mt-1 text-sm text-slate-500">Controle separado do que foi realizado fora da plataforma.</p>
          </div>
          <Link href="/painel/aulas-externas" className="text-sm font-semibold text-[#0f2f63] hover:underline">
            Gerenciar registros
          </Link>
        </div>

        {manualLessonRows.length === 0 ? (
          <div className="px-5 py-8 text-center text-sm text-slate-400">
            Nenhuma aula externa registrada.
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {manualLessonRows.map(lesson => (
              <div key={String(lesson.id || '')} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-900">{String(lesson.student_name || 'Aluno')}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {String(lesson.lesson_date || '')
                      ? format(new Date(`${String(lesson.lesson_date || '')}T00:00:00`), "dd 'de' MMM", { locale: ptBR })
                      : '-'}
                    {' '}· {String(lesson.start_time || '').slice(0, 5)} - {String(lesson.end_time || '').slice(0, 5)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                    String(lesson.status || 'completed') === 'completed'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-100 text-slate-500'
                  }`}
                  >
                    {String(lesson.status || 'completed') === 'completed' ? 'Externa concluida' : 'Externa cancelada'}
                  </span>
                  <span className="text-sm font-bold text-amber-700">{formatCurrency(toNumber(lesson.amount))}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
