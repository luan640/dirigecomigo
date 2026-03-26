'use client'

import { useMemo, useState } from 'react'
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Clock3 } from 'lucide-react'
import BookingActionButtons from '@/components/ui/BookingActionButtons'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/constants/pricing'
import { formatCurrency } from '@/utils/format'

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

const START_HOUR = 6
const END_HOUR = 22
const HOUR_ROW_HEIGHT = 72

function toMinutes(time: string) {
  const [hours, minutes] = time.slice(0, 5).split(':').map(Number)
  return (hours * 60) + minutes
}

function buildVisibleDays(offset: number) {
  const base = startOfDay(new Date())
  return Array.from({ length: 5 }, (_, index) => addDays(base, offset * 5 + index))
}

export default function AgendaClient({ bookings }: { bookings: AgendaBooking[] }) {
  const [weekOffset, setWeekOffset] = useState(0)
  const visibleDays = useMemo(() => buildVisibleDays(weekOffset), [weekOffset])
  const visibleDayKeys = useMemo(() => visibleDays.map(day => format(day, 'yyyy-MM-dd')), [visibleDays])

  const bookingsByDay = useMemo(() => {
    return bookings.reduce<Record<string, AgendaBooking[]>>((acc, booking) => {
      if (!visibleDayKeys.includes(booking.date)) return acc
      if (!acc[booking.date]) acc[booking.date] = []
      acc[booking.date].push(booking)
      acc[booking.date].sort((a, b) => toMinutes(a.start_time) - toMinutes(b.start_time))
      return acc
    }, {})
  }, [bookings, visibleDayKeys])

  const totalGridHeight = (END_HOUR - START_HOUR) * HOUR_ROW_HEIGHT
  const desktopHours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index)

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Proximos dias</p>
            <h2 className="mt-1 text-xl font-extrabold text-slate-900">
              {format(visibleDays[0], "dd 'de' MMM", { locale: ptBR })} a {format(visibleDays[visibleDays.length - 1], "dd 'de' MMM", { locale: ptBR })}
            </h2>
            <p className="mt-1 text-sm text-slate-500">Visualizacao em grade para acompanhar aulas, horarios vazios e reagendamentos.</p>
          </div>
          <div className="flex items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => setWeekOffset(current => Math.max(0, current - 1))}
              disabled={weekOffset === 0}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => setWeekOffset(current => current + 1)}
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="grid grid-cols-1 gap-3 p-4 md:hidden">
          {visibleDays.map(day => {
            const key = format(day, 'yyyy-MM-dd')
            const dayBookings = bookingsByDay[key] || []

            return (
              <div key={key} className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                      {format(day, 'EEE', { locale: ptBR })}
                    </p>
                    <p className="text-base font-bold capitalize text-slate-900">
                      {format(day, "dd 'de' MMMM", { locale: ptBR })}
                    </p>
                  </div>
                  <span className="rounded-full bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 shadow-sm">
                    {dayBookings.length} aula{dayBookings.length === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="mt-4 space-y-3">
                  {dayBookings.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-white px-4 py-5 text-sm text-slate-400">
                      Nenhuma aula neste dia.
                    </div>
                  ) : (
                    dayBookings.map(booking => (
                      <div key={booking.id} className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-bold text-slate-900">
                              {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                            </p>
                            <p className="mt-1 text-sm text-slate-600">{booking.student_name}</p>
                            <p className="mt-1 text-xs text-slate-400">{booking.student_phone || 'Telefone nao informado'}</p>
                          </div>
                          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                            {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                          </span>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-sm font-bold text-emerald-700">{formatCurrency(booking.instructor_net)}</span>
                          <BookingActionButtons booking={booking} />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )
          })}
        </div>

        <div className="hidden md:block">
          <div className="grid grid-cols-[84px_repeat(5,minmax(0,1fr))] border-b border-slate-200 bg-slate-50">
            <div className="border-r border-slate-200 px-4 py-4 text-xs font-semibold uppercase tracking-wide text-slate-400">
              Horario
            </div>
            {visibleDays.map(day => {
              const isToday = isSameDay(day, new Date())
              return (
                <div key={day.toISOString()} className="border-r border-slate-200 px-4 py-4 last:border-r-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    {format(day, 'EEE', { locale: ptBR })}
                  </p>
                  <p className={`mt-1 text-base font-bold capitalize ${isToday ? 'text-[#0f2f63]' : 'text-slate-900'}`}>
                    {format(day, "dd 'de' MMM", { locale: ptBR })}
                  </p>
                </div>
              )
            })}
          </div>

          <div className="relative overflow-hidden">
            <div className="grid grid-cols-[84px_repeat(5,minmax(0,1fr))]">
              <div className="relative border-r border-slate-200 bg-white" style={{ height: totalGridHeight }}>
                {desktopHours.slice(0, -1).map(hour => (
                  <div
                    key={hour}
                    className="absolute left-0 right-0 border-b border-slate-100 px-4 text-xs font-medium text-slate-400"
                    style={{ top: (hour - START_HOUR) * HOUR_ROW_HEIGHT, height: HOUR_ROW_HEIGHT }}
                  >
                    <div className="-translate-y-2 bg-white pr-2">
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  </div>
                ))}
              </div>

              {visibleDays.map(day => {
                const key = format(day, 'yyyy-MM-dd')
                const dayBookings = bookingsByDay[key] || []

                return (
                  <div key={key} className="relative border-r border-slate-200 bg-white last:border-r-0" style={{ height: totalGridHeight }}>
                    {desktopHours.slice(0, -1).map(hour => (
                      <div
                        key={hour}
                        className="absolute left-0 right-0 border-b border-slate-100"
                        style={{ top: (hour - START_HOUR) * HOUR_ROW_HEIGHT, height: HOUR_ROW_HEIGHT }}
                      />
                    ))}

                    {dayBookings.length === 0 ? (
                      <div className="absolute inset-x-3 top-3 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-400">
                        Dia livre
                      </div>
                    ) : null}

                    {dayBookings.map(booking => {
                      const startMinutes = toMinutes(booking.start_time)
                      const endMinutes = toMinutes(booking.end_time)
                      const top = ((startMinutes - START_HOUR * 60) / 60) * HOUR_ROW_HEIGHT
                      const height = Math.max(((endMinutes - startMinutes) / 60) * HOUR_ROW_HEIGHT, 64)

                      return (
                        <div
                          key={booking.id}
                          className="absolute left-2 right-2 overflow-hidden rounded-2xl border border-[#c9dafc] bg-[linear-gradient(180deg,#eef4ff_0%,#ffffff_100%)] p-3 shadow-[0_12px_24px_rgba(15,47,99,0.08)]"
                          style={{ top, height }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <p className="truncate text-sm font-bold text-slate-900">{booking.student_name}</p>
                              <div className="mt-1 flex items-center gap-1 text-xs text-slate-500">
                                <Clock3 className="h-3 w-3" />
                                {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                              </div>
                            </div>
                            <span className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                              {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                            </span>
                          </div>

                          <p className="mt-2 truncate text-xs text-slate-400">
                            {booking.student_phone || 'Telefone nao informado'}
                          </p>

                          <div className="mt-3 flex items-center justify-between gap-2">
                            <span className="text-sm font-bold text-emerald-700">{formatCurrency(booking.instructor_net)}</span>
                            <BookingActionButtons booking={booking} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
