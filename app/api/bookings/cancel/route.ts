import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

const WHATSAPP_PHONE = '5585999012483'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !serviceRole) return null

  return createAdminClient(url, serviceRole, {
    auth: { persistSession: false, autoRefreshToken: false },
  })
}

function isCancellableStatus(status: string) {
  return status === 'pending' || status === 'confirmed'
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
    const reason = String(body?.reason || '').trim()

    if (!bookingId || !reason) {
      return NextResponse.json({ error: 'bookingId e motivo sao obrigatorios.' }, { status: 400 })
    }

    const service = getServiceClient()
    if (!service) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = service as any
    const bookingLookup = await db
      .from('bookings')
      .select('id, student_id, instructor_id, status, scheduled_date, start_time, availability_slot_id')
      .eq('id', bookingId)
      .limit(1)
      .maybeSingle()

    if (bookingLookup.error || !bookingLookup.data?.id) {
      return NextResponse.json({ error: bookingLookup.error?.message || 'Aula nao encontrada.' }, { status: 404 })
    }

    const booking = bookingLookup.data as Record<string, unknown>
    if (String(booking.student_id || '') !== user.id) {
      return NextResponse.json({ error: 'Voce nao pode cancelar esta aula.' }, { status: 403 })
    }

    const status = String(booking.status || '')
    if (!isCancellableStatus(status)) {
      return NextResponse.json({ error: 'Esta aula nao pode mais ser cancelada.' }, { status: 400 })
    }

    const rawDate = String(booking.scheduled_date || '')
    const rawStartTime = String(booking.start_time || '')
    if (rawDate && rawStartTime) {
      const lessonStart = new Date(`${rawDate}T${rawStartTime}`)
      if (lessonStart.getTime() <= Date.now()) {
        return NextResponse.json({ error: 'Nao e possivel cancelar uma aula ja iniciada.' }, { status: 400 })
      }
    }

    const updatePayloadNew = {
      status: 'cancelled',
      cancelled_by: user.id,
      cancellation_reason: reason,
    }
    const updatePayloadOld = {
      status: 'cancelled',
      notes: `Cancelado pelo aluno. Motivo: ${reason}`,
    }

    const tryUpdateNew = await db.from('bookings').update(updatePayloadNew).eq('id', bookingId).select('id').single()
    if (tryUpdateNew.error) {
      const tryUpdateOld = await db.from('bookings').update(updatePayloadOld).eq('id', bookingId).select('id').single()
      if (tryUpdateOld.error) {
        return NextResponse.json(
          { error: tryUpdateOld.error.message || tryUpdateNew.error.message || 'Falha ao cancelar aula.' },
          { status: 500 },
        )
      }
    }

    const slotId = String(booking.availability_slot_id || '').trim()
    if (slotId) {
      await db.from('instructor_availability').update({ is_booked: false }).eq('id', slotId)
    }

    const whatsappText = `Olá quero cancelar a aula (${bookingId}), por motivo (${reason}).`
    const whatsappUrl = `https://wa.me/${WHATSAPP_PHONE}?text=${encodeURIComponent(whatsappText)}`

    return NextResponse.json({ data: { ok: true, whatsappUrl }, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao cancelar aula.' }, { status: 500 })
  }
}
