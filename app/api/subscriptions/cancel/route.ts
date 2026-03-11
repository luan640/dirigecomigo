import { NextResponse } from 'next/server'

import { getMercadoPagoSubscriptionClient, syncPreapprovalToSubscription } from '@/lib/payments/mercadoPagoSubscription'

type ActiveSubscriptionRow = {
  amount?: number | null
  id?: string | null
  provider_sub_id?: string | null
}

export async function POST() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const nowIso = new Date().toISOString()
    const { data: currentSubs, error: subsError } = await db
      .from('subscriptions')
      .select('*')
      .eq('instructor_id', user.id)
      .in('status', ['active', 'pending'])
      .order('updated_at', { ascending: false })

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 400 })
    }

    const activeSubs: ActiveSubscriptionRow[] = Array.isArray(currentSubs) ? currentSubs : []
    if (!activeSubs.length) {
      return NextResponse.json({ data: null, error: null })
    }

    const mpClient = getMercadoPagoSubscriptionClient()

    for (const row of activeSubs) {
      const providerSubId = String(row.provider_sub_id || '').trim()
      if (!providerSubId) continue

      try {
        const cancelledPreapproval = await mpClient.update({
          id: providerSubId,
          body: { status: 'cancelled' },
        })

        const synced = await syncPreapprovalToSubscription({
          db,
          preapproval: cancelledPreapproval as unknown as Record<string, unknown>,
          fallbackInstructorId: user.id,
          fallbackAmount: Number(row.amount || 15),
        })

        if (synced.error) {
          return NextResponse.json({ error: synced.error }, { status: 400 })
        }
      } catch (err) {
        const message = String((err as Error)?.message || '')
        return NextResponse.json({ error: `Falha ao cancelar no Mercado Pago: ${message}` }, { status: 400 })
      }
    }

    const subIds = activeSubs.map((row) => String(row.id || '')).filter(Boolean)
    const tryNew = await db
      .from('subscriptions')
      .update({ status: 'cancelled', cancelled_at: nowIso, updated_at: nowIso })
      .in('id', subIds)
      .select('*')

    if (!tryNew.error && tryNew.data?.length) {
      return NextResponse.json({ data: tryNew.data[0], error: null })
    }

    return NextResponse.json({ data: null, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao cancelar assinatura.' }, { status: 500 })
  }
}
