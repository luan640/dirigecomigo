import Link from 'next/link'
import { ArrowRight, DollarSign, Star, TrendingUp, Users } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/constants/pricing'
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

type InstructorRow = {
  rating?: number | string
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
  const [{ data: bookings }, { data: instructor }, { data: profile }] = await Promise.all([
    db.from('bookings').select('id,student_id,scheduled_date,start_time,end_time,status,instructor_net,platform_fee,total_amount').eq('instructor_id', user.id).order('created_at', { ascending: true }),
    db.from('instructors').select('rating').eq('id', user.id).maybeSingle(),
    db.from('profiles').select('full_name').eq('id', user.id).maybeSingle(),
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
  const upcoming = bookingRows.filter(booking => booking.status === 'confirmed' || booking.status === 'pending')
    .sort((a, b) => new Date(`${a.date}T${a.start_time}`).getTime() - new Date(`${b.date}T${b.start_time}`).getTime())
  const completed = bookingRows.filter(booking => booking.status === 'completed')
  const todayMonth = format(new Date(), 'yyyy-MM')
  const monthCompleted = completed.filter(booking => booking.date.startsWith(todayMonth))

  const totalNetThisMonth = monthCompleted.reduce((acc, booking) => acc + booking.instructor_net, 0)
  const completedLessons = completed.length
  const avgRating = toNumber((instructor as InstructorRow | null)?.rating)
  const firstName = String((profile as { full_name?: string } | null)?.full_name || user.user_metadata?.full_name || 'Instrutor')
    .trim()
    .split(' ')[0]

  const stats = [
    { label: 'Receita do mes', value: formatCurrency(totalNetThisMonth), icon: DollarSign, color: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'Aulas concluidas', value: String(completedLessons), icon: TrendingUp, color: 'text-blue-700', bg: 'bg-blue-50' },
    { label: 'Proximas aulas', value: String(upcoming.length), icon: Users, color: 'text-purple-700', bg: 'bg-purple-50' },
    { label: 'Nota media', value: avgRating > 0 ? `${avgRating.toFixed(1)}*` : '-', icon: Star, color: 'text-amber-700', bg: 'bg-amber-50' },
  ]

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Ola, {firstName}!</h1>
        <p className="mt-1 text-sm text-gray-500">Aqui esta o resumo da sua atividade.</p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
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

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
          <h2 className="font-bold text-gray-900">Proximas aulas</h2>
          <Link href="/painel/agenda" className="flex items-center gap-1 text-sm text-blue-700 hover:underline">
            Ver agenda <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
        <div className="divide-y divide-gray-50">
          {upcoming.length === 0 ? (
            <div className="px-5 py-8 text-center">
              <p className="text-sm text-gray-400">Nenhuma aula agendada</p>
              <Link href="/painel/horarios" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">
                Gerenciar horarios
              </Link>
            </div>
          ) : (
            upcoming.slice(0, 6).map(booking => (
              <div key={booking.id} className="flex items-center gap-4 px-5 py-4">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-sm font-bold text-emerald-700">
                  {booking.student_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900">{booking.student_name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {format(new Date(`${booking.date}T00:00:00`), "dd 'de' MMM", { locale: ptBR })}
                    {' '}· {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">{booking.student_phone || 'Telefone nao informado'}</p>
                </div>
                <div className="flex flex-shrink-0 items-center gap-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                    {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                  </span>
                  <p className="text-sm font-bold text-emerald-700">{formatCurrency(booking.instructor_net)}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
