import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'

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
    .maybeSingle()

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
    .from('coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data: data || [], error: null })
}

export async function POST(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = serviceClient()
  if (!service) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })

  const body = await req.json()
  const code = String(body?.code || '').trim().toUpperCase()
  const discountType = String(body?.discount_type || '').trim()
  const value = Number(body?.value || 0)
  const minAmount = Number(body?.min_amount || 0)
  const maxUses = body?.max_uses !== undefined && body?.max_uses !== null ? Number(body.max_uses) : null
  const startsAt = body?.starts_at ? new Date(String(body.starts_at)).toISOString() : null
  const endsAt = body?.ends_at ? new Date(String(body.ends_at)).toISOString() : null

  if (!code) return NextResponse.json({ error: 'Codigo obrigatorio.' }, { status: 400 })
  if (!(discountType === 'percent' || discountType === 'fixed')) {
    return NextResponse.json({ error: 'Tipo de desconto invalido.' }, { status: 400 })
  }
  if (!value || value <= 0) return NextResponse.json({ error: 'Valor do desconto invalido.' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('coupons')
    .insert({
      code,
      discount_type: discountType,
      value,
      min_amount: minAmount,
      max_uses: maxUses,
      used_count: 0,
      starts_at: startsAt,
      ends_at: endsAt,
      is_active: true,
      created_by: auth.userId,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = serviceClient()
  if (!service) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })

  const body = await req.json()
  const id = String(body?.id || '')
  const isActive = Boolean(body?.is_active)
  if (!id) return NextResponse.json({ error: 'ID obrigatorio.' }, { status: 400 })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('coupons')
    .update({ is_active: isActive, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json({ data, error: null })
}
