'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Clock, MapPin, MessageCircle, X, XCircle } from 'lucide-react'
import { toast } from 'sonner'
import { BOOKING_STATUS_COLORS, BOOKING_STATUS_LABELS } from '@/constants/pricing'
import { formatCurrency } from '@/utils/format'

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

const WHATSAPP_PHONE = '5585999012483'

function canCancelBooking(booking: UIBooking) {
  if (!booking.date || !booking.start_time) return false
  if (!['pending', 'confirmed'].includes(booking.status)) return false
  return new Date(`${booking.date}T${booking.start_time}`).getTime() > Date.now()
}

export default function StudentLessonsList({ bookings }: { bookings: UIBooking[] }) {
  const router = useRouter()
  const [selectedBooking, setSelectedBooking] = useState<UIBooking | null>(null)
  const [reason, setReason] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const cancellationNotice = useMemo(() => {
    if (!selectedBooking) return 24
    return selectedBooking.instructor.cancellation_notice_hours ?? 24
  }, [selectedBooking])

  const closeModal = () => {
    setSelectedBooking(null)
    setReason('')
    setSubmitting(false)
  }

  const handleCancelBooking = async () => {
    if (!selectedBooking) return
    const trimmedReason = reason.trim()
    if (!trimmedReason) {
      toast.error('Informe o motivo do cancelamento.')
      return
    }

    setSubmitting(true)

    try {
      const response = await fetch('/api/bookings/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bookingId: selectedBooking.id, reason: trimmedReason }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel cancelar a aula.')
      }

      const whatsappText = `Olá quero cancelar a aula (${selectedBooking.id}), por motivo (${trimmedReason}).`
      const whatsappUrl =
        payload?.data?.whatsappUrl ||
        `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsappText)}`

      window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      closeModal()
      router.refresh()
      toast.success('Aula cancelada com sucesso.')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao cancelar a aula.')
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="space-y-3">
        {bookings.map(booking => (
          <div key={booking.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-blue-100 font-bold text-blue-700">
                {booking.instructor.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-bold text-gray-900">{booking.instructor.name}</p>
                  <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${BOOKING_STATUS_COLORS[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                    {BOOKING_STATUS_LABELS[booking.status] || booking.status}
                  </span>
                </div>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5" />
                    {format(new Date(`${booking.date}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
                    {' · '}
                    {booking.start_time.slice(0, 5)} - {booking.end_time.slice(0, 5)}
                  </span>
                  <span className="flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {booking.instructor.neighborhood}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-gray-400">
                  Cancelamento: ate {booking.instructor.cancellation_notice_hours ?? 24}h antes da aula.
                </p>
                {booking.cancellation_reason && (
                  <p className="mt-2 text-xs text-rose-600">Motivo informado: {booking.cancellation_reason}</p>
                )}
              </div>
              <div className="flex flex-shrink-0 flex-col items-end gap-2 text-right">
                <p className="text-sm font-extrabold text-gray-900">{formatCurrency(booking.gross_amount)}</p>
                <Link href={`/instrutor/${booking.instructor.id}`} className="text-xs text-blue-700 hover:underline">
                  Ver instrutor
                </Link>
                {canCancelBooking(booking) && (
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(booking)}
                    className="inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-rose-50 px-3 py-1.5 text-xs font-semibold text-rose-700 transition hover:bg-rose-100"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    Cancelar aula
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Cancelar aula</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Ao confirmar, a aula sera cancelada para você e para o instrutor, o horário ficara disponível novamente e o suporte entrara em contato para realizar o reembolso.
                </p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-5 rounded-2xl border border-amber-100 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              Politica informativa: este instrutor pede cancelamento com pelo menos {cancellationNotice}h de antecedencia.
              O WhatsApp sera aberto para registrar a solicitacao, e o suporte entrara em contato para seguir com o reembolso.
            </div>

            <div className="mt-5 space-y-2">
              <p className="text-sm font-semibold text-gray-900">Motivo do cancelamento</p>
              <textarea
                value={reason}
                onChange={event => setReason(event.target.value)}
                rows={4}
                className="w-full rounded-2xl border border-gray-200 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                placeholder="Ex.: tive um imprevisto e preciso remarcar."
              />
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-600">
              Ticket da aula: <span className="font-mono text-gray-800">{selectedBooking.id}</span>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeModal}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                type="button"
                onClick={handleCancelBooking}
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-70"
              >
                <MessageCircle className="h-4 w-4" />
                {submitting ? 'Cancelando...' : 'Confirmar cancelamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
