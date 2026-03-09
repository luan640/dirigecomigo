import { createClient } from '@supabase/supabase-js'
import { calculatePaymentSplit } from '@/utils/payment'

export type MercadoPagoPersistInput = {
  paymentId: string
  amount: number
  currency: string
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'refunded'
  metadata?: Record<string, unknown>
  payerEmail?: string
  bookingId?: string
}

type BookingSnapshot = {
  id: string
  student_id?: string | null
  total_amount?: number | null
  gross_amount?: number | null
  platform_fee?: number | null
  instructor_net?: number | null
}

function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!url || !serviceRole) return null

  return createClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

function resolveBookingId(input: MercadoPagoPersistInput): string {
  const metadata = input.metadata || {}
  const candidate =
    input.bookingId ||
    metadata.bookingId ||
    metadata.booking_id ||
    metadata.slotId ||
    metadata.slot_id

  if (candidate && typeof candidate === 'string') return candidate
  return `mp_${input.paymentId}`
}

async function resolveStudentIdByEmail(email?: string): Promise<string | null> {
  if (!email) return null
  const supabase = getAdminClient()
  if (!supabase) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const { data } = await db
    .from('profiles')
    .select('id, role')
    .eq('email', email)
    .limit(1)
    .maybeSingle()

  if (!data?.id) return null
  return String(data.id)
}

function buildNewSchemaPayload(input: MercadoPagoPersistInput, bookingId: string) {
  return {
    booking_id: bookingId,
    provider: 'mercadopago',
    provider_payment_id: input.paymentId,
    amount: input.amount,
    currency: input.currency,
    status: input.status,
    paid_at: input.status === 'paid' ? new Date().toISOString() : null,
    metadata: input.metadata || {},
  }
}

function buildOldSchemaPayload(input: MercadoPagoPersistInput, bookingId: string, studentId: string, amount: number) {
  const paymentMethod = String(input.metadata?.paymentMethod || 'pix') === 'card' ? 'card' : 'pix'
  const split = calculatePaymentSplit(amount, paymentMethod)

  return {
    booking_id: bookingId,
    student_id: studentId || bookingId,
    amount,
    platform_fee: split.platformFee,
    instructor_net: split.instructorNet,
    status: input.status,
    provider: 'mercadopago',
    provider_reference: input.paymentId,
    provider_metadata: input.metadata || {},
  }
}

export async function persistMercadoPagoPayment(input: MercadoPagoPersistInput): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminClient()
  if (!supabase) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }
  }

  const bookingId = resolveBookingId(input)
  const studentId = await resolveStudentIdByEmail(input.payerEmail)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any

  const newSchemaPayload = buildNewSchemaPayload(input, bookingId)
  const oldSchemaPayload = buildOldSchemaPayload(input, bookingId, studentId || bookingId, input.amount)

  const updateNew = await db
    .from('payments')
    .update(newSchemaPayload)
    .eq('provider_payment_id', input.paymentId)
    .select('id')
    .limit(1)
  if (!updateNew.error && updateNew.data?.length) return { ok: true }

  const insertNew = await db.from('payments').insert(newSchemaPayload).select('id').single()
  if (!insertNew.error) return { ok: true }

  const updateOld = await db
    .from('payments')
    .update(oldSchemaPayload)
    .eq('provider_reference', input.paymentId)
    .select('id')
    .limit(1)
  if (!updateOld.error && updateOld.data?.length) return { ok: true }

  const insertOld = await db.from('payments').insert(oldSchemaPayload).select('id').single()
  if (!insertOld.error) return { ok: true }

  return {
    ok: false,
    error: insertOld.error?.message || insertNew.error?.message || 'Falha ao persistir pagamento.',
  }
}

export async function linkMercadoPagoPaymentToBooking(
  input: MercadoPagoPersistInput,
): Promise<{ ok: boolean; error?: string }> {
  const supabase = getAdminClient()
  if (!supabase) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }
  }

  const bookingId = String(input.bookingId || '').trim()
  if (!isUuid(bookingId)) {
    return { ok: false, error: 'bookingId invalido para vincular pagamento.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const bookingLookup = await db
    .from('bookings')
    .select('id, student_id, total_amount, gross_amount, platform_fee, instructor_net')
    .eq('id', bookingId)
    .limit(1)
    .maybeSingle()

  if (bookingLookup.error || !bookingLookup.data?.id) {
    return { ok: false, error: bookingLookup.error?.message || 'Reserva nao encontrada para vincular pagamento.' }
  }

  const booking = bookingLookup.data as BookingSnapshot
  const amount = Number(booking.total_amount || booking.gross_amount || input.amount || 0)
  const paymentMethod = String(input.metadata?.paymentMethod || 'pix') === 'card' ? 'card' : 'pix'
  const split = calculatePaymentSplit(amount, paymentMethod)

  const newSchemaPayload = buildNewSchemaPayload({ ...input, amount, bookingId }, bookingId)
  const oldSchemaPayload = {
    booking_id: bookingId,
    student_id: String(booking.student_id || ''),
    amount,
    platform_fee: Number(booking.platform_fee ?? split.platformFee),
    instructor_net: Number(booking.instructor_net ?? split.instructorNet),
    status: input.status,
    provider: 'mercadopago',
    provider_reference: input.paymentId,
    provider_metadata: input.metadata || {},
  }

  const updateNew = await db
    .from('payments')
    .update(newSchemaPayload)
    .eq('provider_payment_id', input.paymentId)
    .select('id')
    .limit(1)
  if (!updateNew.error && updateNew.data?.length) return { ok: true }

  const insertNew = await db.from('payments').insert(newSchemaPayload).select('id').single()
  if (!insertNew.error) return { ok: true }

  const updateOld = await db
    .from('payments')
    .update(oldSchemaPayload)
    .eq('provider_reference', input.paymentId)
    .select('id')
    .limit(1)
  if (!updateOld.error && updateOld.data?.length) return { ok: true }

  const insertOld = await db.from('payments').insert(oldSchemaPayload).select('id').single()
  if (!insertOld.error) return { ok: true }

  return {
    ok: false,
    error: insertOld.error?.message || insertNew.error?.message || 'Falha ao vincular pagamento a reserva.',
  }
}
