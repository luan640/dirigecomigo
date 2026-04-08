import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendApprovalEmail, sendRejectionEmail } from '@/lib/email'

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

export async function PATCH(req: Request) {
  const auth = await requireAdmin()
  if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status })

  const service = serviceClient()
  if (!service) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })

  const body = await req.json().catch(() => ({}))
  const id = String(body?.id || '').trim()
  const action = String(body?.action || '').trim()
  const reason = String(body?.reason || '').trim()

  if (!id) return NextResponse.json({ error: 'ID obrigatorio.' }, { status: 400 })
  if (action !== 'approve' && action !== 'reject') {
    return NextResponse.json({ error: 'Acao invalida. Use "approve" ou "reject".' }, { status: 400 })
  }
  if (action === 'reject' && !reason) {
    return NextResponse.json({ error: 'Informe o motivo da recusa.' }, { status: 400 })
  }

  const updatePayload =
    action === 'approve'
      ? { status: 'approved', is_active: true, is_verified: true }
      : { status: 'rejected', is_active: false, rejection_reason: reason }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (service as any)
    .from('instructors')
    .update(updatePayload)
    .eq('id', id)
    .select('id,status,is_active,is_verified')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })

  let emailSent = false
  let emailError: string | null = null

  if (action === 'approve' || action === 'reject') {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: profile } = await (service as any)
        .from('profiles')
        .select('email,full_name')
        .eq('id', id)
        .maybeSingle()

      if (profile?.email) {
        const name = String(profile.full_name || 'Instrutor')
        if (action === 'approve') {
          await sendApprovalEmail({ to: String(profile.email), name })
        } else {
          await sendRejectionEmail({ to: String(profile.email), name, reason })
        }
        emailSent = true
      } else {
        emailError = 'O instrutor nao possui e-mail cadastrado no perfil.'
      }
    } catch (err) {
      emailError = (err as Error).message || 'Falha ao enviar e-mail.'
      // E-mail falhou mas a ação já foi salva — não bloqueia a resposta
    }
  }

  return NextResponse.json({ data, error: null, emailSent, emailError })
}
