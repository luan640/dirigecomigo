import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/server'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

const ALLOWED_STATUSES = new Set(['pending', 'processing', 'paid', 'rejected', 'cancelled'])

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

    if (profile?.role !== 'admin') {
      return NextResponse.json({ error: 'Acesso negado.' }, { status: 403 })
    }

    const service = getServiceClient()
    if (!service) {
      return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY nao configurado.' }, { status: 500 })
    }

    const { id } = await params
    const body = await req.json()
    const status = asString(body?.status).toLowerCase()
    const adminNotes = asString(body?.adminNotes).trim()

    if (!id) {
      return NextResponse.json({ error: 'id obrigatorio.' }, { status: 400 })
    }

    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: 'Status de saque invalido.' }, { status: 400 })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = service as any
    const updatePayload: Record<string, unknown> = {
      status,
      admin_notes: adminNotes || null,
    }

    if (status === 'pending') {
      updatePayload.processed_at = null
      updatePayload.processed_by = null
    } else {
      updatePayload.processed_at = new Date().toISOString()
      updatePayload.processed_by = user.id
    }

    const { data, error } = await db
      .from('payout_requests')
      .update(updatePayload)
      .eq('id', id)
      .select('*')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: error?.message || 'Nao foi possivel atualizar a solicitacao de saque.' }, { status: 500 })
    }

    return NextResponse.json({ data, error: null })
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message || 'Erro ao atualizar saque.' }, { status: 500 })
  }
}
