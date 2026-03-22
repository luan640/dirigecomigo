import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { normalizePlatformPricingSettings } from '@/lib/platformPricing'

type AdminRoleLookup = {
  role?: string | null
}

async function requireAdmin() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return { ok: false as const, status: 401, error: 'Nao autenticado.' }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle() as { data: AdminRoleLookup | null; error: Error | null }

  if (profile?.role !== 'admin') return { ok: false as const, status: 403, error: 'Acesso negado.' }
  return { ok: true as const, userId: user.id }
}

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function GET() {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = serviceClient()
  if (!service) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('subscriptions')
    .select('*')
    .order('updated_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: data || [], error: null })
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = serviceClient()
  if (!service) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })

  const scope = new URL(req.url).searchParams.get('scope')
  if (scope === 'platform-settings') {
    const body = await req.json().catch(() => ({}))
    const settings = normalizePlatformPricingSettings({
      platform_fee_percent: body?.platform_fee_percent,
      pix_fee_percent: body?.pix_fee_percent,
      card_fee_percent: body?.card_fee_percent,
      subscription_price: body?.subscription_price,
    })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (service as any)
      .from('platform_settings')
      .upsert({
        key: 'default',
        platform_fee_percent: settings.platform_fee_percent,
        pix_fee_percent: settings.pix_fee_percent,
        card_fee_percent: settings.card_fee_percent,
        subscription_price: settings.subscription_price,
      })
      .select('platform_fee_percent,pix_fee_percent,card_fee_percent,subscription_price')
      .single()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data: normalizePlatformPricingSettings(data), error: null })
  }

  const body = await req.json().catch(() => ({}))
  const id = String(body?.id || '').trim()
  const currentPeriodEnd = String(body?.current_period_end || '').trim()

  if (!id) return NextResponse.json({ error: 'ID obrigatorio.' }, { status: 400 })
  if (!/^\d{4}-\d{2}-\d{2}$/.test(currentPeriodEnd)) {
    return NextResponse.json({ error: 'Data limite invalida. Use o formato YYYY-MM-DD.' }, { status: 400 })
  }

  const today = new Date().toISOString().slice(0, 10)
  const nextStatus = currentPeriodEnd >= today ? 'active' : 'expired'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('subscriptions')
    .update({
      current_period_end: currentPeriodEnd,
      status: nextStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}
