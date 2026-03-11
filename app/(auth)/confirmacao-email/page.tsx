'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { CheckCircle2, Loader2, MailWarning } from 'lucide-react'

import { createClient } from '@/lib/supabase/client'

type ConfirmationState = 'loading' | 'success' | 'error'

async function resolveConfirmedState() {
  const supabase = createClient()
  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  return Boolean(user && user.email_confirmed_at)
}

function ConfirmacaoEmailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [state, setState] = useState<ConfirmationState>('loading')

  const code = String(searchParams.get('code') || '').trim()
  const tokenHash = String(searchParams.get('token_hash') || '').trim()
  const type = String(searchParams.get('type') || '').trim()
  const status = String(searchParams.get('status') || '').trim()

  const shouldConfirm = !!code || (!!tokenHash && !!type)

  useEffect(() => {
    if (!shouldConfirm) {
      setState(status === 'erro' ? 'error' : 'success')
      return
    }

    let cancelled = false

    const run = async () => {
      try {
        const supabase = createClient()

        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code)
          if (error) throw error
        } else if (tokenHash && type) {
          const { error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as 'signup' | 'invite' | 'magiclink' | 'recovery' | 'email_change' | 'email',
          })
          if (error) throw error
        }

        if (cancelled) return
        setState('success')
        router.replace('/confirmacao-email?status=sucesso')
      } catch {
        const isAlreadyConfirmed = await resolveConfirmedState()
        if (cancelled) return
        if (isAlreadyConfirmed) {
          setState('success')
          router.replace('/confirmacao-email?status=sucesso')
          return
        }

        if (cancelled) return
        setState('error')
        router.replace('/confirmacao-email?status=erro')
      }
    }

    void run()

    return () => {
      cancelled = true
    }
  }, [code, router, shouldConfirm, status, tokenHash, type])

  const content = useMemo(() => {
    if (state === 'loading') {
      return {
        iconWrapperClassName: 'bg-blue-100',
        icon: <Loader2 className="h-9 w-9 animate-spin text-blue-600" />,
        title: 'Confirmando seu e-mail',
        description: 'Estamos validando seu link de confirmacao.',
      }
    }

    if (state === 'success') {
      return {
        iconWrapperClassName: 'bg-emerald-100',
        icon: <CheckCircle2 className="h-9 w-9 text-emerald-600" />,
        title: 'E-mail confirmado com sucesso',
        description: 'Sua conta foi ativada. Agora voce pode entrar na plataforma e continuar o cadastro.',
      }
    }

    return {
      iconWrapperClassName: 'bg-amber-100',
      icon: <MailWarning className="h-9 w-9 text-amber-600" />,
      title: 'Nao foi possivel confirmar seu e-mail',
      description: 'O link de confirmacao pode ter expirado ou ja ter sido usado. Tente entrar ou solicite um novo e-mail.',
    }
  }, [state])

  return (
    <div className="py-6 text-center">
      <div className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full ${content.iconWrapperClassName}`}>
        {content.icon}
      </div>

      <h1 className="mb-2 text-2xl font-bold text-gray-900">
        {content.title}
      </h1>

      <p className="mb-6 text-sm text-gray-500">
        {content.description}
      </p>

      <Link
        href="/entrar"
        className="inline-flex items-center justify-center rounded-xl bg-blue-700 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
      >
        Entrar
      </Link>
    </div>
  )
}

export default function ConfirmacaoEmailPage() {
  return (
    <Suspense
      fallback={
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
            <Loader2 className="h-9 w-9 animate-spin text-blue-600" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Confirmando seu e-mail</h1>
          <p className="mb-6 text-sm text-gray-500">
            Estamos validando seu link de confirmacao.
          </p>
        </div>
      }
    >
      <ConfirmacaoEmailContent />
    </Suspense>
  )
}
