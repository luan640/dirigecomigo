'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCodeHandlerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Hash-based tokens (Supabase implicit flow — ex: #access_token=...&type=recovery)
    const hash = typeof window !== 'undefined' ? window.location.hash.slice(1) : ''
    if (hash) {
      const hashParams = new URLSearchParams(hash)
      const type = hashParams.get('type')
      const accessToken = hashParams.get('access_token')
      if (type === 'recovery' && accessToken) {
        // Navegação full-page preservando o hash para o Supabase ler os tokens
        window.location.replace('/recuperar-senha/nova-senha' + window.location.hash)
        return
      }
    }

    const code = String(searchParams.get('code') || '').trim()
    const error = String(searchParams.get('error') || '').trim()
    const tokenHash = String(searchParams.get('token_hash') || '').trim()
    const type = String(searchParams.get('type') || '').trim()

    if (error) {
      router.replace('/confirmacao-email?status=erro')
      return
    }

    if (!code && !tokenHash) return

    const nextUrl = new URL('/confirmacao-email', window.location.origin)
    if (code) nextUrl.searchParams.set('code', code)
    if (tokenHash) nextUrl.searchParams.set('token_hash', tokenHash)
    if (type) nextUrl.searchParams.set('type', type)
    router.replace(nextUrl.pathname + nextUrl.search)
  }, [router, searchParams])

  return null
}

export default function AuthCodeHandler() {
  return (
    <Suspense fallback={null}>
      <AuthCodeHandlerContent />
    </Suspense>
  )
}
