'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import { Clock, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react'
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { InstructorCard } from '@/types'
import { formatCurrency } from '@/utils/format'
import { calculatePaymentSplit } from '@/utils/payment'
import type { VehicleCategory } from '@/types'

interface SlotData {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
}

interface Props {
  instructor: InstructorCard
  availability: SlotData[]
}

function getSlotTimestamp(date: string, time: string) {
  const normalizedTime = String(time).slice(0, 5)
  return new Date(`${date}T${normalizedTime}:00`).getTime()
}

export default function BookingSection({ instructor, availability }: Props) {
  const categoryOptions = useMemo<VehicleCategory[]>(
    () => (instructor.categories?.length ? instructor.categories : [instructor.category]),
    [instructor.categories, instructor.category]
  )

  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null)
  const minAdvanceHours = instructor.min_advance_booking_hours ?? 2
  const [nowTs] = useState(() => Date.now())

  const today = startOfDay(new Date())
  const minBookingTs = nowTs + minAdvanceHours * 60 * 60 * 1000

  // Build 7-day window
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(today, weekOffset * 7 + i))
  }, [today, weekOffset])

  const slotsForDate = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return availability.filter(s => {
      if (s.date !== dateStr || s.is_booked) return false
      return getSlotTimestamp(s.date, s.start_time) >= minBookingTs
    })
  }, [selectedDate, availability, minBookingTs])

  const hasSlotsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return availability.some(s => {
      if (s.date !== dateStr || s.is_booked) return false
      return getSlotTimestamp(s.date, s.start_time) >= minBookingTs
    })
  }

  const split = calculatePaymentSplit(instructor.price_per_lesson)
  const showCalendar = selectedCategory !== null

  const CATEGORY_LABELS: Record<VehicleCategory, string> = {
    A: 'Moto',
    B: 'Carro',
    AB: 'Moto + Carro',
    C: 'Caminhão',
    D: 'Ônibus',
    E: 'Carreta',
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-blue-700 px-5 py-4">
        <p className="text-white text-xs uppercase tracking-wider font-semibold">Agendar aula</p>
        <p className="text-white text-2xl font-extrabold mt-1">
          {formatCurrency(instructor.price_per_lesson)}
          <span className="text-blue-200 text-sm font-normal ml-1">/ 60 min</span>
        </p>
      </div>

      <div className="p-5 space-y-4">
        {/* Category selection */}
        <div>
          <p className="text-sm font-semibold text-gray-700 mb-2">Selecione a categoria da aula</p>
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.map(cat => (
              <button
                key={cat}
                onClick={() => {
                  setSelectedCategory(cat)
                  setWeekOffset(0)
                  setSelectedDate(null)
                  setSelectedSlot(null)
                }}
                className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-colors ${
                  selectedCategory === cat
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                }`}
              >
                {CATEGORY_LABELS[cat]}
              </button>
            ))}
          </div>
        </div>

        {/* Week navigation */}
        {showCalendar && (
          <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-semibold text-gray-700">Selecione um dia</p>
            <div className="flex gap-1">
              <button
                onClick={() => { setWeekOffset(w => Math.max(0, w - 1)); setSelectedDate(null); setSelectedSlot(null) }}
                disabled={weekOffset === 0}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700 disabled:opacity-30"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => { setWeekOffset(w => w + 1); setSelectedDate(null); setSelectedSlot(null) }}
                className="p-1 rounded-lg text-gray-400 hover:text-gray-700"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {weekDays.map(day => {
              const hasSlots = hasSlotsForDay(day)
              const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
              const isPast = day < today

              return (
                <button
                  key={day.toISOString()}
                  onClick={() => { if (!isPast && hasSlots) { setSelectedDate(day); setSelectedSlot(null) } }}
                  disabled={isPast || !hasSlots}
                  className={`flex flex-col items-center py-2 px-1 rounded-lg text-xs transition-colors
                    ${isSelected ? 'bg-blue-700 text-white' : ''}
                    ${!isSelected && hasSlots && !isPast ? 'hover:bg-blue-50 text-gray-700 cursor-pointer' : ''}
                    ${isPast || !hasSlots ? 'text-gray-300 cursor-default' : ''}
                  `}
                >
                  <span className="font-semibold uppercase tracking-wider">
                    {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                  </span>
                  <span className={`font-bold text-base mt-0.5 ${isSelected ? 'text-white' : ''}`}>
                    {format(day, 'd')}
                  </span>
                  {hasSlots && !isPast && (
                    <span className={`w-1.5 h-1.5 rounded-full mt-0.5 ${isSelected ? 'bg-blue-200' : 'bg-emerald-500'}`} />
                  )}
                </button>
              )
            })}
          </div>
          </div>
        )}

        {/* Time slots */}
        {showCalendar && selectedDate && (
          <div>
            <p className="text-sm font-semibold text-gray-700 mb-2">
              Horários disponíveis — {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
            {slotsForDate.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-3">Nenhum horário disponível</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {slotsForDate.map(slot => (
                  <button
                    key={slot.id}
                    onClick={() => setSelectedSlot(s => s?.id === slot.id ? null : slot)}
                    className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-colors flex items-center gap-1.5
                      ${selectedSlot?.id === slot.id
                        ? 'bg-blue-700 text-white border-blue-700'
                        : 'border-gray-200 text-gray-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                  >
                    <Clock className="w-3.5 h-3.5 flex-shrink-0" />
                    {slot.start_time.slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Payment split info */}
        {showCalendar && selectedSlot && (
          <div className="bg-gray-50 rounded-xl p-4 space-y-1.5 text-sm">
            <div className="flex justify-between text-gray-600">
              <span>Valor da aula</span>
              <span>{formatCurrency(split.gross)}</span>
            </div>
            <div className="flex justify-between text-gray-400 text-xs">
              <span>Taxa da plataforma (8%)</span>
              <span>−{formatCurrency(split.platformFee)}</span>
            </div>
            <div className="flex justify-between font-bold text-gray-900 pt-1 border-t border-gray-200">
              <span>Total</span>
              <span>{formatCurrency(split.gross)}</span>
            </div>
          </div>
        )}

        {/* CTA */}
        <Link
          href={
            selectedSlot
              ? `/instrutor/${instructor.id}/agendar?slotId=${selectedSlot.id}&date=${selectedSlot.date}&time=${selectedSlot.start_time}&category=${selectedCategory}`
              : '#'
          }
          onClick={e => { if (!selectedSlot || !selectedCategory) e.preventDefault() }}
          className={`flex items-center justify-center gap-2 w-full py-3 px-4 rounded-xl font-bold text-sm transition-colors
            ${selectedSlot && selectedCategory
              ? 'bg-blue-700 hover:bg-blue-800 text-white'
              : 'bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
        >
          {selectedSlot && selectedCategory ? (
            <>Confirmar agendamento <ArrowRight className="w-4 h-4" /></>
          ) : (
            'Selecione categoria e horário'
          )}
        </Link>

        {!selectedCategory && (
          <p className="text-xs text-gray-400 text-center">
            Escolha a categoria para liberar calendário e horários
          </p>
        )}

        {showCalendar && !selectedDate && (
          <p className="text-xs text-gray-400 text-center">
            Selecione um dia no calendário para ver os horários
          </p>
        )}

        <p className="text-xs text-gray-500 text-center">
          Este instrutor aceita novos agendamentos com pelo menos {minAdvanceHours}h de antecedência.
        </p>
      </div>
    </div>
  )
}
