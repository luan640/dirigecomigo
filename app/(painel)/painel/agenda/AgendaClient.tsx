'use client'

import { useMemo } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

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

export default function AgendaClient({ bookings }: { bookings: AgendaBooking[] }) {
  const grouped = useMemo(() => {
    return bookings.reduce<Record<string, AgendaBooking[]>>((acc, booking) => {
      if (!acc[booking.date]) acc[booking.date] = []
      acc[booking.date].push(booking)
      return acc
    }, {})
  }, [bookings])

  return (
    <>
      {Object.entries(grouped).length === 0 ? (
        <div className="rounded-2xl border border-gray-100 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-gray-400">Nenhuma aula na agenda.</p>
        </div>
      ) : (
        Object.entries(grouped).map(([date, slotsForDay]) => (
          <div key={date} className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
            <div className="border-b border-gray-100 bg-gray-50 px-5 py-2.5">
              <p className="text-sm font-bold capitalize text-gray-700">
                {format(new Date(`${date}T00:00:00`), "EEEE, dd 'de' MMMM 'de' yyyy", { locale: ptBR })}
              </p>
            </div>
            <div className="divide-y divide-gray-50">
              {slotsForDay.map((booking) => (
                <div key={booking.id} className="flex flex-col gap-4 px-5 py-3.5 md:flex-row md:items-center">
                  <div className="w-12 flex-shrink-0 text-center">
                    <p className="text-sm font-bold text-gray-900">{booking.start_time.slice(0, 5)}</p>
                    <p className="text-xs text-gray-400">{booking.end_time.slice(0, 5)}</p>
                  </div>
                  <div className="hidden h-10 w-px flex-shrink-0 bg-gray-100 md:block" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">{booking.student_name}</p>
                    <p className="text-xs text-gray-400">60 min</p>
                    <p className="text-xs text-gray-400">{booking.student_phone || 'Telefone nao informado'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-600'}`}>
                      {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                    </span>
                    <p className="text-sm font-bold text-emerald-700">{formatCurrency(booking.instructor_net)}</p>
                    <BookingActionButtons booking={booking} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </>
  )
}
