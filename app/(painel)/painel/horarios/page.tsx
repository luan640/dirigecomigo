'use client'

import { useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, Plus, Settings, X } from 'lucide-react'
import { toast } from 'sonner'

import {
  DEFAULT_WEEKLY_SCHEDULE,
  type DaySchedule,
  type WeeklyScheduleSettings,
  normalizeWeeklyScheduleSettings,
  generateScheduleWindow,
  toMinutes,
} from '@/lib/schedule'

type BookingRow = {
  scheduled_date?: string
  start_time?: string
  status?: string
}

const AVAILABILITY_DAYS_AHEAD = 60

export default function HorariosPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const today = startOfDay(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<WeeklyScheduleSettings>(DEFAULT_WEEKLY_SCHEDULE)
  const [settingsDraft, setSettingsDraft] = useState<WeeklyScheduleSettings>(DEFAULT_WEEKLY_SCHEDULE)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [bookedLookup, setBookedLookup] = useState<Set<string>>(new Set())

  useEffect(() => {
    const loadBookedSlots = async () => {
      const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
      if (DEMO_MODE) {
        setBookedLookup(new Set())
        setLoadingBookings(false)
        return
      }

      try {
        const { createClient } = await import('@/lib/supabase/client')
        const supabase = createClient()
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user
        if (!user) {
          setBookedLookup(new Set())
          return
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: instructorData } = await (supabase.from('instructors') as any)
          .select('weekly_schedule')
          .eq('id', user.id)
          .maybeSingle()

        const nextSettings = normalizeWeeklyScheduleSettings(instructorData?.weekly_schedule)
        setSettings(nextSettings)
        setSettingsDraft(nextSettings)

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data, error } = await (supabase as any)
          .from('bookings')
          .select('scheduled_date,start_time,status')
          .eq('instructor_id', user.id)

        if (error || !Array.isArray(data)) {
          setBookedLookup(new Set())
          return
        }

        const nextLookup = new Set(
          data
            .filter((row: BookingRow) => {
              const status = String(row.status || '')
              return status !== 'cancelled' && status !== 'no_show'
            })
            .map((row: BookingRow) => {
              const date = String(row.scheduled_date || '').slice(0, 10)
              const time = String(row.start_time || '').slice(0, 5)
              return date && time ? `${date}-${time}` : ''
            })
            .filter(Boolean),
        )

        setBookedLookup(nextLookup)
      } catch {
        setBookedLookup(new Set())
      } finally {
        setLoadingBookings(false)
      }
    }

    void loadBookedSlots()
  }, [])

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(today, weekOffset * 7 + index))
  const generatedSlotsByDate = useMemo(() => {
    const allSlots = generateScheduleWindow({
      settings,
      bookedLookup,
      startDate: today,
      daysAhead: AVAILABILITY_DAYS_AHEAD,
    })

    return new Map(
      weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return [dateStr, allSlots.filter(slot => slot.date === dateStr)]
      }),
    )
  }, [bookedLookup, settings, today, weekDays])

  const updateDayDraft = (dayKey: string, updater: (day: DaySchedule) => DaySchedule) => {
    setSettingsDraft(prev => ({
      ...prev,
      days: prev.days.map(day => (day.key === dayKey ? updater(day) : day)),
    }))
  }

  const addBlockedInterval = (dayKey: string) => {
    updateDayDraft(dayKey, day => ({
      ...day,
      blocked: [...day.blocked, { id: `${dayKey}-${Date.now()}`, start: '12:00', end: '13:00' }],
    }))
  }

  const removeBlockedInterval = (dayKey: string, intervalId: string) => {
    updateDayDraft(dayKey, day => ({
      ...day,
      blocked: day.blocked.filter(interval => interval.id !== intervalId),
    }))
  }

  const updateBlockedInterval = (dayKey: string, intervalId: string, field: 'start' | 'end', value: string) => {
    updateDayDraft(dayKey, day => ({
      ...day,
      blocked: day.blocked.map(interval => (
        interval.id === intervalId
          ? { ...interval, [field]: value }
          : interval
      )),
    }))
  }

  const handleSaveSettings = async () => {
    for (const day of settingsDraft.days) {
      if (!day.enabled) continue
      if (toMinutes(day.start) >= toMinutes(day.end)) {
        toast.error(`No ${day.label}, o horario inicial deve ser anterior ao final.`)
        return
      }

      for (const interval of day.blocked) {
        if (toMinutes(interval.start) >= toMinutes(interval.end)) {
          toast.error(`No ${day.label}, cada intervalo bloqueado precisa ter inicio antes do fim.`)
          return
        }
        if (toMinutes(interval.start) < toMinutes(day.start) || toMinutes(interval.end) > toMinutes(day.end)) {
          toast.error(`No ${day.label}, os bloqueios devem ficar dentro da jornada do dia.`)
          return
        }
      }
    }

    const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    if (DEMO_MODE) {
      setSettings(settingsDraft)
      setShowSettings(false)
      toast.success('Agenda semanal atualizada.')
      return
    }

    try {
      setSavingSettings(true)
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        toast.error('Sessao expirada. Entre novamente para salvar a agenda.')
        return
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const updateResult = await (supabase.from('instructors') as any)
        .update({ weekly_schedule: settingsDraft })
        .eq('id', user.id)

      if (updateResult.error) {
        toast.error(updateResult.error.message || 'Nao foi possivel salvar a agenda.')
        return
      }

      setSettings(settingsDraft)
      setShowSettings(false)
      toast.success('Agenda semanal salva.')
    } catch {
      toast.error('Nao foi possivel salvar a agenda.')
    } finally {
      setSavingSettings(false)
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold text-gray-900">Gerenciar horarios</h1>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setShowSettings(true)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
            aria-label="Configurar agenda"
          >
            <Settings className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setWeekOffset(value => Math.max(0, value - 1))}
            disabled={weekOffset === 0}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50 disabled:opacity-30"
          >
            <ChevronLeft className="w-4 h-4 text-gray-600" />
          </button>
          <button
            onClick={() => setWeekOffset(value => value + 1)}
            className="p-1.5 rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            <ChevronRight className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="rounded-xl border border-blue-100 bg-blue-50/70 px-4 py-3 text-sm text-blue-800">
        Slots de {settings.slot_minutes} min. Configure os dias da semana na engrenagem para preencher a semana automaticamente.
      </div>

      {loadingBookings && (
        <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-3 text-sm text-gray-500">
          <Loader2 className="h-4 w-4 animate-spin" />
          Carregando agendamentos...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isPast = day < today
          const daySlots = generatedSlotsByDate.get(dateStr) || []

          return (
            <div key={dateStr} className={`bg-white rounded-xl border shadow-sm p-4 ${isPast ? 'opacity-50' : ''}`}>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                {format(day, 'EEE', { locale: ptBR })}
              </p>
              <p className="text-lg font-extrabold text-gray-900">
                {format(day, 'dd MMM', { locale: ptBR })}
              </p>

              <div className="mt-3 space-y-1.5">
                {daySlots.length === 0 && (
                  <p className="text-xs text-gray-400 text-center py-2">Sem horários configurados</p>
                )}

                {daySlots.map(slot => (
                  <div
                    key={slot.id}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold ${
                      slot.is_booked ? 'bg-blue-50 text-blue-700' : 'bg-emerald-50 text-emerald-700'
                    }`}
                  >
                    <span>{slot.start_time.slice(0, 5)} - {slot.end_time.slice(0, 5)}</span>
                    {slot.is_booked ? (
                      <span className="text-blue-400 text-xs">Agendado</span>
                    ) : (
                      <span className="text-emerald-500 text-xs">Livre</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[70] overflow-y-auto bg-gray-900/40 px-4 pb-4 pt-24">
          <div className="mx-auto w-full max-w-5xl rounded-2xl bg-white shadow-xl">
            <div className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
              <div>
                <h2 className="font-bold text-gray-900">Configurar agenda</h2>
                <p className="text-sm text-gray-500 mt-1">
                  Defina os dias da semana, inicio, fim e intervalos em que nao aceitara agenda.
                </p>
              </div>
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="border-b border-gray-100 px-5 py-4">
              <label className="block text-sm text-gray-700 max-w-xs">
                Tamanho dos slots
                <select
                  value={String(settingsDraft.slot_minutes)}
                  onChange={event => setSettingsDraft(prev => ({ ...prev, slot_minutes: Number(event.target.value) }))}
                  className="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm bg-white"
                >
                  <option value="30">30 minutos</option>
                  <option value="45">45 minutos</option>
                  <option value="60">60 minutos</option>
                  <option value="90">90 minutos</option>
                  <option value="120">120 minutos</option>
                </select>
              </label>
            </div>

            <div className="max-h-[calc(100vh-16rem)] overflow-y-auto px-5 py-5 space-y-4">
              {settingsDraft.days.map(day => (
                <div key={day.key} className="rounded-2xl border border-gray-100 p-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="flex items-center gap-2 text-sm font-semibold text-gray-900 min-w-24">
                      <input
                        type="checkbox"
                        checked={day.enabled}
                        onChange={event => updateDayDraft(day.key, current => ({ ...current, enabled: event.target.checked }))}
                        className="rounded border-gray-300"
                      />
                      {day.label}
                    </label>

                    <label className="text-sm text-gray-700">
                      Inicio
                      <input
                        type="time"
                        value={day.start}
                        disabled={!day.enabled}
                        onChange={event => updateDayDraft(day.key, current => ({ ...current, start: event.target.value }))}
                        className="mt-1 ml-2 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                      />
                    </label>

                    <label className="text-sm text-gray-700">
                      Fim
                      <input
                        type="time"
                        value={day.end}
                        disabled={!day.enabled}
                        onChange={event => updateDayDraft(day.key, current => ({ ...current, end: event.target.value }))}
                        className="mt-1 ml-2 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                      />
                    </label>

                    <button
                      type="button"
                      disabled={!day.enabled}
                      onClick={() => addBlockedInterval(day.key)}
                      className="ml-auto inline-flex items-center gap-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4" /> Bloqueio
                    </button>
                  </div>

                  <div className="mt-4 space-y-3">
                    {day.blocked.length === 0 && (
                      <p className="text-sm text-gray-400">Sem bloqueios para este dia.</p>
                    )}

                    {day.blocked.map(interval => (
                      <div key={interval.id} className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 px-3 py-3">
                        <span className="text-sm font-medium text-gray-600 min-w-24">Não agenda</span>
                        <label className="text-sm text-gray-700">
                          De
                          <input
                            type="time"
                            value={interval.start}
                            disabled={!day.enabled}
                            onChange={event => updateBlockedInterval(day.key, interval.id, 'start', event.target.value)}
                            className="mt-1 ml-2 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                          />
                        </label>
                        <label className="text-sm text-gray-700">
                          Ate
                          <input
                            type="time"
                            value={interval.end}
                            disabled={!day.enabled}
                            onChange={event => updateBlockedInterval(day.key, interval.id, 'end', event.target.value)}
                            className="mt-1 ml-2 rounded-xl border border-gray-200 px-3 py-2 text-sm disabled:bg-gray-50"
                          />
                        </label>
                        <button
                          type="button"
                          disabled={!day.enabled}
                          onClick={() => removeBlockedInterval(day.key, interval.id)}
                          className="ml-auto rounded-lg p-2 text-gray-400 hover:bg-white hover:text-red-500 disabled:opacity-50"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-gray-100 px-5 py-4">
              <button
                onClick={() => setShowSettings(false)}
                className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-50"
              >
                Cancelar
              </button>
              <button
                onClick={handleSaveSettings}
                disabled={savingSettings}
                className="rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-blue-400"
              >
                {savingSettings ? 'Salvando...' : 'Salvar configurações'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
