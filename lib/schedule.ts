import { addDays, format, startOfDay } from 'date-fns'

export type BlockedInterval = {
  id: string
  start: string
  end: string
}

export type DaySchedule = {
  key: string
  label: string
  enabled: boolean
  start: string
  end: string
  blocked: BlockedInterval[]
}

export type WeeklyScheduleSettings = {
  slot_minutes: number
  days: DaySchedule[]
}

export type GeneratedScheduleSlot = {
  id: string
  date: string
  start_time: string
  end_time: string
  is_booked: boolean
}

export const DEFAULT_WEEKLY_SCHEDULE: WeeklyScheduleSettings = {
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

export function toMinutes(value: string) {
  const [hours, minutes] = value.split(':').map(Number)
  return hours * 60 + minutes
}

export function toTimeLabel(totalMinutes: number) {
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`
}

export function toEndTime(start: string, slotMinutes: number) {
  return `${toTimeLabel(toMinutes(start) + slotMinutes)}:00`
}

export function normalizeWeeklyScheduleSettings(raw: unknown): WeeklyScheduleSettings {
  if (!raw || typeof raw !== 'object') return DEFAULT_WEEKLY_SCHEDULE

  const source = raw as Partial<WeeklyScheduleSettings>
  const slotMinutes = Number(source.slot_minutes)
  const validSlotMinutes = Number.isFinite(slotMinutes) && slotMinutes > 0 ? slotMinutes : DEFAULT_WEEKLY_SCHEDULE.slot_minutes
  const sourceDays = Array.isArray(source.days) ? source.days : []

  return {
    slot_minutes: validSlotMinutes,
    days: DEFAULT_WEEKLY_SCHEDULE.days.map((defaultDay) => {
      const matched = sourceDays.find((day) => String((day as DaySchedule)?.key || '') === defaultDay.key) as Partial<DaySchedule> | undefined
      const blocked = Array.isArray(matched?.blocked)
        ? matched.blocked
            .map((interval, index) => ({
              id: String(interval?.id || `${defaultDay.key}-${index}`),
              start: String(interval?.start || ''),
              end: String(interval?.end || ''),
            }))
            .filter((interval) => interval.start && interval.end)
        : defaultDay.blocked

      return {
        key: defaultDay.key,
        label: defaultDay.label,
        enabled: matched?.enabled ?? defaultDay.enabled,
        start: String(matched?.start || defaultDay.start),
        end: String(matched?.end || defaultDay.end),
        blocked,
      }
    }),
  }
}

export function generateSlotsForDay(date: Date, schedule: DaySchedule, slotMinutes: number, bookedLookup: Set<string>) {
  if (!schedule.enabled) return []

  const start = toMinutes(schedule.start)
  const end = toMinutes(schedule.end)
  const blockedIntervals = schedule.blocked
    .filter((interval) => interval.start && interval.end && toMinutes(interval.start) < toMinutes(interval.end))
    .map((interval) => ({
      start: toMinutes(interval.start),
      end: toMinutes(interval.end),
    }))

  const dateStr = format(date, 'yyyy-MM-dd')
  const slots: GeneratedScheduleSlot[] = []

  for (let current = start; current + slotMinutes <= end; current += slotMinutes) {
    const slotEnd = current + slotMinutes
    const overlapsBlocked = blockedIntervals.some((interval) => current < interval.end && slotEnd > interval.start)
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

export function generateScheduleWindow(args: {
  settings: WeeklyScheduleSettings
  bookedLookup?: Set<string>
  startDate?: Date
  daysAhead: number
}) {
  const { settings, bookedLookup = new Set(), daysAhead } = args
  const startDate = startOfDay(args.startDate || new Date())
  const scheduleMap = new Map(settings.days.map((day) => [day.key, day]))

  const slots: GeneratedScheduleSlot[] = []
  for (let offset = 0; offset <= daysAhead; offset += 1) {
    const date = addDays(startDate, offset)
    const schedule = scheduleMap.get(String(date.getDay()))
    if (!schedule) continue
    slots.push(...generateSlotsForDay(date, schedule, settings.slot_minutes, bookedLookup))
  }

  return slots
}
