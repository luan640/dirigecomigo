import { NextResponse } from 'next/server'
import { addDays, format } from 'date-fns'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { linkMercadoPagoPaymentToBooking } from '@/lib/payments/mercadoPagoPersistence'
import { createClient } from '@/lib/supabase/server'

const ALLOWED_STATUSES = new Set(['pending', 'processing', 'paid', 'failed', 'refunded'])
const LOOKAHEAD_DAYS = 90

type BookingRow = {
  id?: string
  student_id?: string
  instructor_id?: string
  scheduled_date?: string
  start_time?: string
  status?: string
}

type AvailabilityRow = {
  date?: string
  start_time?: string
  end_time?: string
  is_booked?: boolean
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function parseDateOnly(value: string) {
  return new Date(`${value}T00:00:00`)
}

function isBookableStatus(status: string) {
  return status !== 'cancelled' && status !== 'no_show'
}

async function backfillAvailabilityForBooking(booking: BookingRow) {
  const instructorId = String(booking.instructor_id || '').trim()
  const scheduledDate = String(booking.scheduled_date || '').slice(0, 10)
  if (!instructorId || !scheduledDate) {
    return { ok: true, skipped: true as const }
  }

  const service = getServiceClient()
  if (!service) {
    return { ok: false, error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = service as any
  const today = format(new Date(), 'yyyy-MM-dd')
  const endDate = format(addDays(new Date(), LOOKAHEAD_DAYS), 'yyyy-MM-dd')
  const weekday = parseDateOnly(scheduledDate).getDay()

  const availabilityLookup = await db
    .from('instructor_availability')
    .select('date,start_time,end_time,is_booked')
    .eq('instructor_id', instructorId)
    .gte('date', today)
    .lte('date', endDate)
    .order('date', { ascending: true })
    .order('start_time', { ascending: true })

  const availabilityRows = (Array.isArray(availabilityLookup.data) ? availabilityLookup.data : []) as AvailabilityRow[]
  const weekdayRows = availabilityRows.filter(row => {
    const date = String(row.date || '').slice(0, 10)
    return date ? parseDateOnly(date).getDay() === weekday : false
  })

  if (weekdayRows.length === 0) {
    return { ok: true, skipped: true as const }
  }

  const templateDate = weekdayRows.reduce((latest, row) => {
    const date = String(row.date || '').slice(0, 10)
    return date > latest ? date : latest
  }, '')

  if (!templateDate) {
    return { ok: true, skipped: true as const }
  }

  const targetDate = format(addDays(parseDateOnly(templateDate), 7), 'yyyy-MM-dd')
  const templateRows = weekdayRows.filter(row => String(row.date || '').slice(0, 10) === templateDate)
  const targetRows = availabilityRows.filter(row => String(row.date || '').slice(0, 10) === targetDate)
  const existingStartTimes = new Set(targetRows.map(row => String(row.start_time || '').slice(0, 5)).filter(Boolean))

  const bookingsLookup = await db
    .from('bookings')
    .select('scheduled_date,start_time,status')
    .eq('instructor_id', instructorId)
    .eq('scheduled_date', targetDate)

  const bookedTimes = new Set(
    (Array.isArray(bookingsLookup.data) ? bookingsLookup.data : [])
      .filter((row: BookingRow) => isBookableStatus(String(row.status || '')))
      .map((row: BookingRow) => String(row.start_time || '').slice(0, 5))
      .filter(Boolean),
  )

  const rowsToInsert = templateRows
    .map(row => {
      const startTime = String(row.start_time || '').slice(0, 8)
      const endTime = String(row.end_time || '').slice(0, 8)
      const startKey = startTime.slice(0, 5)
      if (!startTime || !endTime || existingStartTimes.has(startKey)) return null
      return {
        instructor_id: instructorId,
        date: targetDate,
        start_time: startTime,
        end_time: endTime,
        is_booked: bookedTimes.has(startKey),
      }
    })
    .filter(Boolean)

  if (rowsToInsert.length === 0) {
    return { ok: true, skipped: true as const }
  }

  const upsertResult = await db
    .from('instructor_availability')
    .upsert(rowsToInsert, { onConflict: 'instructor_id,date,start_time' })

  if (upsertResult.error) {
    return { ok: false, error: upsertResult.error.message }
  }

  return { ok: true, created: rowsToInsert.length, targetDate }
}

export async function POST(req: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 })
    }

    const body = await req.json()
    const bookingId = String(body?.bookingId || '').trim()
    const intent = String(body?.intent || 'link-payment').trim()
    const paymentId = String(body?.paymentId || '').trim()
    const amount = Number(body?.amount || 0)
    const currency = String(body?.currency || 'BRL').trim().toUpperCase()
    const rawStatus = String(body?.status || 'pending').trim().toLowerCase()
    const status = ALLOWED_STATUSES.has(rawStatus) ? rawStatus : 'pending'
    const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {}

    if (!bookingId || !paymentId || amount <= 0) {
      return NextResponse.json({ error: 'bookingId, paymentId e amount sao obrigatorios.' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const bookingLookup = await db
      .from('bookings')
      .select('id, student_id, instructor_id, scheduled_date, start_time, status')
      .eq('id', bookingId)
      .limit(1)
      .maybeSingle()

    if (bookingLookup.error || !bookingLookup.data?.id) {
      return NextResponse.json({ error: bookingLookup.error?.message || 'Reserva nao encontrada.' }, { status: 404 })
    }

    if (String(bookingLookup.data.student_id || '') !== user.id) {
      return NextResponse.json({ error: 'Voce nao pode vincular pagamentos desta reserva.' }, { status: 403 })
    }

    if (intent === 'backfill-availability') {
      const result = await backfillAvailabilityForBooking(bookingLookup.data as BookingRow)
      if (!result.ok) {
        return NextResponse.json({ error: result.error || 'Falha ao atualizar agenda.' }, { status: 500 })
      }
      return NextResponse.json({ data: result, error: null })
    }

    const result = await linkMercadoPagoPaymentToBooking({
      bookingId,
      paymentId,
      amount,
      currency,
      status: status as 'pending' | 'processing' | 'paid' | 'failed' | 'refunded',
      metadata: metadata as Record<string, unknown>,
      payerEmail: user.email,
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error || 'Falha ao vincular pagamento.' }, { status: 500 })
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao vincular pagamento.' }, { status: 500 })
  }
}
