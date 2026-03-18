'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import BrandLogo from '@/components/layout/BrandLogo'
import AuthLeftPanel from '@/components/auth/AuthLeftPanel'

const schema = z.object({
  email: z.string().email('E-mail invalido'),
  password: z.string().min(6, 'Senha deve ter no minimo 6 caracteres'),
})

type FormData = z.infer<typeof schema>

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
          router.push(redirectTo || '/aluno/dashboard')
          return
        }
        if (data.email === 'instrutor@demo.com') {
          toast.success('Bem-vindo de volta!')
          router.push(redirectTo || '/painel/assinatura')
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
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-[#020d04]">
      <AuthLeftPanel
        headline={<>De volta<br /><span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg,#21a637 0%,#f6c400 100%)' }}>ao volante.</span></>}
        subtext="Acesse sua conta e retome suas aulas, acompanhe seu progresso ou gerencie seus alunos em Fortaleza."
      />

      {/* ── Form panel ── */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 lg:px-10 overflow-y-auto bg-[#020d04]">
        {/* Mobile logo */}
        <div className="lg:hidden mb-8 self-start w-full max-w-sm mx-auto">
          <Link href="/"><BrandLogo className="h-10 w-auto rounded-md" priority /></Link>
        </div>

        <div className="w-full max-w-sm">
          <h1
            className="text-2xl font-bold text-[#e8f5ea] mb-1"
            style={{ fontFamily: 'Syne, system-ui, sans-serif' }}
          >
            Entrar na conta
          </h1>
          <p className="text-sm text-[#6b9675] mb-7">
            Ainda não tem conta?{' '}
            <Link href="/cadastro" className="text-[#21a637] font-semibold hover:text-[#2dc447] transition-colors">
              Cadastre-se grátis
            </Link>
          </p>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-[10px] font-semibold text-[#6b9675] uppercase tracking-widest mb-1.5">
                E-mail
              </label>
              <input
                {...register('email')}
                type="email"
                autoComplete="email"
                placeholder="seu@email.com"
                className="w-full px-4 py-3 bg-[#061409] border border-white/[0.08] rounded-xl text-sm text-[#e8f5ea] placeholder:text-[#2a4030] focus:outline-none focus:border-[#21a637] focus:ring-2 focus:ring-[#21a637]/20 transition-all"
              />
              {errors.email && <p className="mt-1 text-xs text-red-400">{errors.email.message}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-[10px] font-semibold text-[#6b9675] uppercase tracking-widest">
                  Senha
                </label>
                <Link
                  href="/recuperar-senha"
                  className="text-[10px] text-[#6b9675] hover:text-[#21a637] transition-colors"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  placeholder="••••••••"
                  className="w-full px-4 py-3 pr-11 bg-[#061409] border border-white/[0.08] rounded-xl text-sm text-[#e8f5ea] placeholder:text-[#2a4030] focus:outline-none focus:border-[#21a637] focus:ring-2 focus:ring-[#21a637]/20 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#2a4030] hover:text-[#6b9675] transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-xs text-red-400">{errors.password.message}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm text-black transition-all duration-200 mt-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
              style={{
                background: 'linear-gradient(135deg, #21a637 0%, #178a2e 100%)',
                boxShadow: loading ? 'none' : '0 6px 24px rgba(33,166,55,0.35)',
              }}
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Entrando...' : 'Entrar'}
            </button>
          </form>

          <p className="text-center text-xs text-[#2a4030] mt-5">
            Ao entrar você concorda com nossos{' '}
            <Link href="/termos" className="text-[#6b9675] hover:text-[#e8f5ea] underline transition-colors">
              Termos de Uso
            </Link>{' '}
            e{' '}
            <Link href="/privacidade" className="text-[#6b9675] hover:text-[#e8f5ea] underline transition-colors">
              Política de Privacidade
            </Link>
          </p>

          <p className="text-center text-[11px] text-[#1a3020] mt-10">
            © {new Date().getFullYear()} DirigeComigo — Fortaleza e região metropolitana.
          </p>
        </div>
      </div>
    </div>
  )
}

export default function EntrarPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020d04]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#21a637]/15">
              <Loader2 className="h-8 w-8 animate-spin text-[#21a637]" />
            </div>
            <h1 className="text-xl font-bold text-[#e8f5ea]" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
              Carregando acesso
            </h1>
            <p className="text-sm text-[#6b9675] mt-1">Estamos preparando a tela de login.</p>
          </div>
        </div>
      }
    >
      <EntrarContent />
    </Suspense>
  )
}
