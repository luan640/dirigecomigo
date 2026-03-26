import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { computePayoutBalances, type PayoutRequestBalanceRow, type WalletPayoutEntry } from '@/lib/payments/payouts'

function toNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
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

    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .maybeSingle() as { data: { role?: string | null } | null; error: Error | null }

    if (profile?.role !== 'instructor') {
      return NextResponse.json({ error: 'Apenas instrutores podem solicitar saque.' }, { status: 403 })
    }

    const body = await req.json()
    const amount = toNumber(body?.amount)
    const notes = asString(body?.notes).trim()

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: 'Informe um valor valido para o saque.' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const [{ data: bookings }, { data: payments }, { data: payoutRequests }] = await Promise.all([
      db
        .from('bookings')
        .select('id,scheduled_date,end_time,status,instructor_net')
        .eq('instructor_id', user.id),
      db
        .from('payments')
        .select('booking_id,status')
        .order('created_at', { ascending: false }),
      db
        .from('payout_requests')
        .select('amount,status')
        .eq('instructor_id', user.id),
    ])

    const bookingMap = new Map(
      (Array.isArray(bookings) ? bookings : []).map((booking: Record<string, unknown>) => [asString(booking.id), booking]),
    )

    const payoutEntries: WalletPayoutEntry[] = (Array.isArray(payments) ? payments : [])
      .map((payment: Record<string, unknown>) => {
        const booking = bookingMap.get(asString(payment.booking_id))
        if (!booking) return null

        return {
          amount: toNumber(booking.instructor_net),
          lessonDate: asString(booking.scheduled_date),
          endTime: asString(booking.end_time),
          bookingStatus: asString(booking.status),
          paymentStatus: asString(payment.status),
        }
      })
      .filter((entry): entry is WalletPayoutEntry => Boolean(entry))

    const balances = computePayoutBalances(
      payoutEntries,
      (Array.isArray(payoutRequests) ? payoutRequests : []).map((request: Record<string, unknown>) => ({
        amount: toNumber(request.amount),
        status: asString(request.status),
      })) as PayoutRequestBalanceRow[],
    )

    if (balances.availableToWithdraw <= 0) {
      return NextResponse.json({ error: 'Voce ainda nao tem saldo disponivel para saque.' }, { status: 400 })
    }

    if (amount > balances.availableToWithdraw) {
      return NextResponse.json({ error: 'O valor solicitado excede o saldo disponivel para saque.' }, { status: 400 })
    }

    const { data, error } = await db
      .from('payout_requests')
      .insert({
        instructor_id: user.id,
        amount,
        status: 'pending',
        notes: notes || null,
      })
      .select('id,amount,status,requested_at')
      .single()

    if (error) {
      return NextResponse.json({ error: error.message || 'Nao foi possivel registrar a solicitacao de saque.' }, { status: 500 })
    }

    return NextResponse.json({
      data,
      error: null,
    })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Erro ao solicitar saque.' }, { status: 500 })
  }
}
