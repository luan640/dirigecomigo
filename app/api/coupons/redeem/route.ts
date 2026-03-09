import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

function serviceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function POST(req: Request) {
  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    if (!authData.user) return NextResponse.json({ error: 'Nao autenticado.' }, { status: 401 })

    const body = await req.json()
    const code = String(body?.code || '').trim().toUpperCase()
    if (!code) return NextResponse.json({ error: 'Codigo obrigatorio.' }, { status: 400 })

    const service = serviceClient()
    if (!service) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = service as any
    const { data: coupon } = await db.from('coupons').select('*').eq('code', code).maybeSingle()
    if (!coupon) return NextResponse.json({ error: 'Cupom nao encontrado.' }, { status: 404 })

    const usedCount = Number(coupon.used_count || 0) + 1
    const { error } = await db
      .from('coupons')
      .update({ used_count: usedCount, updated_at: new Date().toISOString() })
      .eq('id', coupon.id)

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    return NextResponse.json({ data: { ok: true }, error: null })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao registrar uso do cupom.' }, { status: 500 })
  }
}
