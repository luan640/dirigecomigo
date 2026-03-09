'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { addDays, format, startOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronLeft, ChevronRight, Loader2, Plus, Settings, X } from 'lucide-react'
import { toast } from 'sonner'

type Slot = {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
}

type BlockedInterval = {
  id: string
  start: string
  end: string
}

type DaySchedule = {
  key: string
  label: string
  enabled: boolean
  start: string
  end: string
  blocked: BlockedInterval[]
}

type WeeklyScheduleSettings = {
  slot_minutes: number
  days: DaySchedule[]
}

type BookingRow = {
  scheduled_date?: string
  start_time?: string
  status?: string
}

type AvailabilityRow = {
  id?: string
  date?: string
  start_time?: string
  end_time?: string
  is_booked?: boolean
}

const AVAILABILITY_DAYS_AHEAD = 60

const DEFAULT_SETTINGS: WeeklyScheduleSettings = {
  slot_minutes: 60,
  days: [
    { key: '1', label: 'Seg', enabled: true, start: '07:00', end: '17:00', blocked: [{ id: 'seg-lunch', start: '12:00', end: '13:00' }] },
    { key: '2', label: 'Ter', enabled: true, start: '07:00', end: '17:00', blocked: [{ id: 'ter-lunch', start: '12:00', end: '13:00' }] },
    { key: '3', label: 'Qua', enabled: true, start: '07:00', end: '17:00', blocked: [{ id: 'qua-lunch', start: '12:00', end: '13:00' }] },
    { key: '4', label: 'Qui', enabled: true, start: '07:00', end: '17:00', blocked: [{ id: 'qui-lunch', start: '12:00', end: '13:00' }] },
    { key: '5', label: 'Sex', enabled: true, start: '07:00', end: '17:00', blocked: [{ id: 'sex-lunch', start: '12:00', end: '13:00' }] },
    { key: '6', label: 'Sab', enabled: true, start: '08:00', end: '12:00', blocked: [] },
    { key: '0', label: 'Dom', enabled: false, start: '08:00', end: '12:00', blocked: [] },
  ],
}

function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

function toTimeLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

function toEndTime(start: string, slotMinutes: number) {
  return `${toTimeLabel(toMinutes(start) + slotMinutes)}:00`
}

function generateSlotsForDay(date: Date, schedule: DaySchedule, slotMinutes: number, bookedLookup: Set<string>) {
  if (!schedule.enabled) return []

  const start = toMinutes(schedule.start)
  const end = toMinutes(schedule.end)
  const blockedIntervals = schedule.blocked
    .filter(interval => interval.start && interval.end && toMinutes(interval.start) < toMinutes(interval.end))
    .map(interval => ({
      start: toMinutes(interval.start),
      end: toMinutes(interval.end),
    }))

  const dateStr = format(date, 'yyyy-MM-dd')
  const slots: Slot[] = []

  for (let current = start; current + slotMinutes <= end; current += slotMinutes) {
    const slotEnd = current + slotMinutes
    const overlapsBlocked = blockedIntervals.some(interval => current < interval.end && slotEnd > interval.start)
    if (overlapsBlocked) continue

    const startLabel = toTimeLabel(current)
    slots.push({
      id: `${dateStr}-${startLabel}`,
      date: dateStr,
      start_time: `${startLabel}:00`,
      end_time: toEndTime(startLabel, slotMinutes),
      is_booked: bookedLookup.has(`${dateStr}-${startLabel}`),
    })
  }

  return slots
}

