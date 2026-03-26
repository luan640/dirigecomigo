'use client'

import Link from 'next/link'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ArrowRight, Loader2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import BookingActionButtons from '@/components/ui/BookingActionButtons'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/constants/pricing'
import { formatCurrency } from '@/utils/format'

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

const PAGE_SIZE = 10

export default function DashboardUpcomingLessons({ bookings }: { bookings: DashboardBooking[] }) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE)
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const sentinelRef = useRef<HTMLDivElement | null>(null)

  const visibleBookings = useMemo(() => bookings.slice(0, visibleCount), [bookings, visibleCount])
  const hasMore = visibleCount < bookings.length

  useEffect(() => {
    if (!hasMore) return
    const node = sentinelRef.current
    if (!node) return

    const observer = new IntersectionObserver(
      entries => {
        const entry = entries[0]
        if (!entry?.isIntersecting) return
        setIsLoadingMore(true)
        window.setTimeout(() => {
          setVisibleCount(current => Math.min(current + PAGE_SIZE, bookings.length))
          setIsLoadingMore(false)
        }, 250)
      },
      { rootMargin: '240px 0px' },
    )

    observer.observe(node)
    return () => observer.disconnect()
  }, [bookings.length, hasMore, visibleCount])

  return (
    <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-gray-50 px-5 py-4">
        <h2 className="font-bold text-gray-900">Proximas aulas da plataforma</h2>
        <Link href="/painel/agenda" className="flex items-center gap-1 text-sm text-blue-700 hover:underline">
          Ver agenda <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>

      <div className="divide-y divide-gray-50">
        {bookings.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <p className="text-sm text-gray-400">Nenhuma aula agendada</p>
            <Link href="/painel/horarios" className="mt-3 inline-block text-sm font-semibold text-blue-700 hover:underline">
              Gerenciar horários
            </Link>
          </div>
        ) : (
          <>
            {visibleBookings.map((booking) => (
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
                  <BookingActionButtons booking={booking} />
                </div>
              </div>
            ))}

            {hasMore ? (
              <div ref={sentinelRef} className="flex items-center justify-center px-5 py-5 text-sm text-gray-400">
                {isLoadingMore ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Carregando mais 10 aulas...
                  </span>
                ) : (
                  'Role para carregar mais'
                )}
              </div>
            ) : bookings.length > PAGE_SIZE ? (
              <div className="px-5 py-4 text-center text-xs text-gray-400">
                Todas as aulas carregadas.
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  )
}
