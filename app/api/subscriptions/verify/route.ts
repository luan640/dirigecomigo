import { NextResponse } from 'next/server'

import {
  findLatestMercadoPagoPreapproval,
  getMercadoPagoSubscriptionClient,
  syncPreapprovalToSubscription,
} from '@/lib/payments/mercadoPagoSubscription'

export async function GET(req: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

    const preapprovalId = new URL(req.url).searchParams.get('preapproval_id')

    let preapproval: Record<string, unknown> | null = null
    if (preapprovalId) {
      const client = getMercadoPagoSubscriptionClient()
      preapproval = (await client.get({ id: preapprovalId })) as unknown as Record<string, unknown>
    } else if (user.email) {
      preapproval = (await findLatestMercadoPagoPreapproval({
        payerEmail: user.email,
        externalReference: user.id,
      })) as unknown as Record<string, unknown> | null
    }

    if (!preapproval) {
      return NextResponse.json({ data: null, error: null })
    }

    const synced = await syncPreapprovalToSubscription({
      db: supabase,
      preapproval,
      fallbackInstructorId: user.id,
      fallbackAmount: 15,
    })

    if (synced.error) {
      return NextResponse.json({ error: synced.error }, { status: 400 })
    }

    return NextResponse.json({ data: synced.data, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao verificar checkout.' }, { status: 500 })
  }
}
