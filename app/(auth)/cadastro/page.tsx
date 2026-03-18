'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, GraduationCap, Car } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import BrandLogo from '@/components/layout/BrandLogo'
import AuthLeftPanel from '@/components/auth/AuthLeftPanel'

const schema = z.object({
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['student', 'instructor'], { message: 'Selecione um perfil' }),
})

type FormData = z.infer<typeof schema>
type ExistingProfileLookup = { id: string }

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function buildEmailRedirectTo() {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || '').trim()
  const origin = typeof window !== 'undefined' ? window.location.origin : appUrl
  return `${origin.replace(/\/$/, '')}/confirmacao-email`
}

function CadastroContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = searchParams.get('role') === 'instructor' ? 'instructor' : 'student'

  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { role: defaultRole as 'student' | 'instructor' },
  })

  const selectedRole = watch('role')

  async function onSubmit(data: FormData) {
    setLoading(true)
    try {
      const normalizedEmail = normalizeEmail(data.email)
      const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

      if (DEMO_MODE) {
        await new Promise(r => setTimeout(r, 1000))
        toast.success('Conta criada com sucesso!')
        router.push(`/onboarding?role=${data.role}&name=${encodeURIComponent(data.full_name)}`)
        return
      }

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()

      const { data: existingProfile, error: existingProfileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', normalizedEmail)
        .limit(1)
        .maybeSingle() as { data: ExistingProfileLookup | null; error: Error | null }

      if (existingProfileError) throw existingProfileError
      if (existingProfile?.id) {
        throw new Error('Este e-mail ja esta cadastrado. Use outro e-mail ou tente entrar na plataforma.')
      }

      const { data: authData, error: signUpError } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: data.password,
        options: {
          emailRedirectTo: buildEmailRedirectTo(),
          data: {
            full_name: data.full_name,
            role: data.role,
          },
        },
      })

      if (signUpError) throw signUpError

      const identities = Array.isArray(authData.user?.identities) ? authData.user.identities : []
      if (!authData.user || identities.length === 0) {
        throw new Error('Este e-mail ja esta cadastrado. Use outro e-mail ou tente entrar na plataforma.')
      }

      if (!authData.session) {
        toast.success('Conta criada. Confirme o e-mail enviado para ativar o acesso antes de entrar.')
        router.push('/entrar')
        return
      }

      if (authData.user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (supabase.from('profiles') as any).upsert({
          id: authData.user.id,
          email: normalizedEmail,
          full_name: data.full_name,
          role: data.role,
        })
        toast.success('Conta criada! Complete seu perfil.')
        router.push(`/onboarding?role=${data.role}`)
      }
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao criar conta. Tente novamente.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex overflow-hidden bg-[#020d04]">
      <AuthLeftPanel
        headline={<>Sua CNH<br /><span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg,#21a637 0%,#f6c400 100%)' }}>começa aqui.</span></>}
        subtext="Conectamos alunos a instrutores qualificados em Fortaleza. Agende aulas práticas, acompanhe seu progresso e dirija com confiança."
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
            Criar sua conta
          </h1>
          <p className="text-sm text-[#6b9675] mb-7">
            Já tem uma conta?{' '}
            <Link href="/entrar" className="text-[#21a637] font-semibold hover:text-[#2dc447] transition-colors">
              Entrar
            </Link>
          </p>

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {(
              [
                { value: 'student',    Icon: GraduationCap, title: 'Sou aluno',     sub: 'Quero aprender' },
                { value: 'instructor', Icon: Car,           title: 'Sou instrutor', sub: 'Quero dar aulas' },
              ] as const
            ).map(({ value, Icon, title, sub }) => {
              const active = selectedRole === value
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setValue('role', value)}
                  className={cn(
                    'flex flex-col items-start gap-3 p-4 rounded-2xl border-2 transition-all duration-200 text-left focus:outline-none',
                    active
                      ? 'border-[#21a637] bg-[#21a637]/10 text-[#2dc447]'
                      : 'border-white/[0.08] bg-white/[0.03] text-[#6b9675] hover:border-white/20 hover:text-[#e8f5ea]'
                  )}
                >
                  <div className={cn(
                    'flex items-center justify-center w-9 h-9 rounded-xl transition-colors',
                    active ? 'bg-[#21a637]/20' : 'bg-white/[0.06]'
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{title}</p>
                    <p className="text-xs opacity-70 mt-0.5">{sub}</p>
                  </div>
                </button>
              )
            })}
          </div>
          {errors.role && <p className="text-xs text-red-400 -mt-4 mb-4">{errors.role.message}</p>}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {(
              [
                { name: 'full_name', label: 'Nome completo', type: 'text',  autoComplete: 'name',  placeholder: 'Seu nome completo' },
                { name: 'email',     label: 'E-mail',        type: 'email', autoComplete: 'email', placeholder: 'seu@email.com'     },
              ] as const
            ).map(({ name, label, type, autoComplete, placeholder }) => (
              <div key={name}>
                <label className="block text-[10px] font-semibold text-[#6b9675] uppercase tracking-widest mb-1.5">
                  {label}
                </label>
                <input
                  {...register(name)}
                  type={type}
                  autoComplete={autoComplete}
                  placeholder={placeholder}
                  className="w-full px-4 py-3 bg-[#061409] border border-white/[0.08] rounded-xl text-sm text-[#e8f5ea] placeholder:text-[#2a4030] focus:outline-none focus:border-[#21a637] focus:ring-2 focus:ring-[#21a637]/20 transition-all"
                />
                {errors[name] && <p className="text-xs text-red-400 mt-1">{errors[name]?.message}</p>}
              </div>
            ))}

            <div>
              <label className="block text-[10px] font-semibold text-[#6b9675] uppercase tracking-widest mb-1.5">
                Senha
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="Mínimo 8 caracteres"
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
              {errors.password && <p className="text-xs text-red-400 mt-1">{errors.password.message}</p>}
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
              {loading ? 'Criando conta...' : 'Criar conta grátis'}
            </button>
          </form>

          <p className="text-center text-xs text-[#2a4030] mt-5">
            Ao criar sua conta você concorda com nossos{' '}
            <Link href="/termos" className="text-[#6b9675] hover:text-[#e8f5ea] underline transition-colors">
              Termos de Uso
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

export default function CadastroPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020d04]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#21a637]/15">
              <Loader2 className="h-8 w-8 animate-spin text-[#21a637]" />
            </div>
            <h1 className="text-xl font-bold text-[#e8f5ea]" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
              Carregando cadastro
            </h1>
            <p className="text-sm text-[#6b9675] mt-1">Estamos preparando o formulário.</p>
          </div>
        </div>
      }
    >
      <CadastroContent />
    </Suspense>
  )
}
