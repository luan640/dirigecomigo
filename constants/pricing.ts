// Platform pricing constants
export const PLATFORM_CONFIG = {
  // Default platform and payment-provider fees added on top of instructor net amount
  DEFAULT_PLATFORM_FEE_PERCENT: 8,
  DEFAULT_PIX_FEE_PERCENT: 0,
  DEFAULT_CARD_FEE_PERCENT: 4.98,

  // Monthly instructor subscription price in BRL
  INSTRUCTOR_SUBSCRIPTION_PRICE: 15.00,

  // Minimum lesson price instructors can set
  MIN_LESSON_PRICE: 50,

  // Maximum lesson price
  MAX_LESSON_PRICE: 500,

  // Default lesson duration in minutes
  DEFAULT_LESSON_DURATION: 60,

  // Currency
  CURRENCY: 'BRL',
  LOCALE: 'pt-BR',
} as const

// Vehicle category labels
export const VEHICLE_CATEGORY_LABELS: Record<string, string> = {
  A: 'Categoria A (Motocicletas)',
  B: 'Categoria B (Carros)',
  AB: 'Categoria AB (Carros e Motos)',
  C: 'Categoria C (Veículos pesados)',
  D: 'Categoria D (Transporte de passageiros)',
  E: 'Categoria E (Combinação de veículos)',
}

// Booking status labels in Portuguese
export const BOOKING_STATUS_LABELS: Record<string, string> = {
  pending: 'Aguardando pagamento',
  confirmed: 'Confirmado',
  completed: 'Concluído',
  cancelled: 'Cancelado',
}

// Booking status colors for UI
export const BOOKING_STATUS_COLORS: Record<string, string> = {
  pending: 'bg-amber-100 text-amber-800',
  confirmed: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800',
}

// Payment status labels in Portuguese
export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: 'Pendente',
  processing: 'Processando',
  paid: 'Pago',
  failed: 'Falhou',
  refunded: 'Reembolsado',
}

// Subscription status labels in Portuguese
export const SUBSCRIPTION_STATUS_LABELS: Record<string, string> = {
  active: 'Ativa',
  pending: 'Pendente',
  expired: 'Vencida',
  cancelled: 'Cancelada',
}

// Subscription status colors
export const SUBSCRIPTION_STATUS_COLORS: Record<string, string> = {
  active: 'bg-green-100 text-green-800',
  pending: 'bg-amber-100 text-amber-800',
  expired: 'bg-red-100 text-red-800',
  cancelled: 'bg-gray-100 text-gray-800',
}
