import { subMonths, format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import AnalyticsCharts from './AnalyticsCharts'
import { formatCurrency } from '@/utils/format'

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

function toNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function getBookingDate(row: BookingRow) {
  return String(row.scheduled_date || row.date || row.created_at || '').slice(0, 10)
}

function isValidActiveBooking(row: BookingRow) {
  const status = String(row.status || '')
  return status !== 'cancelled' && status !== 'no_show'
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
  const { data: bookings } = await db
    .from('bookings')
    .select('*')
    .eq('instructor_id', user.id)
    .order('created_at', { ascending: true })

  const bookingRows: BookingRow[] = Array.isArray(bookings) ? bookings : []
  const today = new Date()
  const sixMonthsStart = subMonths(today, 5)

  const monthlyBuckets = Array.from({ length: 6 }, (_, index) => {
    const date = subMonths(today, 5 - index)
    const key = format(date, 'yyyy-MM')
    return {
      key,
      month: format(date, 'MMM', { locale: ptBR }),
      gross: 0,
      net: 0,
      lessons: 0,
    }
  })

  const monthlyMap = new Map(monthlyBuckets.map((item) => [item.key, item]))

  for (const row of bookingRows) {
    if (!isValidActiveBooking(row)) continue
    const dateStr = getBookingDate(row)
    if (!dateStr) continue
    const key = dateStr.slice(0, 7)
    const bucket = monthlyMap.get(key)
    if (!bucket) continue

    const gross = toNumber(row.total_amount ?? row.gross_amount)
    const net = toNumber(row.instructor_net || gross - toNumber(row.platform_fee))
    bucket.gross += gross
    bucket.net += net
    bucket.lessons += 1
  }

  const weeklyLessons = Array.from({ length: 4 }, (_, index) => {
    const end = new Date(today)
    end.setDate(today.getDate() - (3 - index) * 7)
    const start = new Date(end)
    start.setDate(end.getDate() - 6)
    const aulas = bookingRows.filter((row) => {
      if (!isValidActiveBooking(row)) return false
      const dateStr = getBookingDate(row)
      if (!dateStr) return false
      const date = new Date(`${dateStr}T00:00:00`)
      return date >= start && date <= end
    }).length

    return {
      week: `${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`,
      aulas,
    }
  })

  const lastSixMonthsRows = bookingRows.filter((row) => {
    if (!isValidActiveBooking(row)) return false
    const dateStr = getBookingDate(row)
    if (!dateStr) return false
    const date = new Date(`${dateStr}T00:00:00`)
    return date >= new Date(format(sixMonthsStart, 'yyyy-MM-01'))
  })

  const totalGross = lastSixMonthsRows.reduce((acc, row) => acc + toNumber(row.total_amount ?? row.gross_amount), 0)
  const totalNet = lastSixMonthsRows.reduce((acc, row) => {
    const gross = toNumber(row.total_amount ?? row.gross_amount)
    return acc + toNumber(row.instructor_net || gross - toNumber(row.platform_fee))
  }, 0)
  const totalLessons = lastSixMonthsRows.length
  const upcomingBookings = bookingRows.filter((row) => {
    const status = String(row.status || '')
    if (status !== 'confirmed' && status !== 'pending') return false
    const dateStr = getBookingDate(row)
    return Boolean(dateStr) && dateStr >= format(today, 'yyyy-MM-dd')
  }).length

  return (
    <div className="w-full space-y-6">
      <h1 className="text-2xl font-extrabold text-gray-900">Relatorios</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Receita bruta (6m)', value: formatCurrency(totalGross) },
          { label: 'Receita liquida (6m)', value: formatCurrency(totalNet), note: 'Valor do instrutor' },
          { label: 'Total de aulas (6m)', value: String(totalLessons) },
          { label: 'Proximas aulas', value: String(upcomingBookings) },
        ].map(({ label, value, note }) => (
          <div key={label} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xl font-extrabold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{label}</p>
            {note && <p className="text-xs text-gray-400">{note}</p>}
          </div>
        ))}
      </div>

      <AnalyticsCharts
        monthlyData={monthlyBuckets.map((item) => ({
          month: item.month.charAt(0).toUpperCase() + item.month.slice(1),
          gross: item.gross,
          net: item.net,
        }))}
        weeklyLessons={weeklyLessons}
      />
    </div>
  )
}
