'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ArrowLeft, CheckCircle2, AlertTriangle } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
})
type FormData = z.infer<typeof schema>

export default function RecuperarSenhaPage() {
  const searchParams = useSearchParams()
  const [sent, setSent] = useState(false)
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  })
  const hasExpiredCode = searchParams.get('status') === 'codigo-expirado'

  async function onSubmit({ email }: FormData) {
    try {
      const res = await fetch('/api/auth/recuperar-senha', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Erro ao enviar o e-mail.')
      setSent(true)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao enviar o e-mail.')
    }
  }

  if (sent) {
    return (
      <div className="text-center py-2">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-green-50">
          <CheckCircle2 className="h-7 w-7 text-green-600" />
        </div>
        <h1 className="text-xl font-bold text-gray-900 mb-2">E-mail enviado!</h1>
        <p className="text-sm text-gray-500 mb-6">
          Verifique sua caixa de entrada e clique no link para criar uma nova senha.
        </p>
        <Link href="/entrar" className="text-sm font-semibold text-blue-700 hover:underline">
          Voltar para o login
        </Link>
      </div>
    )
  }

  if (hasExpiredCode) {
    return (
      <>
        <Link href="/entrar" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Link>

        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 rounded-full bg-amber-100 p-2">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
            </div>
            <div>
              <h1 className="text-base font-semibold text-amber-900">Código expirado</h1>
              <p className="mt-1 text-sm text-amber-800">
                O link de recuperação não é mais válido. Solicite um novo código para redefinir sua senha.
              </p>
            </div>
          </div>
        </div>
      </>
    )
  }

  return (
    <>
      <Link href="/entrar" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="h-4 w-4" />
        Voltar
      </Link>

      <h1 className="text-2xl font-bold text-gray-900 mb-1">Recuperar senha</h1>
      <p className="text-sm text-gray-500 mb-7">
        Informe seu e-mail e enviaremos um link para criar uma nova senha.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-gray-600 uppercase tracking-wider mb-1.5">
            E-mail
          </label>
          <input
            {...register('email')}
            type="email"
            placeholder="seu@email.com"
            className="w-full px-4 py-3 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60 transition-colors"
        >
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? 'Enviando...' : 'Enviar link de recuperação'}
        </button>
      </form>
    </>
  )
}
