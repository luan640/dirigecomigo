'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

const schema = z.object({
  email: z.string().email('E-mail inválido'),
  password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

export default function EntrarPage() {
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
      // Demo mode: simulate login
      const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

      if (DEMO_MODE) {
        await new Promise(r => setTimeout(r, 800))
        // Demo credentials
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

      // Production: Supabase auth
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
          const primary = await supabase
            .from('profiles')
            .select('role,onboarding_completed')
            .eq('id', user.id)
            .maybeSingle() as { data: { role: string; onboarding_completed?: boolean } | null; error: Error | null }

          const primaryMessage = String(primary.error?.message || '')
          if (!primaryMessage.toLowerCase().includes('onboarding_completed')) {
            return primary
          }

          const fallback = await supabase
            .from('profiles')
            .select('role')
            .eq('id', user.id)
            .maybeSingle() as { data: { role: string } | null; error: Error | null }

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
          'Usuário'

        // Ensure profile exists/synced so proxy role checks do not block login.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any).upsert({
          id: user.id,
          email: user.email,
          full_name: fallbackName,
          role: fallbackRole,
        })

        const { data: profile, error: profileError } = await loadProfile()
        if (profileError) throw profileError

        let onboardingCompleted = Boolean(profile?.onboarding_completed)

        if (profile?.role === 'instructor' && !onboardingCompleted) {
          // Mirror proxy fallback: if instructor setup or active subscription already exist,
          // treat onboarding as completed even if the profile flag is stale.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const { data: instructor } = await (supabase.from('instructors') as any)
            .select('category,price_per_lesson,vehicle_type')
            .eq('id', user.id)
            .maybeSingle()

          const hasInstructorSetup = Boolean(
            instructor &&
            String(instructor.category || '').trim() &&
            Number(instructor.price_per_lesson || 0) >= 50
          )

          if (hasInstructorSetup) {
            onboardingCompleted = true
          } else {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const { data: subscription } = await (supabase.from('subscriptions') as any)
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
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Entrar na plataforma</h1>
      <p className="text-sm text-gray-500 mb-6">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="text-blue-700 font-semibold hover:underline">
          Cadastre-se grátis
        </Link>
      </p>

      {/* Demo hint */}
      {/* <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 mb-6 text-xs text-blue-700">
        <strong>Modo demo:</strong> use <code>aluno@demo.com</code> ou{' '}
        <code>instrutor@demo.com</code> com qualquer senha
      </div> */}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">E-mail</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-sm font-medium text-gray-700">Senha</label>
            <Link href="/recuperar-senha" className="text-xs text-blue-700 hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              placeholder="••••••••"
              className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs text-red-500 mt-1">{errors.password.message}</p>
          )}
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 disabled:cursor-not-allowed mt-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>

      <div className="mt-4 text-center">
        <p className="text-xs text-gray-400">
          Ao entrar você concorda com nossos{' '}
          <Link href="/termos" className="underline hover:text-gray-600">
            Termos de Uso
          </Link>{' '}
          e{' '}
          <Link href="/privacidade" className="underline hover:text-gray-600">
            Política de Privacidade
          </Link>
        </p>
      </div>
    </>
  )
}