export default function HorariosPage() {
  const [weekOffset, setWeekOffset] = useState(0)
  const today = startOfDay(new Date())
  const [showSettings, setShowSettings] = useState(false)
  const [settings, setSettings] = useState<WeeklyScheduleSettings>(DEFAULT_SETTINGS)
  const [settingsDraft, setSettingsDraft] = useState<WeeklyScheduleSettings>(DEFAULT_SETTINGS)
  const [loadingBookings, setLoadingBookings] = useState(true)
  const [savingSettings, setSavingSettings] = useState(false)
  const [bookedLookup, setBookedLookup] = useState<Set<string>>(new Set())
  const [persistedSlots, setPersistedSlots] = useState<Slot[]>([])

  const loadPersistedAvailability = useCallback(async (instructorId: string) => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const startDate = format(today, 'yyyy-MM-dd')
    const endDate = format(addDays(today, AVAILABILITY_DAYS_AHEAD), 'yyyy-MM-dd')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data } = await (supabase as any)
      .from('instructor_availability')
      .select('id,date,start_time,end_time,is_booked')
      .eq('instructor_id', instructorId)
      .gte('date', startDate)
      .lte('date', endDate)
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (!Array.isArray(data)) {
      setPersistedSlots([])
      return
    }

    setPersistedSlots(
      data
        .map((slot: AvailabilityRow) => ({
          id: String(slot.id || `${slot.date}-${String(slot.start_time || '').slice(0, 5)}`),
          date: String(slot.date || ''),
          start_time: `${String(slot.start_time || '').slice(0, 5)}:00`,
          end_time: `${String(slot.end_time || '').slice(0, 5)}:00`,
          is_booked: Boolean(slot.is_booked),
        })),
    )
  }, [today])

  useEffect(() => {
    const loadBookedSlots = async () => {
      const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
      if (DEMO_MODE) {
        setBookedLookup(new Set())
        setPersistedSlots([])
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
          setPersistedSlots([])
          return
        }

        await loadPersistedAvailability(user.id)

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
  }, [loadPersistedAvailability])

  const weekDays = Array.from({ length: 7 }, (_, index) => addDays(today, weekOffset * 7 + index))
  const scheduleMap = useMemo(
    () => new Map(settings.days.map(day => [day.key, day])),
    [settings.days],
  )
  const persistedSlotsByDate = useMemo(() => {
    return new Map(
      weekDays.map(day => {
        const dateStr = format(day, 'yyyy-MM-dd')
        return [dateStr, persistedSlots
          .filter(slot => slot.date === dateStr)
          .map(slot => ({
            ...slot,
            is_booked: slot.is_booked || bookedLookup.has(`${slot.date}-${slot.start_time.slice(0, 5)}`),
          }))]
      }),
    )
  }, [bookedLookup, persistedSlots, weekDays])
  const generatedSlotsByDate = useMemo(() => {
    return new Map(
      weekDays.map(day => {
        const weekdayKey = String(day.getDay())
        const schedule = scheduleMap.get(weekdayKey)
        const dateStr = format(day, 'yyyy-MM-dd')
        return [dateStr, schedule ? generateSlotsForDay(day, schedule, settings.slot_minutes, bookedLookup) : []]
      }),
    )
  }, [bookedLookup, scheduleMap, settings.slot_minutes, weekDays])

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

      const startDate = format(today, 'yyyy-MM-dd')
      const endDate = format(addDays(today, AVAILABILITY_DAYS_AHEAD), 'yyyy-MM-dd')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: existingRows, error: existingError } = await (supabase as any)
        .from('instructor_availability')
        .select('id,date,start_time,end_time,is_booked')
        .eq('instructor_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)

      if (existingError) {
        toast.error('Nao foi possivel carregar a agenda atual do banco.')
        return
      }

      const existingBookedMap = new Map<string, AvailabilityRow>()
      for (const row of Array.isArray(existingRows) ? existingRows : []) {
        const date = String((row as AvailabilityRow).date || '')
        const time = String((row as AvailabilityRow).start_time || '').slice(0, 5)
        if (date && time && (row as AvailabilityRow).is_booked) {
          existingBookedMap.set(`${date}-${time}`, row as AvailabilityRow)
        }
      }

      const generatedRows: Array<{
        instructor_id: string
        date: string
        start_time: string
        end_time: string
        is_booked: boolean
      }> = []

      for (let offset = 0; offset <= AVAILABILITY_DAYS_AHEAD; offset += 1) {
        const date = addDays(today, offset)
        const dateStr = format(date, 'yyyy-MM-dd')
        const weekdayKey = String(date.getDay())
        const schedule = settingsDraft.days.find(day => day.key === weekdayKey)
        if (!schedule) continue

        const slots = generateSlotsForDay(date, schedule, settingsDraft.slot_minutes, new Set())
        for (const slot of slots) {
          const key = `${dateStr}-${slot.start_time.slice(0, 5)}`
          generatedRows.push({
            instructor_id: user.id,
            date: dateStr,
            start_time: slot.start_time,
            end_time: slot.end_time,
            is_booked: Boolean(existingBookedMap.get(key)?.is_booked),
          })
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const deleteResult = await (supabase as any)
        .from('instructor_availability')
        .delete()
        .eq('instructor_id', user.id)
        .gte('date', startDate)
        .lte('date', endDate)
        .eq('is_booked', false)

      if (deleteResult.error) {
        toast.error('Nao foi possivel limpar os slots antigos da agenda.')
        return
      }

      if (generatedRows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const upsertResult = await (supabase as any)
          .from('instructor_availability')
          .upsert(generatedRows, { onConflict: 'instructor_id,date,start_time' })

        if (upsertResult.error) {
          toast.error('Nao foi possivel salvar os horarios da agenda.')
          return
        }
      }

      await loadPersistedAvailability(user.id)
      setSettings(settingsDraft)
      setShowSettings(false)
      toast.success('Agenda semanal salva no banco.')
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
          Carregando agendamentos reais...
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {weekDays.map(day => {
          const dateStr = format(day, 'yyyy-MM-dd')
          const isPast = day < today
          const daySlots = (persistedSlotsByDate.get(dateStr)?.length
            ? persistedSlotsByDate.get(dateStr)
            : generatedSlotsByDate.get(dateStr)) || []

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
                  <p className="text-xs text-gray-400 text-center py-2">Sem horarios configurados</p>
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
                        <span className="text-sm font-medium text-gray-600 min-w-24">Nao agenda</span>
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
                {savingSettings ? 'Salvando...' : 'Salvar configuracoes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
