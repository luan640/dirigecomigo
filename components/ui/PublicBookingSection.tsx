'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AvailabilitySlot, InstructorCard, VehicleCategory } from '@/types'
import type { PlatformPricingSettings } from '@/lib/platformPricing'
import { DEFAULT_PLATFORM_PRICING_SETTINGS } from '@/lib/platformPricing'
import { getLocalTimestampForDateTime, getSaoPauloNow } from '@/lib/timezone'
import { formatCurrency } from '@/utils/format'

type Props = {
  instructor: InstructorCard
  availability: AvailabilitySlot[]
  platformSettings?: PlatformPricingSettings | null
}

function getSlotTimestamp(date: string, time: string) {
  return getLocalTimestampForDateTime(date, time)
}

export default function PublicBookingSection({ instructor, availability, platformSettings }: Props) {
  const categoryOptions = useMemo<VehicleCategory[]>(
    () => (instructor.categories?.length ? instructor.categories : [instructor.category]),
    [instructor.categories, instructor.category],
  )

  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null)
  const minAdvanceHours = instructor.min_advance_booking_hours ?? 2
  const [nowTs] = useState(() => getSaoPauloNow().getTime())

  const today = startOfDay(getSaoPauloNow())
  const minBookingTs = nowTs + minAdvanceHours * 60 * 60 * 1000

  const weekDays = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(today, weekOffset * 7 + i)),
    [today, weekOffset],
  )

  const selectedLessonPrice = useMemo(() => {
    if (selectedCategory === 'A') return instructor.price_per_lesson_a ?? instructor.price_per_lesson
    if (selectedCategory === 'B') return instructor.price_per_lesson_b ?? instructor.price_per_lesson
    return instructor.price_per_lesson
  }, [instructor.price_per_lesson, instructor.price_per_lesson_a, instructor.price_per_lesson_b, selectedCategory])

  const activePlatformSettings = platformSettings ?? DEFAULT_PLATFORM_PRICING_SETTINGS
  const platformFeeAmount = useMemo(() => {
    const fee = selectedLessonPrice * (activePlatformSettings.platform_fee_percent / 100)
    return Math.round(fee * 100) / 100
  }, [activePlatformSettings.platform_fee_percent, selectedLessonPrice])

  const studentVisiblePrice = useMemo(() => {
    return Math.round((selectedLessonPrice + platformFeeAmount) * 100) / 100
  }, [platformFeeAmount, selectedLessonPrice])

  const slotsForDate = useMemo(() => {
    if (!selectedDate) return []
    const dateStr = format(selectedDate, 'yyyy-MM-dd')
    return availability.filter((slot) => {
      if (slot.date !== dateStr || slot.is_booked) return false
      return getSlotTimestamp(slot.date, slot.start_time) >= minBookingTs
    })
  }, [availability, minBookingTs, selectedDate])

  const hasSlotsForDay = (day: Date) => {
    const dateStr = format(day, 'yyyy-MM-dd')
    return availability.some((slot) => {
      if (slot.date !== dateStr || slot.is_booked) return false
      return getSlotTimestamp(slot.date, slot.start_time) >= minBookingTs
    })
  }

  const categoryLabels: Record<VehicleCategory, string> = {
    A: 'Moto',
    B: 'Carro',
    AB: 'Moto + Carro',
    C: 'Caminhao',
    D: 'Onibus',
    E: 'Carreta',
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d9e5f1] bg-white shadow-[0_18px_40px_rgba(3,31,74,0.08)]">
      <div
        className="px-5 py-4"
        style={{ background: 'linear-gradient(135deg, #031f4a 0%, #08285b 100%)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-[#f6d86c]">Agendar aula</p>
        <p className="mt-1 text-2xl font-extrabold text-white">
          {formatCurrency(studentVisiblePrice)}
        </p>
      </div>

      <div className="space-y-4 p-5">
        <div>
          <p className="mb-2 text-sm font-semibold text-gray-700">Selecione a categoria da aula</p>
          <div className="grid grid-cols-2 gap-2">
            {categoryOptions.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setSelectedCategory(cat)
                  setWeekOffset(0)
                  setSelectedDate(null)
                  setSelectedSlot(null)
                }}
                style={
                  selectedCategory === cat
                    ? {
                        backgroundColor: '#ff6b00',
                        borderColor: '#ff6b00',
                        color: '#ffffff',
                      }
                    : undefined
                }
                className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                  selectedCategory === cat
                    ? ''
                    : 'border-gray-200 text-gray-700 hover:border-[#ffd1b3] hover:bg-[#fff4ec]'
                }`}
              >
                {categoryLabels[cat]}
              </button>
            ))}
          </div>
        </div>

        {selectedCategory && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Selecione um dia</p>
              <div className="flex gap-1">
                <button
                  type="button"
                  onClick={() => {
                    setWeekOffset((w) => Math.max(0, w - 1))
                    setSelectedDate(null)
                    setSelectedSlot(null)
                  }}
                  disabled={weekOffset === 0}
                  className="rounded-lg p-1 text-gray-400 hover:text-[var(--brand-orange)] disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setWeekOffset((w) => w + 1)
                    setSelectedDate(null)
                    setSelectedSlot(null)
                  }}
                  className="rounded-lg p-1 text-gray-400 hover:text-[var(--brand-orange)]"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-7 gap-0.5">
              {weekDays.map((day) => {
                const hasSlots = hasSlotsForDay(day)
                const isSelected = selectedDate ? isSameDay(day, selectedDate) : false
                const isPast = day < today

                return (
                  <button
                    key={format(day, 'yyyy-MM-dd')}
                    type="button"
                    onClick={() => {
                      if (!isPast && hasSlots) {
                        setSelectedDate(day)
                        setSelectedSlot(null)
                      }
                    }}
                    disabled={isPast || !hasSlots}
                    style={
                      isSelected
                        ? {
                            backgroundColor: '#031f4a',
                            color: '#f8fbff',
                          }
                        : undefined
                    }
                    className={`flex flex-col items-center rounded-lg px-1 py-2 text-xs transition-colors ${
                      isSelected
                        ? ''
                        : isPast || !hasSlots
                          ? 'cursor-default text-gray-300'
                          : 'cursor-pointer text-gray-700 hover:bg-[#eef4fb]'
                    }`}
                  >
                    <span className="font-semibold uppercase tracking-wider">
                      {format(day, 'EEE', { locale: ptBR }).slice(0, 3)}
                    </span>
                    <span className={`mt-0.5 text-base font-bold ${isSelected ? 'text-white' : ''}`}>
                      {format(day, 'd')}
                    </span>
                    {hasSlots && !isPast && (
                      <span className={`mt-0.5 h-1.5 w-1.5 rounded-full ${isSelected ? 'bg-[#f6d86c]' : 'bg-[var(--brand-green)]'}`} />
                    )}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedCategory && selectedDate && (
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">
              Horários disponíveis para {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })}
            </p>
            {slotsForDate.length === 0 ? (
              <p className="py-3 text-center text-sm text-gray-400">Nenhum horário disponível</p>
            ) : (
              <div className="grid grid-cols-2 gap-1.5">
                {slotsForDate.map((slot) => (
                  <button
                    key={slot.id}
                    type="button"
                    onClick={() => setSelectedSlot((current) => (current?.id === slot.id ? null : slot))}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors
                      ${selectedSlot?.id === slot.id
                        ? 'border-[var(--brand-orange)] bg-[var(--brand-orange)] text-white'
                        : 'border-gray-200 text-gray-700 hover:border-[#ffd1b3] hover:bg-[#fff4ec]'
                      }`}
                  >
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    {String(slot.start_time).slice(0, 5)}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <Link
          href={
            selectedSlot
              ? `/instrutor/${instructor.id}/agendar?slotId=${selectedSlot.id}&date=${selectedSlot.date}&time=${String(selectedSlot.start_time).slice(0, 5)}&category=${selectedCategory}`
              : '#'
          }
          onClick={(event) => {
            if (!selectedSlot || !selectedCategory) event.preventDefault()
          }}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors
            ${selectedSlot && selectedCategory
              ? 'bg-[var(--brand-orange)] text-white hover:bg-[#e45f00]'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
            }`}
        >
          {selectedSlot && selectedCategory ? (
            <>
              Prosseguir
              <ArrowRight className="h-4 w-4" />
            </>
          ) : (
            'Selecione categoria e horário'
          )}
        </Link>

        {!selectedCategory && (
          <p className="text-center text-xs text-gray-400">
            Escolha a categoria para liberar calendario e horários
          </p>
        )}

        {selectedCategory && !selectedDate && (
          <p className="text-center text-xs text-gray-400">
            Selecione um dia no calendário para ver os horários
          </p>
        )}

        <p className="text-center text-xs text-gray-500">
          Este instrutor aceita novos agendamentos com pelo menos {minAdvanceHours}h de antecedencia.
        </p>
      </div>
    </div>
  )
}
