'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('E-mail invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

const inputClassName =
  'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:border-[var(--brand-orange)] focus:outline-none focus:ring-2 focus:ring-[#ffd7a8] focus:border-transparent'

function EntrarContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const redirectTo = searchParams.get('redirectTo') || ''

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({ resolver: zodResolver(schema) })

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

      if (DEMO_MODE) {
        await new Promise((r) => setTimeout(r, 800))
        if (data.email === 'aluno@demo.com') {
          toast.success('Bem-vindo de volta!')
          if (redirectTo) {
            router.push(redirectTo)
            return
          }
          router.push('/aluno/dashboard')
          return
        }
        if (data.email === 'instrutor@demo.com') {
          toast.success('Bem-vindo de volta!')
          if (redirectTo) {
            router.push(redirectTo)
            return
          }
          router.push('/painel/assinatura')
          return
        }
        toast.error('Demo: use aluno@demo.com ou instrutor@demo.com')
        setLoading(false)
        return
      }

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: signInData, error } = await supabase.auth.signInWithPassword({
        email: data.email,
        password: data.password,
      })

      if (error) throw error

      const user = signInData.user
      if (user) {
        const loadProfile = async () => {
          const primary = (await supabase
            .from('profiles')
            .select('role,onboarding_completed')
            .eq('id', user.id)
            .maybeSingle()) as {
            data: { role: string; onboarding_completed?: boolean } | null
            error: Error | null
          }

          const primaryMessage = String(primary.error?.message || '')
          if (!primaryMessage.toLowerCase().includes('onboarding_completed')) {
            return primary
          }

          const fallback = (await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle()) as { data: { role: string } | null; error: Error | null }

          return {
            data: fallback.data ? { ...fallback.data, onboarding_completed: false } : null,
            error: fallback.error,
          }
        }

        const { data: existingProfile, error: existingProfileError } = await loadProfile()
        if (existingProfileError) throw existingProfileError

        const metadataRole = String(user.user_metadata?.role || '')
        const fallbackRole =
          existingProfile?.role ||
          (metadataRole === 'instructor' || metadataRole === 'admin' || metadataRole === 'student'
            ? metadataRole
            : 'student')
        const fallbackName =
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Usuario'

        await (supabase.from('profiles') as never as {
          upsert: (payload: Record<string, unknown>) => Promise<unknown>
        }).upsert({
          id: user.id,
          email: user.email,
          full_name: fallbackName,
          role: fallbackRole,
        })

        const { data: profile, error: profileError } = await loadProfile()
        if (profileError) throw profileError

        let onboardingCompleted = Boolean(profile?.onboarding_completed)

        if (profile?.role === 'instructor' && !onboardingCompleted) {
          const { data: instructor } = await (
            supabase.from('instructors') as never as {
              select: (query: string) => {
                eq: (column: string, value: string) => {
                  maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>
                }
              }
            }
          )
            .select('category,price_per_lesson,vehicle_type')
            .eq('id', user.id)
            .maybeSingle()

          const hasInstructorSetup = Boolean(
            instructor &&
              String(instructor.category || '').trim() &&
              Number(instructor.price_per_lesson || 0) >= 1
          )

          if (hasInstructorSetup) {
            onboardingCompleted = true
          } else {
            const { data: subscription } = await (
              supabase.from('subscriptions') as never as {
                select: (query: string) => {
                  eq: (column: string, value: string) => {
                    order: (column: string, options?: { ascending?: boolean }) => {
                      limit: (count: number) => {
                        maybeSingle: () => Promise<{ data: Record<string, unknown> | null }>
                      }
                    }
                  }
                }
              }
            )
              .select('status,current_period_end,expires_at')
              .eq('instructor_id', user.id)
              .order('updated_at', { ascending: false })
              .limit(1)
              .maybeSingle()

            const status = String(subscription?.status || '')
            const endDateRaw = subscription?.current_period_end || subscription?.expires_at
            const today = new Date().toISOString().split('T')[0]
            const hasActiveSubscription = Boolean(
              subscription &&
                status === 'active' &&
                typeof endDateRaw === 'string' &&
                String(endDateRaw).slice(0, 10) >= today
            )

            if (hasActiveSubscription) {
              onboardingCompleted = true
            }
          }
        }

        if (profile?.role === 'instructor' && !onboardingCompleted) {
          router.push('/onboarding?role=instructor')
        } else if (redirectTo) {
          router.push(redirectTo)
        } else if (profile?.role === 'instructor') {
          router.push('/painel/assinatura')
        } else if (profile?.role === 'admin') {
          router.push('/admin')
        } else {
          router.push('/aluno/dashboard')
        }
      }
    } catch (err) {
      const message = String((err as Error)?.message || '')
      if (message.toLowerCase().includes('email not confirmed')) {
        toast.error('Confirme seu e-mail antes de entrar na plataforma.')
      } else if (message.toLowerCase().includes('invalid login credentials')) {
        toast.error('E-mail ou senha incorretos. Tente novamente.')
      } else {
        toast.error(message || 'Erro ao entrar na plataforma.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <h1 className="mb-1 text-2xl font-extrabold text-gray-900">Autentique-se</h1>
      <p className="mb-6 text-sm text-gray-500">
        Ainda nao tem conta?{' '}
        <Link href="/cadastro" className="font-semibold text-[var(--brand-orange)] hover:underline">
          Cadastre-se gratis
        </Link>
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">E-mail</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className={inputClassName}
          />
          {errors.email && <p className="mt-1 text-xs text-red-500">{errors.email.message}</p>}
        </div>

        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <Link href="/recuperar-senha" className="text-xs text-[var(--brand-navy)] hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="********"
              className={`${inputClassName} pr-11`}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute top-1/2 right-3 -translate-y-1/2 text-gray-400 hover:text-[var(--brand-orange)]"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && <p className="mt-1 text-xs text-red-500">{errors.password.message}</p>}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-[var(--brand-orange)] px-4 py-3 font-semibold text-white transition-colors hover:bg-[#e45f00] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading && <Loader2 className="h-4 w-4 animate-spin" />}
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          Ao entrar voce concorda com nossos{' '}
          <Link href="/termos" className="underline hover:text-gray-600">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link href="/privacidade" className="underline hover:text-gray-600">
            Politica de Privacidade
          </Link>
        </p>
      </div>
    </>
  )
}

export default function EntrarPage() {
  return (
    <Suspense
      fallback={
        <div className="py-6 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#fff7db]">
            <Loader2 className="h-9 w-9 animate-spin text-[var(--brand-orange)]" />
          </div>
          <h1 className="mb-2 text-2xl font-bold text-gray-900">Carregando acesso</h1>
          <p className="text-sm text-gray-500">Estamos preparando a tela de login.</p>
        </div>
      }
    >
      <EntrarContent />
    </Suspense>
  )
}
