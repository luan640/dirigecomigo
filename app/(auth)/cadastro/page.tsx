'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Eye, EyeOff, Loader2, GraduationCap, Car } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const schema = z.object({
  full_name: z.string().min(3, 'Nome deve ter no mínimo 3 caracteres'),
  email: z.string().email('E-mail inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  role: z.enum(['student', 'instructor'], { message: 'Selecione um perfil' }),
})

type FormData = z.infer<typeof schema>
type ExistingProfileLookup = {
  id: string
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

function buildEmailRedirectTo() {
  const appUrl = String(process.env.NEXT_PUBLIC_APP_URL || '').trim()
  const origin = typeof window !== 'undefined' ? window.location.origin : appUrl
  return `${origin.replace(/\/$/, '')}/confirmacao-email`
}

export default function CadastroPage() {
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
        // Redirect to onboarding
        router.push(`/onboarding?role=${data.role}&name=${encodeURIComponent(data.full_name)}`)
        return
      }

      // Production: Supabase auth
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
        // Create profile in profiles table
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
    <>
      <h1 className="text-2xl font-extrabold text-gray-900 mb-1">Criar sua conta</h1>
      <p className="text-sm text-gray-500 mb-6">
        Já tem uma conta?{' '}
        <Link href="/entrar" className="text-blue-700 font-semibold hover:underline">
          Entrar
        </Link>
      </p>

      {/* Role selector */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          type="button"
          onClick={() => setValue('role', 'student')}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
            selectedRole === 'student'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600'
          )}
        >
          <GraduationCap className="w-7 h-7" />
          <div>
            <p className="font-semibold text-sm">Sou aluno</p>
            <p className="text-xs opacity-70">Quero aprender a dirigir</p>
          </div>
        </button>

        <button
          type="button"
          onClick={() => setValue('role', 'instructor')}
          className={cn(
            'flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-left',
            selectedRole === 'instructor'
              ? 'border-blue-600 bg-blue-50 text-blue-700'
              : 'border-gray-200 hover:border-gray-300 text-gray-600'
          )}
        >
          <Car className="w-7 h-7" />
          <div>
            <p className="font-semibold text-sm">Sou instrutor</p>
            <p className="text-xs opacity-70">Quero dar aulas</p>
          </div>
        </button>
      </div>
      {errors.role && <p className="text-xs text-red-500 -mt-4 mb-4">{errors.role.message}</p>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Nome completo</label>
          <input
            {...register('full_name')}
            type="text"
            autoComplete="name"
            placeholder="Seu nome completo"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.full_name && (
            <p className="text-xs text-red-500 mt-1">{errors.full_name.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">E-mail</label>
          <input
            {...register('email')}
            type="email"
            autoComplete="email"
            placeholder="seu@email.com"
            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {errors.email && (
            <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
          )}
        </div>

        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">Senha</label>
          <div className="relative">
            <input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
              className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
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

        {/* {selectedRole === 'instructor' && (
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-700">
            Como instrutor, será necessário assinar o plano mensal de <strong>R$15/mês</strong> para
            ativar seu perfil.
          </div>
        )} */}

        <button
          type="submit"
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-700 hover:bg-blue-800 text-white font-semibold rounded-xl transition-colors disabled:opacity-60 mt-2"
        >
          {loading && <Loader2 className="w-4 h-4 animate-spin" />}
          {loading ? 'Criando conta...' : 'Criar conta grátis'}
        </button>
      </form>

      <p className="text-center text-xs text-gray-400 mt-4">
        Ao criar sua conta você concorda com nossos{' '}
        <Link href="/termos" className="underline">Termos de Uso</Link>
      </p>
    </>
  )
}
