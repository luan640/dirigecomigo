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
    const body = await req.json()
    const code = String(body?.code || '').trim().toUpperCase()
    const amount = Number(body?.amount || 0)
    if (!code) return NextResponse.json({ error: 'Codigo obrigatorio.' }, { status: 400 })
    if (!amount || amount <= 0) return NextResponse.json({ error: 'Valor invalido.' }, { status: 400 })

    const service = serviceClient()
    if (!service) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: coupon, error } = await (service as any)
      .from('coupons')
      .select('*')
      .eq('code', code)
      .maybeSingle()

    if (error) return NextResponse.json({ error: error.message }, { status: 400 })
    if (!coupon) return NextResponse.json({ error: 'Cupom nao encontrado.' }, { status: 404 })
    if (!coupon.is_active) return NextResponse.json({ error: 'Cupom inativo.' }, { status: 400 })

    const now = new Date()
    if (coupon.starts_at && new Date(coupon.starts_at).getTime() > now.getTime()) {
      return NextResponse.json({ error: 'Cupom ainda nao vigente.' }, { status: 400 })
    }
    if (coupon.ends_at && new Date(coupon.ends_at).getTime() < now.getTime()) {
      return NextResponse.json({ error: 'Cupom expirado.' }, { status: 400 })
    }
    if (coupon.max_uses !== null && coupon.max_uses !== undefined && Number(coupon.used_count || 0) >= Number(coupon.max_uses)) {
      return NextResponse.json({ error: 'Limite de uso do cupom atingido.' }, { status: 400 })
    }

    const minAmount = Number(coupon.min_amount || 0)
    if (amount < minAmount) {
      return NextResponse.json({ error: `Valor minimo para cupom: R$ ${minAmount.toFixed(2)}` }, { status: 400 })
    }

    const value = Number(coupon.value || 0)
    const discount =
      coupon.discount_type === 'percent'
        ? Math.min(amount, Math.round((amount * value / 100) * 100) / 100)
        : Math.min(amount, value)
    const finalAmount = Math.max(0, Math.round((amount - discount) * 100) / 100)

    return NextResponse.json({
      data: {
        coupon_id: coupon.id,
        code: coupon.code,
        discount_amount: discount,
        final_amount: finalAmount,
      },
      error: null,
    })
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message || 'Erro ao validar cupom.' }, { status: 500 })
  }
}
