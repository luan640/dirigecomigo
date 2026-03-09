import { NextResponse } from 'next/server'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

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
      .in('status', ['active', 'trial'])
      .order('updated_at', { ascending: false })

    if (subsError) {
      return NextResponse.json({ error: subsError.message }, { status: 400 })
    }

    const activeSubs: Record<string, unknown>[] = Array.isArray(currentSubs) ? currentSubs : []
    if (!activeSubs.length) {
      return NextResponse.json({ data: null, error: null })
    }

    const mpSubs = activeSubs.filter(
      row => row.provider === 'mercadopago' && row.provider_sub_id,
    )
    if (mpSubs.length) {
      const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!accessToken) {
        return NextResponse.json({ error: 'MERCADOPAGO_ACCESS_TOKEN nao configurado.' }, { status: 500 })
      }

      const client = new MercadoPagoConfig({ accessToken })
      const preapprovalClient = new PreApproval(client)
      for (const row of mpSubs) {
        try {
          await preapprovalClient.update({
            id: String(row.provider_sub_id),
            body: { status: 'cancelled' },
          })
        } catch (err) {
          const message = String((err as Error)?.message || '')
          const ignorable = message.includes('404') || message.toLowerCase().includes('not found')
          if (!ignorable) {
            return NextResponse.json({ error: `Falha ao cancelar no Mercado Pago: ${message}` }, { status: 400 })
          }
        }
      }
    }

    const subIds = activeSubs
      .map(row => String(row.id || ''))
      .filter(Boolean)

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
