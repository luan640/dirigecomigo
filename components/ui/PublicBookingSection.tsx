'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { addDays, format, isSameDay, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { AvailabilitySlot, InstructorCard, LessonPackage, VehicleCategory } from '@/types'
import type { PlatformPricingSettings } from '@/lib/platformPricing'
import { DEFAULT_PLATFORM_PRICING_SETTINGS } from '@/lib/platformPricing'
import { getLocalTimestampForDateTime, getSaoPauloNow } from '@/lib/timezone'
import { formatCurrency } from '@/utils/format'

type Props = {
  instructor: InstructorCard
  availability: AvailabilitySlot[]
  platformSettings?: PlatformPricingSettings | null
  lessonPackages?: LessonPackage[]
}

function getSlotTimestamp(date: string, time: string) {
  return getLocalTimestampForDateTime(date, time)
}

export default function PublicBookingSection({
  instructor,
  availability,
  platformSettings,
  lessonPackages = [],
}: Props) {
  const categoryOptions = useMemo<VehicleCategory[]>(
    () => (instructor.categories?.length ? instructor.categories : [instructor.category]),
    [instructor.categories, instructor.category],
  )

  const [selectedCategory, setSelectedCategory] = useState<VehicleCategory | null>(null)
  const [selectedPackageId, setSelectedPackageId] = useState<string | null>(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<AvailabilitySlot[]>([])
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
  const packageOptions = useMemo(
    () => lessonPackages
      .filter(item => !selectedCategory || item.category === selectedCategory)
      .sort((a, b) => a.lessons_count - b.lessons_count || a.price - b.price),
    [lessonPackages, selectedCategory],
  )

  const selectedPackage = useMemo(
    () => packageOptions.find(item => item.id === selectedPackageId) || null,
    [packageOptions, selectedPackageId],
  )

  const perLessonVisiblePrice = useMemo(() => {
    const total = selectedLessonPrice * (1 + activePlatformSettings.platform_fee_percent / 100)
    return Math.round(total * 100) / 100
  }, [activePlatformSettings.platform_fee_percent, selectedLessonPrice])

  const requiredSlotsCount = selectedPackage?.lessons_count ?? null
  const packageVisiblePrice = useMemo(() => {
    if (!selectedPackage) return null
    const total = selectedPackage.price * (1 + activePlatformSettings.platform_fee_percent / 100)
    return Math.round(total * 100) / 100
  }, [activePlatformSettings.platform_fee_percent, selectedPackage])

  const studentVisiblePrice = selectedPackage
    ? packageVisiblePrice ?? 0
    : Math.round(perLessonVisiblePrice * Math.max(selectedSlots.length, 1) * 100) / 100

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

  const hasValidSelection =
    selectedSlots.length > 0 &&
    !!selectedCategory &&
    (!selectedPackage || selectedSlots.length === selectedPackage.lessons_count)

  return (
    <div className="overflow-hidden rounded-2xl border border-[#d9e5f1] bg-white shadow-[0_18px_40px_rgba(3,31,74,0.08)]">
      <div
        className="px-5 py-4"
        style={{ background: 'linear-gradient(135deg, #031f4a 0%, #08285b 100%)' }}
      >
        <p className="text-xs font-semibold uppercase tracking-wider text-[#f6d86c]">
          {selectedPackage ? 'Comprar pacote' : 'Agendar aula'}
        </p>
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
                  setSelectedPackageId(null)
                  setWeekOffset(0)
                  setSelectedDate(null)
                  setSelectedSlots([])
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
          <div className="space-y-3">
            <div>
              <p className="mb-2 text-sm font-semibold text-gray-700">Escolha o formato da compra</p>
              <p className="text-xs text-gray-500">O aluno pode seguir com aulas avulsas ou comprar um pacote criado pelo instrutor.</p>
            </div>

            <div className="grid gap-2">
              <button
                type="button"
                onClick={() => {
                  setSelectedPackageId(null)
                  setSelectedSlots([])
                }}
                className={`rounded-xl border p-3 text-left transition-colors ${
                  !selectedPackage
                    ? 'border-[#ff6b00] bg-[#fff4ec]'
                    : 'border-gray-200 hover:border-[#ffd1b3] hover:bg-[#fffaf5]'
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Aulas avulsas</p>
                    <p className="mt-1 text-xs text-gray-500">Cada horário escolhido adiciona 1 aula ao checkout.</p>
                  </div>
                  <span className="text-sm font-extrabold text-[var(--brand-orange)]">
                    {formatCurrency(perLessonVisiblePrice)}
                  </span>
                </div>
              </button>

              {packageOptions.map((pkg) => {
                const pixTotal = Math.round(pkg.price * (1 + activePlatformSettings.platform_fee_percent / 100) * 100) / 100
                const cardTotal = Math.round(pkg.price * (1 + (activePlatformSettings.platform_fee_percent + (activePlatformSettings.card_fee_percent ?? 4.98)) / 100) * 100) / 100
                const savings = Math.round((cardTotal - pixTotal) * 100) / 100
                const isSelected = selectedPackageId === pkg.id

                return (
                  <button
                    key={pkg.id}
                    type="button"
                    onClick={() => {
                      setSelectedPackageId(pkg.id)
                      setSelectedSlots([])
                    }}
                    className={`rounded-xl border p-3 text-left transition-colors ${
                      isSelected
                        ? 'border-[#031f4a] bg-[#eef4fb]'
                        : 'border-gray-200 hover:border-[#d9e5f1] hover:bg-[#f8fbff]'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-gray-900">{pkg.name}</p>
                        <p className="mt-1 text-xs text-gray-500">
                          {pkg.lessons_count} aulas incluídas
                          {pkg.description ? ` • ${pkg.description}` : ''}
                        </p>
                        {savings > 0 && (
                          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                            ⚡ Pix: economize {formatCurrency(savings)}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-extrabold text-[#031f4a]">{formatCurrency(pixTotal)}</p>
                        {savings > 0 && (
                          <p className="mt-0.5 text-[11px] text-gray-400 line-through">{formatCurrency(cardTotal)} cartão</p>
                        )}
                        <p className="mt-0.5 text-[11px] text-gray-400">no Pix</p>
                      </div>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {selectedCategory && (
          <div>
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-gray-700">Selecione os horários</p>
              <span className="text-xs font-medium text-gray-400">
                {selectedSlots.length}
                {requiredSlotsCount ? ` / ${requiredSlotsCount}` : ''}
                {' '}selecionado{selectedSlots.length === 1 ? '' : 's'}
              </span>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {selectedPackage
                ? `Selecione exatamente ${selectedPackage.lessons_count} horários para este pacote.`
                : `Valor por aula: ${formatCurrency(perLessonVisiblePrice)}.`}
            </p>
          </div>
        )}

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
                      if (!isPast && hasSlots) setSelectedDate(day)
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
                    onClick={() =>
                      setSelectedSlots((current) => {
                        if (current.some((item) => item.id === slot.id)) {
                          return current.filter((item) => item.id !== slot.id)
                        }

                        if (requiredSlotsCount && current.length >= requiredSlotsCount) {
                          return current
                        }

                        return [...current, slot].sort((a, b) => getSlotTimestamp(a.date, a.start_time) - getSlotTimestamp(b.date, b.start_time))
                      })
                    }
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                      selectedSlots.some((item) => item.id === slot.id)
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

            {selectedSlots.length > 0 && (
              <div className="mt-3 rounded-xl bg-[#f8fafc] p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-gray-500">Horários selecionados</p>
                <div className="space-y-1 text-sm text-gray-600">
                  {selectedSlots.map((slot) => (
                    <div key={slot.id} className="flex items-center justify-between gap-3">
                      <span>{format(new Date(`${slot.date}T00:00:00`), 'dd/MM')} às {String(slot.start_time).slice(0, 5)}</span>
                      <button
                        type="button"
                        onClick={() => setSelectedSlots((current) => current.filter((item) => item.id !== slot.id))}
                        className="text-xs font-semibold text-[var(--brand-orange)]"
                      >
                        Remover
                      </button>
                    </div>
                  ))}
                </div>
                {selectedPackage && (
                  <p className="mt-2 text-xs text-gray-500">
                    {selectedSlots.length < selectedPackage.lessons_count
                      ? `Faltam ${selectedPackage.lessons_count - selectedSlots.length} horário(s) para completar o pacote.`
                      : 'Quantidade de horários do pacote preenchida.'}
                  </p>
                )}
              </div>
            )}
          </div>
        )}

        <Link
          href={
            hasValidSelection
              ? `/instrutor/${instructor.id}/agendar?${(() => {
                  const params = new URLSearchParams()
                  params.set('category', String(selectedCategory || ''))
                  if (selectedPackage) params.set('packageId', selectedPackage.id)
                  for (const slot of selectedSlots) {
                    params.append('slot', `${slot.id}|${slot.date}|${String(slot.start_time).slice(0, 5)}`)
                  }
                  return params.toString()
                })()}`
              : '#'
          }
          onClick={(event) => {
            if (!hasValidSelection) event.preventDefault()
          }}
          className={`flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-bold transition-colors ${
            hasValidSelection
              ? 'bg-[var(--brand-orange)] text-white hover:bg-[#e45f00]'
              : 'cursor-not-allowed bg-gray-100 text-gray-400'
          }`}
        >
          {hasValidSelection ? (
            <>
              Prosseguir
              <ArrowRight className="h-4 w-4" />
            </>
          ) : selectedPackage ? (
            `Selecione ${selectedPackage.lessons_count} horários`
          ) : (
            'Selecione categoria e horário'
          )}
        </Link>

        {!selectedCategory && (
          <p className="text-center text-xs text-gray-400">
            Escolha a categoria para liberar calendário, horários e pacotes.
          </p>
        )}

        {selectedCategory && !selectedDate && (
          <p className="text-center text-xs text-gray-400">
            Selecione um dia no calendário para ver os horários.
          </p>
        )}

        <p className="text-center text-xs text-gray-500">
          Este instrutor aceita novos agendamentos com pelo menos {minAdvanceHours}h de antecedência.
        </p>
      </div>
    </div>
  )
}
