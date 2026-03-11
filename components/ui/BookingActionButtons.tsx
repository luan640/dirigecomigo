'use client'

import { useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { CalendarClock, MessageCircle, RefreshCw, X } from 'lucide-react'
import { toast } from 'sonner'

import CompleteLessonButton from '@/components/ui/CompleteLessonButton'

type SlotOption = {
  id: string
  date: string
  start_time: string
  end_time: string
}

type BookingActionButtonsProps = {
  booking: {
    id: string
    date: string
    start_time: string
    end_time: string
    status: string
    student_name: string
    student_phone: string
  }
}

function canManageBooking(booking: BookingActionButtonsProps['booking']) {
  if (!['pending', 'confirmed'].includes(booking.status)) return false
  return new Date(`${booking.date}T${booking.start_time}`).getTime() > Date.now()
}

function canCompleteBooking(booking: BookingActionButtonsProps['booking']) {
  if (!['pending', 'confirmed'].includes(booking.status)) return false
  return new Date(`${booking.date}T${booking.end_time}`).getTime() <= Date.now()
}

function normalizePhone(phone: string) {
  return phone.replace(/\D/g, '')
}

export default function BookingActionButtons({ booking }: BookingActionButtonsProps) {
  const [selectedBooking, setSelectedBooking] = useState<BookingActionButtonsProps['booking'] | null>(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [slots, setSlots] = useState<SlotOption[]>([])
  const [selectedSlotId, setSelectedSlotId] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const slotsByDate = useMemo(() => {
    return slots.reduce<Record<string, SlotOption[]>>((acc, slot) => {
      if (!acc[slot.date]) acc[slot.date] = []
      acc[slot.date].push(slot)
      return acc
    }, {})
  }, [slots])

  const phone = normalizePhone(booking.student_phone)
  const whatsappUrl = phone
    ? `https://wa.me/${phone}?text=${encodeURIComponent(`Ola ${booking.student_name}, vamos conversar sobre reagendar a aula ${booking.id}?`)}`
    : ''

  const openRescheduleModal = async () => {
    setSelectedBooking(booking)
    setSelectedSlotId('')
    setSlots([])
    setLoadingSlots(true)

    try {
      const response = await fetch(`/api/bookings?mode=reschedule&bookingId=${encodeURIComponent(booking.id)}`)
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel carregar os slots livres.')
      }

      setSlots(Array.isArray(payload?.data?.slots) ? (payload.data.slots as SlotOption[]) : [])
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao carregar slots livres.')
    } finally {
      setLoadingSlots(false)
    }
  }

  const closeModal = () => {
    setSelectedBooking(null)
    setSlots([])
    setSelectedSlotId('')
    setLoadingSlots(false)
    setSubmitting(false)
  }

  const handleReschedule = async () => {
    if (!selectedBooking) return
    if (!selectedSlotId) {
      toast.error('Escolha um novo horário.')
      return
    }

    const selectedSlot = slots.find((slot) => slot.id === selectedSlotId)
    if (!selectedSlot) {
      toast.error('O horário selecionado não foi encontrado.')
      return
    }

    setSubmitting(true)
    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'reschedule',
          bookingId: selectedBooking.id,
          slotId: selectedSlotId,
          date: selectedSlot.date,
          start_time: selectedSlot.start_time,
          end_time: selectedSlot.end_time,
        }),
      })
      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel reagendar a aula.')
      }

      toast.success('Aula reagendada com sucesso.')
      window.location.reload()
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erro ao reagendar a aula.')
      setSubmitting(false)
    }
  }

  return (
    <>
      {phone && (
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 transition hover:bg-emerald-100"
          title="Conversar no WhatsApp"
        >
          <MessageCircle className="h-4 w-4" />
          WhatsApp
        </a>
      )}
      {canManageBooking(booking) && (
        <button
          type="button"
          onClick={() => void openRescheduleModal()}
          className="inline-flex items-center gap-1 rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <RefreshCw className="h-4 w-4" />
          Reagendar
        </button>
      )}
      {canCompleteBooking(booking) && (
        <CompleteLessonButton bookingId={booking.id} label="Concluir aula" />
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 p-4">
          <div className="w-full max-w-2xl rounded-3xl bg-white p-6 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-gray-900">Reagendar aula</h2>
                <p className="mt-1 text-sm text-gray-500">
                  Converse com o aluno pelo WhatsApp e, se ele concordar, escolha abaixo um novo slot livre.
                </p>
              </div>
              <button type="button" onClick={closeModal} className="rounded-full p-1 text-gray-400 transition hover:bg-gray-100 hover:text-gray-700">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-4 rounded-2xl border border-gray-100 bg-gray-50 px-4 py-3 text-sm text-gray-700">
              Aula atual: <span className="font-semibold">{selectedBooking.date}</span> das{' '}
              <span className="font-semibold">{selectedBooking.start_time.slice(0, 5)}</span> as{' '}
              <span className="font-semibold">{selectedBooking.end_time.slice(0, 5)}</span>.
            </div>

            {loadingSlots ? (
              <div className="mt-5 flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-gray-500">
                <CalendarClock className="h-4 w-4 animate-pulse" />
                Carregando slots livres...
              </div>
            ) : slots.length === 0 ? (
              <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                Nenhum slot livre encontrado para reagendamento.
              </div>
            ) : (
              <div className="mt-5 max-h-[50vh] space-y-4 overflow-y-auto">
                {Object.entries(slotsByDate).map(([date, dateSlots]) => (
                  <div key={date} className="rounded-2xl border border-gray-100 p-4">
                    <p className="text-sm font-bold text-gray-900">
                      {format(new Date(`${date}T00:00:00`), "EEEE, dd 'de' MMMM", { locale: ptBR })}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {dateSlots.map((slot) => (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`rounded-xl border px-3 py-2 text-sm font-semibold transition ${
                            selectedSlotId === slot.id
                              ? 'border-blue-700 bg-blue-700 text-white'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-blue-200 hover:bg-blue-50'
                          }`}
                        >
                          {slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

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
                onClick={() => void handleReschedule()}
                disabled={submitting || !selectedSlotId}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-300"
              >
                <RefreshCw className="h-4 w-4" />
                {submitting ? 'Reagendando...' : 'Confirmar reagendamento'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
