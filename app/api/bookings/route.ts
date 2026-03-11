import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

import { generateScheduleWindow, normalizeWeeklyScheduleSettings } from '@/lib/schedule'
import { getLocalTimestampForDateTime, getSaoPauloNow, getSaoPauloToday, parseDateString } from '@/lib/timezone'

function canManageStatus(status: string) {
  return status === 'pending' || status === 'confirmed'
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

async function getAuthenticatedInstructor() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  return { supabase, user }
}

export async function GET(req: Request) {
  try {
    const { supabase, user } = await getAuthenticatedInstructor()
    if (!user) {
      return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 })
    }

    const url = new URL(req.url)
    const mode = String(url.searchParams.get('mode') || '').trim()
    const bookingId = String(url.searchParams.get('bookingId') || '').trim()

    if (mode !== 'reschedule') {
      return NextResponse.json({ error: 'Modo GET nao suportado.' }, { status: 400 })
    }

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId obrigatorio.' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const today = getSaoPauloToday()
    const now = getSaoPauloNow()
    const bookingLookup = await db
      .from('bookings')
      .select('id, instructor_id, status, scheduled_date, start_time')
      .eq('id', bookingId)
      .limit(1)
      .maybeSingle()

    if (bookingLookup.error || !bookingLookup.data?.id) {
      return NextResponse.json({ error: bookingLookup.error?.message || 'Aula nao encontrada.' }, { status: 404 })
    }

    if (String(bookingLookup.data.instructor_id || '') !== user.id) {
      return NextResponse.json({ error: 'Voce nao pode reagendar esta aula.' }, { status: 403 })
    }

    const [instructorLookup, bookingsResult] = await Promise.all([
      db
        .from('instructors')
        .select('weekly_schedule,min_advance_booking_hours')
        .eq('id', user.id)
        .limit(1)
        .maybeSingle(),
      db
        .from('bookings')
        .select('scheduled_date,start_time,status')
        .eq('instructor_id', user.id)
        .gte('scheduled_date', today),
    ])

    if (instructorLookup.error) {
      return NextResponse.json({ error: instructorLookup.error.message || 'Nao foi possivel carregar configuracao da agenda.' }, { status: 500 })
    }
    if (bookingsResult.error) {
      return NextResponse.json({ error: bookingsResult.error.message || 'Nao foi possivel carregar slots.' }, { status: 500 })
    }

    const minAdvanceHours = Number(instructorLookup.data?.min_advance_booking_hours || 2)
    const minBookingTs = now.getTime() + minAdvanceHours * 60 * 60 * 1000
    const bookedLookup = new Set<string>(
      (Array.isArray(bookingsResult.data) ? bookingsResult.data : [])
        .filter((row: { status?: string; scheduled_date?: string; start_time?: string }) => {
          const status = String(row.status || '')
          return status !== 'cancelled' && status !== 'no_show'
        })
        .map((row: { scheduled_date?: string; start_time?: string }) => {
          const date = String(row.scheduled_date || '').slice(0, 10)
          const time = String(row.start_time || '').slice(0, 5)
          return date && time ? `${date}-${time}` : ''
        })
        .filter(Boolean),
    )

    const currentBookingKey = `${String(bookingLookup.data.scheduled_date || '').slice(0, 10)}-${String(bookingLookup.data.start_time || '').slice(0, 5)}`
    bookedLookup.delete(currentBookingKey)

    const weeklySchedule = normalizeWeeklyScheduleSettings(instructorLookup.data?.weekly_schedule)
    const slots = generateScheduleWindow({
      settings: weeklySchedule,
      bookedLookup,
      startDate: now,
      daysAhead: 60,
    })
      .filter((slot) => getLocalTimestampForDateTime(slot.date, slot.start_time) >= minBookingTs)
      .map((slot) => ({
        id: slot.id,
        date: slot.date,
        start_time: slot.start_time,
        end_time: slot.end_time,
      }))

    return NextResponse.json({ data: { slots }, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao carregar slots.' }, { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { supabase, user } = await getAuthenticatedInstructor()
    if (!user) {
      return NextResponse.json({ error: 'Sessao expirada.' }, { status: 401 })
    }

    const body = await req.json()
    const mode = String(body?.mode || '').trim()
    if (mode !== 'reschedule' && mode !== 'complete') {
      return NextResponse.json({ error: 'Modo POST nao suportado.' }, { status: 400 })
    }

    const bookingId = String(body?.bookingId || '').trim()

    if (!bookingId) {
      return NextResponse.json({ error: 'bookingId obrigatorio.' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const bookingLookup = await db
      .from('bookings')
      .select('id, instructor_id, status, availability_slot_id, scheduled_date, start_time, end_time')
      .eq('id', bookingId)
      .limit(1)
      .maybeSingle()

    if (bookingLookup.error || !bookingLookup.data?.id) {
      return NextResponse.json({ error: bookingLookup.error?.message || 'Aula nao encontrada.' }, { status: 404 })
    }

    if (String(bookingLookup.data.instructor_id || '') !== user.id) {
      return NextResponse.json({ error: 'Voce nao pode reagendar esta aula.' }, { status: 403 })
    }

    if (!canManageStatus(String(bookingLookup.data.status || ''))) {
      return NextResponse.json({ error: mode === 'complete' ? 'Esta aula nao pode mais ser finalizada.' : 'Esta aula nao pode mais ser reagendada.' }, { status: 400 })
    }

    if (mode === 'complete') {
      const lessonEndTs = getLocalTimestampForDateTime(
        String(bookingLookup.data.scheduled_date || ''),
        String(bookingLookup.data.end_time || bookingLookup.data.start_time || ''),
      )
      if (Number.isNaN(lessonEndTs)) {
        return NextResponse.json({ error: 'Horário da aula inválido.' }, { status: 400 })
      }

      if (lessonEndTs > getSaoPauloNow().getTime()) {
        return NextResponse.json({ error: 'A aula ainda não terminou para ser finalizada.' }, { status: 400 })
      }

      const completeResult = await db
        .from('bookings')
        .update({ status: 'completed' })
        .eq('id', bookingId)
        .select('id')
        .single()

      if (completeResult.error) {
        return NextResponse.json({ error: completeResult.error.message || 'Nao foi possivel finalizar a aula.' }, { status: 500 })
      }

      return NextResponse.json({ data: { ok: true }, error: null })
    }

    const slotId = String(body?.slotId || '').trim()
    if (!slotId) {
      return NextResponse.json({ error: 'slotId obrigatorio para reagendamento.' }, { status: 400 })
    }

    const requestedDate = String(body?.date || '').slice(0, 10)
    const requestedStartTime = String(body?.start_time || '').slice(0, 8)
    const requestedEndTime = String(body?.end_time || '').slice(0, 8)

    const slotLookup = isUuid(slotId)
      ? await db
          .from('instructor_availability')
          .select('id, instructor_id, date, start_time, end_time, is_booked')
          .eq('id', slotId)
          .limit(1)
          .maybeSingle()
      : null

    if (slotLookup && (slotLookup.error || !slotLookup.data?.id)) {
      return NextResponse.json({ error: slotLookup.error?.message || 'Slot nao encontrado.' }, { status: 404 })
    }

    if (slotLookup && String(slotLookup.data.instructor_id || '') !== user.id) {
      return NextResponse.json({ error: 'Slot invalido para este instrutor.' }, { status: 403 })
    }

    if (slotLookup?.data?.is_booked) {
      return NextResponse.json({ error: 'Este horário acabou de ser ocupado. Escolha outro.' }, { status: 409 })
    }

    const nextDate = slotLookup?.data?.date || requestedDate
    const nextStartTime = slotLookup?.data?.start_time || requestedStartTime
    const nextEndTime = slotLookup?.data?.end_time || requestedEndTime
    if (!nextDate || !nextStartTime || !nextEndTime) {
      return NextResponse.json({ error: 'Dados do novo horário estão incompletos.' }, { status: 400 })
    }

    if (!slotLookup) {
      const [instructorLookup, bookingsResult] = await Promise.all([
        db
          .from('instructors')
          .select('weekly_schedule')
          .eq('id', user.id)
          .limit(1)
          .maybeSingle(),
        db
          .from('bookings')
          .select('scheduled_date,start_time,status')
          .eq('instructor_id', user.id)
          .eq('scheduled_date', nextDate),
      ])

      if (instructorLookup.error) {
        return NextResponse.json({ error: instructorLookup.error.message || 'Não foi possível validar a agenda.' }, { status: 500 })
      }
      if (bookingsResult.error) {
        return NextResponse.json({ error: bookingsResult.error.message || 'Não foi possivel validar o horário.' }, { status: 500 })
      }

      const bookedLookup = new Set<string>(
        (Array.isArray(bookingsResult.data) ? bookingsResult.data : [])
          .filter((row: { status?: string; scheduled_date?: string; start_time?: string }) => {
            const status = String(row.status || '')
            return status !== 'cancelled' && status !== 'no_show'
          })
          .map((row: { scheduled_date?: string; start_time?: string }) => {
            const date = String(row.scheduled_date || '').slice(0, 10)
            const time = String(row.start_time || '').slice(0, 5)
            return date && time ? `${date}-${time}` : ''
          })
          .filter(Boolean),
      )
      bookedLookup.delete(`${String(bookingLookup.data.scheduled_date || '').slice(0, 10)}-${String(bookingLookup.data.start_time || '').slice(0, 5)}`)

      const weeklySchedule = normalizeWeeklyScheduleSettings(instructorLookup.data?.weekly_schedule)
      const allowedSlot = generateScheduleWindow({
        settings: weeklySchedule,
        bookedLookup,
        startDate: parseDateString(nextDate),
        daysAhead: 0,
      }).find((slot) => slot.date === nextDate && slot.start_time === nextStartTime)

      if (!allowedSlot || allowedSlot.end_time !== nextEndTime) {
        return NextResponse.json({ error: 'Este horário não esta mais disponível na agenda semanal.' }, { status: 409 })
      }
    }

    const updatePayload = {
      scheduled_date: nextDate,
      start_time: nextStartTime,
      end_time: nextEndTime,
      availability_slot_id: slotLookup?.data?.id || null,
      status: 'confirmed',
    }

    const updateResult = await db.from('bookings').update(updatePayload).eq('id', bookingId).select('id').single()
    if (updateResult.error) {
      return NextResponse.json({ error: updateResult.error.message || 'Nao foi possivel reagendar a aula.' }, { status: 500 })
    }

    const oldSlotId = String(bookingLookup.data.availability_slot_id || '').trim()
    if (oldSlotId && oldSlotId !== slotId && isUuid(oldSlotId)) {
      await db.from('instructor_availability').update({ is_booked: false }).eq('id', oldSlotId)
    }

    if (slotLookup?.data?.id) {
      await db.from('instructor_availability').update({ is_booked: true }).eq('id', slotLookup.data.id)
    }

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao reagendar aula.' }, { status: 500 })
  }
}
