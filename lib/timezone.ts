import { format } from 'date-fns'

const SAO_PAULO_TIME_ZONE = 'America/Sao_Paulo'

function getZonedDateParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  }).formatToParts(date)

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: Number(values.hour),
    minute: Number(values.minute),
    second: Number(values.second),
  }
}

export function getSaoPauloNow() {
  const { year, month, day, hour, minute, second } = getZonedDateParts(new Date(), SAO_PAULO_TIME_ZONE)
  return new Date(year, month - 1, day, hour, minute, second)
}

export function getSaoPauloToday() {
  return format(getSaoPauloNow(), 'yyyy-MM-dd')
}

export function parseDateString(date: string) {
  const [year, month, day] = String(date).slice(0, 10).split('-').map(Number)
  return new Date(year, (month || 1) - 1, day || 1)
}

export function getLocalTimestampForDateTime(date: string, time: string) {
  const [year, month, day] = String(date).slice(0, 10).split('-').map(Number)
  const [hours, minutes] = String(time).slice(0, 5).split(':').map(Number)
  return new Date(year, (month || 1) - 1, day || 1, hours || 0, minutes || 0, 0, 0).getTime()
}
