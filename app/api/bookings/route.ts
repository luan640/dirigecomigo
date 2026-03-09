import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function canManageStatus(status: string) {
  return status === 'pending' || status === 'confirmed'
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
    const bookingLookup = await db
      .from('bookings')
      .select('id, instructor_id, status')
      .eq('id', bookingId)
      .limit(1)
      .maybeSingle()

    if (bookingLookup.error || !bookingLookup.data?.id) {
      return NextResponse.json({ error: bookingLookup.error?.message || 'Aula nao encontrada.' }, { status: 404 })
    }

    if (String(bookingLookup.data.instructor_id || '') !== user.id) {
      return NextResponse.json({ error: 'Voce nao pode reagendar esta aula.' }, { status: 403 })
    }

    const slotsResult = await db
      .from('instructor_availability')
      .select('id, date, start_time, end_time')
      .eq('instructor_id', user.id)
      .eq('is_booked', false)
      .gte('date', new Date().toISOString().slice(0, 10))
      .order('date', { ascending: true })
      .order('start_time', { ascending: true })

    if (slotsResult.error) {
      return NextResponse.json({ error: slotsResult.error.message || 'Nao foi possivel carregar slots.' }, { status: 500 })
    }

    return NextResponse.json({ data: { slots: slotsResult.data || [] }, error: null })
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
      const lessonEnd = new Date(`${String(bookingLookup.data.scheduled_date || '')}T${String(bookingLookup.data.end_time || bookingLookup.data.start_time || '')}`)
      if (Number.isNaN(lessonEnd.getTime())) {
        return NextResponse.json({ error: 'Horario da aula invalido.' }, { status: 400 })
      }

      if (lessonEnd.getTime() > Date.now()) {
        return NextResponse.json({ error: 'A aula ainda nao terminou para ser finalizada.' }, { status: 400 })
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

    const slotLookup = await db
      .from('instructor_availability')
      .select('id, instructor_id, date, start_time, end_time, is_booked')
      .eq('id', slotId)
      .limit(1)
      .maybeSingle()

    if (slotLookup.error || !slotLookup.data?.id) {
      return NextResponse.json({ error: slotLookup.error?.message || 'Slot nao encontrado.' }, { status: 404 })
    }

    if (String(slotLookup.data.instructor_id || '') !== user.id) {
      return NextResponse.json({ error: 'Slot invalido para este instrutor.' }, { status: 403 })
    }

    if (slotLookup.data.is_booked) {
      return NextResponse.json({ error: 'Este horario acabou de ser ocupado. Escolha outro.' }, { status: 409 })
    }

    const updatePayload = {
      scheduled_date: slotLookup.data.date,
      start_time: slotLookup.data.start_time,
      end_time: slotLookup.data.end_time,
      availability_slot_id: slotLookup.data.id,
      status: 'confirmed',
    }

    const updateResult = await db.from('bookings').update(updatePayload).eq('id', bookingId).select('id').single()
    if (updateResult.error) {
      return NextResponse.json({ error: updateResult.error.message || 'Nao foi possivel reagendar a aula.' }, { status: 500 })
    }

    const oldSlotId = String(bookingLookup.data.availability_slot_id || '').trim()
    if (oldSlotId && oldSlotId !== slotId) {
      await db.from('instructor_availability').update({ is_booked: false }).eq('id', oldSlotId)
    }

    await db.from('instructor_availability').update({ is_booked: true }).eq('id', slotId)

    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao reagendar aula.' }, { status: 500 })
  }
}
