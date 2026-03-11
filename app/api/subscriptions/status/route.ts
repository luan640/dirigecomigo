import { NextResponse } from 'next/server'

import {
  findLatestMercadoPagoPreapproval,
  getMercadoPagoSubscriptionClient,
  syncPreapprovalToSubscription,
} from '@/lib/payments/mercadoPagoSubscription'

type SubscriptionStatusRow = {
  amount?: number | null
  provider?: string | null
  provider_sub_id?: string | null
  status?: string | null
}

export async function GET() {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = supabase as any
    const { data, error } = (await db
      .from('subscriptions')
      .select('*')
      .eq('instructor_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()) as { data: SubscriptionStatusRow | null; error: Error | null }

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })

    try {
      if (data?.provider_sub_id) {
        const client = getMercadoPagoSubscriptionClient()
        const remote = await client.get({ id: String(data.provider_sub_id) })
        const synced = await syncPreapprovalToSubscription({
          db,
          preapproval: remote as unknown as Record<string, unknown>,
          fallbackInstructorId: user.id,
          fallbackAmount: Number(data.amount || 15),
        })

        if (!synced.error) {
          return NextResponse.json({ data: synced.data || data, error: null })
        }
      }

      if (user.email && (!data || data.status === 'cancelled' || data.status === 'expired')) {
        const remote = await findLatestMercadoPagoPreapproval({
          payerEmail: user.email,
          externalReference: user.id,
        })

        if (remote) {
          const synced = await syncPreapprovalToSubscription({
            db,
            preapproval: remote as unknown as Record<string, unknown>,
            fallbackInstructorId: user.id,
            fallbackAmount: Number(data?.amount || 15),
          })

          if (!synced.error) {
            return NextResponse.json({ data: synced.data || data, error: null })
          }
        }
      }
    } catch {
      // Preserve local state if Mercado Pago is unavailable.
    }

    return NextResponse.json({ data: data || null, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao buscar assinatura.' }, { status: 500 })
  }
}
