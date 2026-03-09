'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { CheckCircle2, ChevronRight, Loader2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { BRAZIL_STATES } from '@/constants/locations'
import { createClient } from '@/lib/supabase/client'
import { deleteAvatarAction, uploadAvatarAction } from '@/app/(painel)/painel/perfil/actions'

const instructorSchema = z.object({
  full_name: z.string().min(3, 'Informe seu nome completo'),
  email: z.string().email('E-mail invalido'),
  phone: z.string().min(10, 'Telefone invalido'),
  service_mode: z.enum(['car', 'moto', 'both']),
  price_car: z.coerce.number().nullable(),
  price_moto: z.coerce.number().nullable(),
}).superRefine((values, ctx) => {
  if ((values.service_mode === 'car' || values.service_mode === 'both') && (!values.price_car || values.price_car < 50)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price_car'],
      message: 'Informe um valor de no minimo R$50 para carro',
    })
  }

  if ((values.service_mode === 'moto' || values.service_mode === 'both') && (!values.price_moto || values.price_moto < 50)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['price_moto'],
      message: 'Informe um valor de no minimo R$50 para moto',
    })
  }
})

const studentSchema = z.object({
  phone: z.string().min(10, 'Telefone invalido'),
  city: z.string().min(1, 'Informe a cidade'),
  state: z.string().min(1, 'Selecione o estado'),
})

type InstructorFormData = z.infer<typeof instructorSchema>
type StudentFormData = z.infer<typeof studentSchema>

function getFallbackLetter(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'I'
}

