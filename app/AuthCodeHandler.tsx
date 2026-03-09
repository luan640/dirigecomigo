'use client'

import { Suspense, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

function AuthCodeHandlerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()

  useEffect(() => {
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
