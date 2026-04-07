import { NextResponse } from 'next/server'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { sendPasswordResetEmail } from '@/lib/email'

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}))
  const email = String(body?.email || '').trim().toLowerCase()

  if (!email) {
    return NextResponse.json({ error: 'E-mail obrigatório.' }, { status: 400 })
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) {
    return NextResponse.json({ error: 'Configuração do servidor incompleta.' }, { status: 500 })
  }

  const supabase = createAdminClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  const origin = req.headers.get('origin') || req.headers.get('referer')?.replace(/\/$/, '').split('/').slice(0, 3).join('/') || ''
  const redirectTo = `${origin}/recuperar-senha/nova-senha`

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase.auth.admin as any).generateLink({
    type: 'recovery',
    email,
    options: { redirectTo },
  })

  if (error) {
    // Retorna sucesso mesmo se o e-mail não existir (evita enumeração de usuários)
    return NextResponse.json({ ok: true })
  }

  const resetLink: string = data?.properties?.action_link ?? data?.action_link ?? ''

  if (resetLink) {
    try {
      // Busca o nome do usuário para personalizar o e-mail
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('email', email)
        .maybeSingle()

      const name = String((profile as { full_name?: string } | null)?.full_name || '').trim() || 'usuário'

      await sendPasswordResetEmail({ to: email, name, resetLink })
    } catch {
      // Falha no envio — não expõe o erro ao cliente
    }
  }

  return NextResponse.json({ ok: true })
}