export default function OnboardingPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'student'
  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(role === 'instructor')
  const [done, setDone] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [avatarFallbackLetter, setAvatarFallbackLetter] = useState('I')
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const instructorForm = useForm<InstructorFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(instructorSchema) as any,
    defaultValues: {
      full_name: '',
      email: '',
      phone: '',
      service_mode: 'car',
      price_car: 80,
      price_moto: null,
    },
  })

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: { city: 'Fortaleza', state: 'CE', phone: '' },
  })

  useEffect(() => {
    if (role !== 'instructor') return

    const loadInstructor = async () => {
      try {
        const supabase = createClient()
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user
        if (!user) {
          router.replace('/entrar')
          return
        }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name,email,phone,avatar_url')
          .eq('id', user.id)
          .maybeSingle()

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: instructor } = await (supabase.from('instructors') as any)
          .select('category,categories,price_per_lesson_a,price_per_lesson_b')
          .eq('id', user.id)
          .maybeSingle()

        const fullName = String(profile?.full_name || user.user_metadata?.full_name || '').trim()
        const email = String(profile?.email || user.email || '').trim()
        const phone = String(profile?.phone || '').trim()
        const nextAvatarUrl = String(profile?.avatar_url || '').trim() || null

        const rawCategories = Array.isArray(instructor?.categories)
          ? instructor.categories
          : []
        const normalizedCategories = rawCategories.map((item: unknown) => String(item))
        const fallbackCategory = String(instructor?.category || '')
        const hasCar = normalizedCategories.includes('B') || fallbackCategory === 'B' || fallbackCategory === 'AB'
        const hasMoto = normalizedCategories.includes('A') || fallbackCategory === 'A' || fallbackCategory === 'AB'

        instructorForm.reset({
          full_name: fullName,
          email,
          phone,
          service_mode: hasCar && hasMoto ? 'both' : hasMoto ? 'moto' : 'car',
          price_car: hasCar ? Number(instructor?.price_per_lesson_b ?? instructor?.price_per_lesson ?? 80) : null,
          price_moto: hasMoto ? Number(instructor?.price_per_lesson_a ?? instructor?.price_per_lesson ?? 80) : null,
        })

        setAvatarUrl(nextAvatarUrl)
        setOriginalAvatarUrl(nextAvatarUrl)
        setAvatarRemoved(false)
        setAvatarFallbackLetter(getFallbackLetter(fullName))
      } catch (err) {
        toast.error((err as Error).message || 'Erro ao carregar seus dados.')
      } finally {
        setLoadingProfile(false)
      }
    }

    void loadInstructor()
  }, [instructorForm, role, router])

  async function updateProfilesUpsert(userId: string, values: {
    full_name?: string
    phone?: string
    email?: string
    role: 'student' | 'instructor'
  }) {
    const supabase = createClient()
    const profilesTable = supabase.from('profiles') as unknown as {
      upsert: (payload: Record<string, unknown>) => Promise<{ error: Error | null }>
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilePayload: any = {
      id: userId,
      full_name: values.full_name || null,
      phone: values.phone || null,
      email: values.email || null,
      role: values.role,
      avatar_url: avatarRemoved ? null : avatarUrl,
      onboarding_completed: true,
    }

    const profileResult = await profilesTable.upsert(profilePayload)

    let profileError = profileResult.error as Error | null
    while (profileError) {
      const match = String(profileError.message || '').match(/Could not find the '([^']+)' column/i)
      if (!match) break
      delete profilePayload[match[1]]
      const retryResult = await profilesTable.upsert(profilePayload)
      profileError = retryResult.error as Error | null
    }

    if (profileError) throw profileError
  }

  async function handleInstructorSubmit(values: InstructorFormData) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) throw new Error('Sessao expirada. Faca login novamente.')

      await updateProfilesUpsert(user.id, {
        full_name: values.full_name,
        phone: values.phone,
        email: values.email,
        role: 'instructor',
      })

      const categories = values.service_mode === 'both'
        ? ['A', 'B']
        : values.service_mode === 'moto'
          ? ['A']
          : ['B']
      const primaryCategory = values.service_mode === 'both'
        ? 'AB'
        : values.service_mode === 'moto'
          ? 'A'
          : 'B'
      const selectedPrices = [values.price_car, values.price_moto].filter(
        (item): item is number => typeof item === 'number' && item >= 50,
      )
      const pricePerLesson = Math.min(...selectedPrices)

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instructorPayload: any = {
        id: user.id,
        profile_id: user.id,
        category: primaryCategory,
        categories,
        price_per_lesson: pricePerLesson,
        price_per_lesson_a: categories.includes('A') ? values.price_moto : null,
        price_per_lesson_b: categories.includes('B') ? values.price_car : null,
        vehicle_type: values.service_mode === 'both' ? 'Carro e moto' : values.service_mode === 'moto' ? 'Moto' : 'Carro',
        neighborhood: 'A definir',
        city: 'Fortaleza',
        state: 'CE',
        is_active: true,
      }

      const upsertInstructor = async (payload: Record<string, unknown>) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('instructors') as any).upsert(payload)

      let instructorResult = await upsertInstructor(instructorPayload)
      let instructorError = instructorResult.error as Error | null

      while (instructorError) {
        const match = String(instructorError.message || '').match(/Could not find the '([^']+)' column/i)
        if (!match) break
        delete instructorPayload[match[1]]
        instructorResult = await upsertInstructor(instructorPayload)
        instructorError = instructorResult.error as Error | null
      }

      if (instructorError) throw instructorError

      toast.success('Cadastro concluido!')
      setDone(true)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao concluir cadastro.')
    } finally {
      setLoading(false)
    }
  }

  async function handleStudentSubmit(values: StudentFormData) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) throw new Error('Sessao expirada. Faca login novamente.')

      await updateProfilesUpsert(user.id, {
        full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Aluno',
        phone: values.phone,
        email: user.email || '',
        role: 'student',
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studentPayload: any = {
        id: user.id,
        profile_id: user.id,
        city: values.city,
        state: values.state,
      }

      const upsertStudent = async (payload: Record<string, unknown>) =>
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase.from('students') as any).upsert(payload)

      let studentResult = await upsertStudent(studentPayload)
      let studentError = studentResult.error as Error | null

      while (studentError) {
        const match = String(studentError.message || '').match(/Could not find the '([^']+)' column/i)
        if (!match) break
        delete studentPayload[match[1]]
        studentResult = await upsertStudent(studentPayload)
        studentError = studentResult.error as Error | null
      }

      if (studentError) throw studentError

      toast.success('Cadastro concluido!')
      setDone(true)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao concluir cadastro.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      toast.error('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      toast.error('A imagem deve ter no maximo 2 MB.')
      return
    }

    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploaded = await uploadAvatarAction(formData)

      if (originalAvatarUrl && originalAvatarUrl !== uploaded.url) {
        await deleteAvatarAction(originalAvatarUrl)
      }

      setAvatarUrl(uploaded.url)
      setOriginalAvatarUrl(uploaded.url)
      setAvatarRemoved(false)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao carregar imagem.')
    } finally {
      event.target.value = ''
    }
  }

  function handleRemoveAvatar() {
    if (originalAvatarUrl) {
      void deleteAvatarAction(originalAvatarUrl)
    }
    setAvatarUrl(null)
    setOriginalAvatarUrl(null)
    setAvatarRemoved(true)
  }

  if (done) {
    return (
      <div className="py-6 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100">
          <CheckCircle2 className="h-9 w-9 text-emerald-600" />
        </div>
        <h2 className="mb-2 text-xl font-bold text-gray-900">Tudo pronto!</h2>
        <p className="mb-6 text-sm text-gray-500">
          {role === 'instructor'
            ? 'Seu perfil inicial foi salvo. Agora voce pode seguir para a assinatura da plataforma.'
            : 'Sua conta esta ativa. Agora voce pode buscar instrutores.'}
        </p>
        <button
          type="button"
          onClick={() => router.push(role === 'instructor' ? '/painel/assinatura' : '/instrutores')}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-800"
        >
          {role === 'instructor' ? 'Ir para assinatura' : 'Buscar instrutores'}
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    )
  }

  return (
    <>
      <h1 className="mb-1 text-xl font-extrabold text-gray-900">
        {role === 'instructor' ? 'Concluir cadastro' : 'Complete seu perfil'}
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        {role === 'instructor'
          ? 'Preencha seus dados iniciais para liberar sua conta de instrutor.'
          : 'So mais algumas informacoes para terminar seu cadastro.'}
      </p>

      {role === 'instructor' ? (
        <form onSubmit={instructorForm.handleSubmit(handleInstructorSubmit)} className="space-y-4">
          <div className="flex items-center gap-4 rounded-2xl border border-gray-100 bg-white p-4">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative h-24 w-24 overflow-hidden rounded-full border border-gray-200 bg-gray-100"
            >
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={avatarUrl} alt="Avatar do instrutor" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-gray-500">
                  {avatarFallbackLetter}
                </div>
              )}
            </button>

            <div className="space-y-2">
              <p className="text-sm font-semibold text-gray-900">Foto de perfil</p>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-xl border border-gray-200 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  Escolher foto
                </button>
                <button
                  type="button"
                  onClick={handleRemoveAvatar}
                  className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="h-4 w-4" />
                  Excluir
                </button>
              </div>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <Field label="Nome completo" error={instructorForm.formState.errors.full_name?.message}>
            <input
              {...instructorForm.register('full_name')}
              onChange={event => {
                instructorForm.register('full_name').onChange(event)
                setAvatarFallbackLetter(getFallbackLetter(event.target.value))
              }}
              className={inputClassName}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="E-mail" error={instructorForm.formState.errors.email?.message}>
              <input
                {...instructorForm.register('email')}
                readOnly
                className={`${inputClassName} bg-gray-50 text-gray-500`}
              />
            </Field>
            <Field label="Telefone" error={instructorForm.formState.errors.phone?.message}>
              <input
                {...instructorForm.register('phone')}
                placeholder="(85) 99999-0000"
                className={inputClassName}
              />
            </Field>
          </div>

          <Field label="Servicos oferecidos" error={instructorForm.formState.errors.service_mode?.message}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: 'car', label: 'Apenas carro' },
                { value: 'moto', label: 'Apenas moto' },
                { value: 'both', label: 'Carro e moto' },
              ].map(option => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-4 text-sm font-semibold transition-colors ${
                    instructorForm.watch('service_mode') === option.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input
                    type="radio"
                    value={option.value}
                    {...instructorForm.register('service_mode')}
                    className="sr-only"
                  />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(instructorForm.watch('service_mode') === 'car' || instructorForm.watch('service_mode') === 'both') && (
              <Field label="Valor da aula de carro (R$)" error={instructorForm.formState.errors.price_car?.message}>
                <input
                  {...instructorForm.register('price_car')}
                  type="number"
                  min={50}
                  className={inputClassName}
                />
              </Field>
            )}

            {(instructorForm.watch('service_mode') === 'moto' || instructorForm.watch('service_mode') === 'both') && (
              <Field label="Valor da aula de moto (R$)" error={instructorForm.formState.errors.price_moto?.message}>
                <input
                  {...instructorForm.register('price_moto')}
                  type="number"
                  min={50}
                  className={inputClassName}
                />
              </Field>
            )}
          </div>

          <button
            type="submit"
            disabled={loading || loadingProfile}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
          >
            {loading || loadingProfile ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loadingProfile ? 'Carregando dados...' : loading ? 'Salvando...' : 'Concluir cadastro'}
          </button>
        </form>
      ) : (
        <form onSubmit={studentForm.handleSubmit(handleStudentSubmit)} className="space-y-4">
          <Field label="Telefone" error={studentForm.formState.errors.phone?.message}>
            <input
              {...studentForm.register('phone')}
              placeholder="(85) 99999-0000"
              className={inputClassName}
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade" error={studentForm.formState.errors.city?.message}>
              <input {...studentForm.register('city')} className={inputClassName} />
            </Field>
            <Field label="Estado" error={studentForm.formState.errors.state?.message}>
              <select {...studentForm.register('state')} className={`${inputClassName} bg-white`}>
                {BRAZIL_STATES.map(state => (
                  <option key={state.value} value={state.value}>{state.value}</option>
                ))}
              </select>
            </Field>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 py-3 font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Salvando...' : 'Concluir cadastro'}
          </button>
        </form>
      )}
    </>
  )
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}

const inputClassName = 'w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
