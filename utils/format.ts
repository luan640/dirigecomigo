import { format, parseISO, isToday, isTomorrow, isThisWeek, addMinutes } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Format a date to Brazilian Portuguese string
 */
export function formatDate(date: string | Date, formatStr = 'dd/MM/yyyy'): string {
  const d = typeof date === 'string' ? parseISO(date) : date
  return format(d, formatStr, { locale: ptBR })
}

/**
 * Format a date with contextual label (Hoje, Amanhã, etc.)
 */
export function formatDateRelative(date: string | Date): string {
  const d = typeof date === 'string' ? parseISO(date) : date

  if (isToday(d)) return 'Hoje'
  if (isTomorrow(d)) return 'Amanhã'
  if (isThisWeek(d, { locale: ptBR })) {
    return format(d, "EEEE", { locale: ptBR })
  }

  return format(d, "dd 'de' MMMM", { locale: ptBR })
}

/**
 * Format time from HH:mm:ss to HH:mm
 */
export function formatTime(time: string): string {
  return time.substring(0, 5)
}

/**
 * Format a time range for display
 */
export function formatTimeRange(start: string, end: string): string {
  return `${formatTime(start)} – ${formatTime(end)}`
}

/**
 * Format date + time for booking display
 */
export function formatBookingDateTime(date: string, startTime: string, endTime: string): string {
  return `${formatDateRelative(date)}, ${formatTimeRange(startTime, endTime)}`
}

/**
 * Format BRL currency
 */
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value)
}

/**
 * Format a star rating to display string
 */
export function formatRating(rating: number): string {
  return rating.toFixed(1)
}

/**
 * Get availability label for instructor
 */
export function getAvailabilityLabel(available: boolean, slotsCount: number): {
  label: string
  color: string
} {
  if (!available || slotsCount === 0) {
    return { label: 'Sem horários', color: 'bg-gray-100 text-gray-600' }
  }
  if (slotsCount <= 2) {
    return { label: 'Poucos horários', color: 'bg-amber-100 text-amber-700' }
  }
  return { label: 'Disponível hoje', color: 'bg-emerald-100 text-emerald-700' }
}

/**
 * Generate a URL-friendly slug from a name
 */
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim()
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength).trim() + '…'
}

/**
 * Format phone number to Brazilian format
 */
export function formatPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '')
  if (digits.length === 11) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
  }
  if (digits.length === 10) {
    return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  }
  return phone
}

/**
 * Get month name in Portuguese
 */
export function getMonthName(monthIndex: number): string {
  const months = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ]
  return months[monthIndex] || ''
}
