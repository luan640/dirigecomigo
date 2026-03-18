'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle2, ChevronRight, Loader2, Trash2,
  Camera, FileImage, Clock, ShieldCheck, Car, Bike,
} from 'lucide-react'
import { toast } from 'sonner'

import { BRAZIL_STATES } from '@/constants/locations'
import { searchLocationSuggestionsAction, type AddressSuggestion } from '@/lib/location'
import { createClient } from '@/lib/supabase/client'
import {
  deleteAvatarAction, uploadAvatarAction, uploadCnhAction,
} from '@/app/(painel)/painel/perfil/actions'
import BrandLogo from '@/components/layout/BrandLogo'
import AuthLeftPanel from '@/components/auth/AuthLeftPanel'

/* ─── Schemas ─────────────────────────────────────────────────── */

const instructorSchema = z.object({
  full_name: z.string().min(3, 'Informe seu nome completo'),
  email: z.string().email('E-mail inválido'),
  phone: z.string().min(10, 'Telefone inválido'),
  neighborhood: z.string().min(2, 'Informe sua localização'),
  service_mode: z.enum(['car', 'moto', 'both']),
  price_car: z.coerce.number().nullable(),
  price_moto: z.coerce.number().nullable(),
}).superRefine((values, ctx) => {
  if ((values.service_mode === 'car' || values.service_mode === 'both') && (!values.price_car || values.price_car < 1)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price_car'], message: 'Informe um valor de no mínimo R$1 para carro' })
  }
  if ((values.service_mode === 'moto' || values.service_mode === 'both') && (!values.price_moto || values.price_moto < 1)) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['price_moto'], message: 'Informe um valor de no mínimo R$1 para moto' })
  }
})

const studentSchema = z.object({
  phone: z.string().min(10, 'Telefone inválido'),
  city: z.string().min(1, 'Informe a cidade'),
  state: z.string().min(1, 'Selecione o estado'),
})

type InstructorFormData = z.infer<typeof instructorSchema>
type StudentFormData = z.infer<typeof studentSchema>
type OnboardingProfileRow = {
  full_name: string | null
  email: string | null
  phone: string | null
  avatar_url: string | null
}
type OnboardingInstructorRow = {
  category?: string | null
  categories?: unknown[] | null
  price_per_lesson?: number | null
  price_per_lesson_a?: number | null
  price_per_lesson_b?: number | null
  neighborhood?: string | null
  city?: string | null
  state?: string | null
  latitude?: number | null
  longitude?: number | null
}

function getFallbackLetter(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'I'
}

/* ─── Input / Field helpers ────────────────────────────────────── */

const inputClass = 'w-full px-4 py-3 bg-[#061409] border border-white/[0.08] rounded-xl text-sm text-[#e8f5ea] placeholder:text-[#2a4030] focus:outline-none focus:border-[#21a637] focus:ring-2 focus:ring-[#21a637]/20 transition-all'
const inputClassReadonly = `${inputClass} opacity-50 cursor-not-allowed`

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#6b9675] uppercase tracking-widest mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[#2a4030]">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

/* ─── Done screen (instructor) ─────────────────────────────────── */

function InstructorDoneScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="flex flex-col items-center text-center py-4">
      <div className="relative mb-6">
        <div className="w-20 h-20 rounded-full flex items-center justify-center"
          style={{ background: 'rgba(33,166,55,0.15)', border: '2px solid rgba(33,166,55,0.3)' }}>
          <Clock className="w-9 h-9 text-[#21a637]" />
        </div>
        <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center bg-[#f6c400]">
          <ShieldCheck className="w-4 h-4 text-black" />
        </div>
      </div>

      <h2
        className="text-2xl font-bold text-[#e8f5ea] mb-3"
        style={{ fontFamily: 'Syne, system-ui, sans-serif' }}
      >
        Cadastro enviado!
      </h2>
      <p className="text-sm text-[#6b9675] max-w-xs mb-6 leading-relaxed">
        Seu perfil foi enviado para análise. Nossa equipe verificará suas informações e a foto da CNH antes de ativar sua conta.
      </p>

      <div className="w-full rounded-2xl p-4 mb-6 text-left space-y-3"
        style={{ background: 'rgba(33,166,55,0.07)', border: '1px solid rgba(33,166,55,0.15)' }}>
        <p className="text-xs font-bold text-[#21a637] uppercase tracking-widest">O que acontece agora?</p>
        {[
          { icon: ShieldCheck, text: 'Verificamos sua CNH e dados cadastrais' },
          { icon: Clock,       text: 'Prazo de análise: até 2 dias úteis' },
          { icon: CheckCircle2, text: 'Você receberá um e-mail quando aprovado' },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-[#21a637] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#6b9675]">{text}</p>
          </div>
        ))}
      </div>

      <button
        type="button"
        onClick={onContinue}
        className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm text-black transition-all duration-200 active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #21a637 0%, #178a2e 100%)', boxShadow: '0 6px 24px rgba(33,166,55,0.35)' }}
      >
        Ir para o painel
        <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  )
}

function StudentDoneScreen({ onContinue }: { onContinue: () => void }) {
  return (
    <div className="py-6 text-center">
      <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full"
        style={{ background: 'rgba(33,166,55,0.15)' }}>
        <CheckCircle2 className="h-9 w-9 text-[#21a637]" />
      </div>
      <h2 className="mb-2 text-xl font-bold text-[#e8f5ea]"
        style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
        Tudo pronto!
      </h2>
      <p className="mb-6 text-sm text-[#6b9675]">
        Sua conta está ativa. Agora você pode buscar instrutores.
      </p>
      <button
        type="button"
        onClick={onContinue}
        className="flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm text-black transition-all active:scale-[0.98]"
        style={{ background: 'linear-gradient(135deg, #21a637 0%, #178a2e 100%)', boxShadow: '0 4px 16px rgba(33,166,55,0.3)' }}
      >
        Buscar instrutores
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  )
}

/* ─── Main component ───────────────────────────────────────────── */

function OnboardingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const role = searchParams.get('role') || 'student'
  const isInstructor = role === 'instructor'

  const [loading, setLoading] = useState(false)
  const [loadingProfile, setLoadingProfile] = useState(isInstructor)
  const [done, setDone] = useState(false)

  // Avatar
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [avatarFallbackLetter, setAvatarFallbackLetter] = useState('I')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  // CNH
  const [cnhPhotoUrl, setCnhPhotoUrl] = useState<string | null>(null)
  const [cnhFileName, setCnhFileName] = useState<string | null>(null)
  const [cnhUploading, setCnhUploading] = useState(false)
  const cnhInputRef = useRef<HTMLInputElement | null>(null)

  // Location
  const [locationQuery, setLocationQuery] = useState('')
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<AddressSuggestion[]>([])
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Fortaleza')
  const [selectedState, setSelectedState] = useState('CE')
  const [selectedLatitude, setSelectedLatitude] = useState<number | null>(null)
  const [selectedLongitude, setSelectedLongitude] = useState<number | null>(null)

  const instructorForm = useForm<InstructorFormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(instructorSchema) as any,
    defaultValues: { full_name: '', email: '', phone: '', neighborhood: '', service_mode: 'car', price_car: 80, price_moto: null },
  })

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: { city: 'Fortaleza', state: 'CE', phone: '' },
  })

  /* Location suggestions */
  useEffect(() => {
    if (!isInstructor) return
    const query = locationQuery.trim()
    if (!showLocationSuggestions || query.length < 3) {
      setLocationSuggestions([])
      setLoadingLocationSuggestions(false)
      return
    }
    let active = true
    setLoadingLocationSuggestions(true)
    const timer = window.setTimeout(async () => {
      try {
        if (!active) return
        setLocationSuggestions(await searchLocationSuggestionsAction(query))
      } catch {
        if (active) setLocationSuggestions([])
      } finally {
        if (active) setLoadingLocationSuggestions(false)
      }
    }, 300)
    return () => { active = false; window.clearTimeout(timer) }
  }, [locationQuery, isInstructor, showLocationSuggestions])

  /* Load existing instructor profile */
  useEffect(() => {
    if (!isInstructor) return
    const load = async () => {
      try {
        const supabase = createClient()
        const { data: authData } = await supabase.auth.getUser()
        const user = authData.user
        if (!user) { router.replace('/entrar'); return }

        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name,email,phone,avatar_url')
          .eq('id', user.id)
          .maybeSingle() as { data: OnboardingProfileRow | null; error: Error | null }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { data: instructor } = await (supabase.from('instructors') as any)
          .select('category,categories,price_per_lesson_a,price_per_lesson_b,neighborhood,city,state,latitude,longitude,cnh_photo_url')
          .eq('id', user.id)
          .maybeSingle() as { data: OnboardingInstructorRow & { cnh_photo_url?: string | null } | null; error: Error | null }

        const fullName = String(profile?.full_name || user.user_metadata?.full_name || '').trim()
        const email = String(profile?.email || user.email || '').trim()
        const phone = String(profile?.phone || '').trim()
        const nextAvatarUrl = String(profile?.avatar_url || '').trim() || null

        const rawCategories = Array.isArray(instructor?.categories) ? instructor.categories : []
        const normalizedCategories = rawCategories.map((item: unknown) => String(item))
        const fallbackCategory = String(instructor?.category || '')
        const hasCar = normalizedCategories.includes('B') || fallbackCategory === 'B' || fallbackCategory === 'AB'
        const hasMoto = normalizedCategories.includes('A') || fallbackCategory === 'A' || fallbackCategory === 'AB'

        instructorForm.reset({
          full_name: fullName, email, phone,
          neighborhood: String(instructor?.neighborhood || ''),
          service_mode: hasCar && hasMoto ? 'both' : hasMoto ? 'moto' : 'car',
          price_car: hasCar ? Number(instructor?.price_per_lesson_b ?? instructor?.price_per_lesson ?? 80) : null,
          price_moto: hasMoto ? Number(instructor?.price_per_lesson_a ?? instructor?.price_per_lesson ?? 80) : null,
        })

        setLocationQuery(
          [String(instructor?.neighborhood || '').trim(), String(instructor?.city || '').trim()]
            .filter(Boolean).join(', '),
        )
        setSelectedCity(String(instructor?.city || 'Fortaleza'))
        setSelectedState(String(instructor?.state || 'CE'))
        setSelectedLatitude(instructor?.latitude != null ? Number(instructor.latitude) : null)
        setSelectedLongitude(instructor?.longitude != null ? Number(instructor.longitude) : null)
        setAvatarUrl(nextAvatarUrl)
        setOriginalAvatarUrl(nextAvatarUrl)
        setAvatarFallbackLetter(getFallbackLetter(fullName))

        if (instructor?.cnh_photo_url) {
          setCnhPhotoUrl(String(instructor.cnh_photo_url))
          setCnhFileName('CNH já enviada')
        }
      } catch (err) {
        toast.error((err as Error).message || 'Erro ao carregar seus dados.')
      } finally {
        setLoadingProfile(false)
      }
    }
    void load()
  }, [instructorForm, isInstructor, router])

  /* Profile upsert helper */
  async function updateProfilesUpsert(userId: string, values: { full_name?: string; phone?: string; email?: string; role: 'student' | 'instructor' }) {
    const supabase = createClient()
    const profilesTable = supabase.from('profiles') as unknown as {
      upsert: (payload: Record<string, unknown>) => Promise<{ error: Error | null }>
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const profilePayload: any = {
      id: userId, full_name: values.full_name || null, phone: values.phone || null,
      email: values.email || null, role: values.role,
      avatar_url: avatarRemoved ? null : avatarUrl,
      onboarding_completed: true,
    }
    let profileError = (await profilesTable.upsert(profilePayload)).error as Error | null
    while (profileError) {
      const match = String(profileError.message || '').match(/Could not find the '([^']+)' column/i)
      if (!match) break
      delete profilePayload[match[1]]
      profileError = (await profilesTable.upsert(profilePayload)).error as Error | null
    }
    if (profileError) throw profileError
  }

  /* Instructor submit */
  async function handleInstructorSubmit(values: InstructorFormData) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')

      await updateProfilesUpsert(user.id, { full_name: values.full_name, phone: values.phone, email: values.email, role: 'instructor' })

      const categories = values.service_mode === 'both' ? ['A', 'B'] : values.service_mode === 'moto' ? ['A'] : ['B']
      const primaryCategory = values.service_mode === 'both' ? 'AB' : values.service_mode === 'moto' ? 'A' : 'B'
      const selectedPrices = [values.price_car, values.price_moto].filter((item): item is number => typeof item === 'number' && item >= 1)
      const pricePerLesson = Math.min(...selectedPrices)

      if (selectedLatitude === null || selectedLongitude === null) throw new Error('Selecione um local válido para preencher latitude e longitude.')
      if (!selectedCity || !selectedState) throw new Error('Selecione um local válido em Fortaleza ou Caucaia.')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instructorPayload: any = {
        id: user.id, profile_id: user.id,
        category: primaryCategory, categories,
        price_per_lesson: pricePerLesson,
        price_per_lesson_a: categories.includes('A') ? values.price_moto : null,
        price_per_lesson_b: categories.includes('B') ? values.price_car : null,
        vehicle_type: values.service_mode === 'both' ? 'Carro e moto' : values.service_mode === 'moto' ? 'Moto' : 'Carro',
        neighborhood: values.neighborhood, city: selectedCity, state: selectedState,
        latitude: selectedLatitude, longitude: selectedLongitude,
        is_active: false,
        status: 'pending',
        cnh_photo_url: cnhPhotoUrl || null,
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

      setDone(true)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao concluir cadastro.')
    } finally {
      setLoading(false)
    }
  }

  /* Student submit */
  async function handleStudentSubmit(values: StudentFormData) {
    setLoading(true)
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')

      await updateProfilesUpsert(user.id, { full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'Aluno', phone: values.phone, email: user.email || '', role: 'student' })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const studentPayload: any = { id: user.id, profile_id: user.id, city: values.city, state: values.state }
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

      setDone(true)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao concluir cadastro.')
    } finally {
      setLoading(false)
    }
  }

  /* Avatar upload */
  async function handleAvatarChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) { toast.error('Selecione um arquivo de imagem.'); return }
    if (file.size > 2 * 1024 * 1024) { toast.error('A imagem deve ter no máximo 2 MB.'); return }
    setAvatarUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploaded = await uploadAvatarAction(formData)
      if (originalAvatarUrl && originalAvatarUrl !== uploaded.url) await deleteAvatarAction(originalAvatarUrl)
      setAvatarUrl(uploaded.url)
      setOriginalAvatarUrl(uploaded.url)
      setAvatarRemoved(false)
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao carregar imagem.')
    } finally {
      setAvatarUploading(false)
      event.target.value = ''
    }
  }

  function handleRemoveAvatar() {
    if (originalAvatarUrl) void deleteAvatarAction(originalAvatarUrl)
    setAvatarUrl(null); setOriginalAvatarUrl(null); setAvatarRemoved(true)
  }

  /* CNH upload */
  async function handleCnhChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) { toast.error('Envie uma imagem (JPG, PNG, WEBP) ou PDF da CNH.'); return }
    if (file.size > 10 * 1024 * 1024) { toast.error('O arquivo deve ter no máximo 10 MB.'); return }
    setCnhUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      const uploaded = await uploadCnhAction(formData)
      setCnhPhotoUrl(uploaded.url)
      setCnhFileName(file.name)
      toast.success('Foto da CNH enviada com sucesso!')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao enviar CNH.')
    } finally {
      setCnhUploading(false)
      event.target.value = ''
    }
  }

  /* Location select */
  async function handleSelectLocation(address: AddressSuggestion) {
    setLocationQuery(`${address.logradouro || address.bairro} - ${address.bairro}, ${address.localidade}`)
    instructorForm.setValue('neighborhood', address.bairro, { shouldDirty: true, shouldValidate: true })
    setSelectedCity(address.localidade)
    setSelectedState(address.uf)
    setShowLocationSuggestions(false)
    setSelectedLatitude(address.latitude)
    setSelectedLongitude(address.longitude)
  }

  const serviceMode = instructorForm.watch('service_mode')

  /* ── Instructor layout (full-screen split) ── */
  if (isInstructor) {
    return (
      <div className="fixed inset-0 z-50 flex overflow-hidden bg-[#020d04]">
        <AuthLeftPanel
          headline={<>Seja um<br /><span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg,#21a637 0%,#f6c400 100%)' }}>instrutor.</span></>}
          subtext="Complete seu cadastro para começar a receber alunos em Fortaleza e região metropolitana."
        />

        <div className="flex-1 flex flex-col items-center justify-start px-6 py-10 lg:px-10 overflow-y-auto bg-[#020d04]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 self-start w-full max-w-lg mx-auto">
            <Link href="/"><BrandLogo className="h-10 w-auto rounded-md" priority /></Link>
          </div>

          <div className="w-full max-w-lg">
            {done ? (
              <InstructorDoneScreen onContinue={() => router.push('/painel/assinatura')} />
            ) : (
              <>
                <h1
                  className="text-2xl font-bold text-[#e8f5ea] mb-1"
                  style={{ fontFamily: 'Syne, system-ui, sans-serif' }}
                >
                  Concluir cadastro
                </h1>
                <p className="text-sm text-[#6b9675] mb-7">
                  Preencha seus dados para que possamos analisar e ativar sua conta.
                </p>

                {/* Análise notice */}
                <div className="flex items-start gap-3 rounded-2xl p-4 mb-6"
                  style={{ background: 'rgba(246,196,0,0.07)', border: '1px solid rgba(246,196,0,0.2)' }}>
                  <Clock className="w-4 h-4 text-[#f6c400] mt-0.5 flex-shrink-0" />
                  <p className="text-xs text-[#b89a00] leading-relaxed">
                    <span className="font-semibold text-[#f6c400]">Cadastro sujeito a análise.</span>{' '}
                    Após o envio, nossa equipe verificará seus dados e a foto da CNH em até 2 dias úteis.
                  </p>
                </div>

                {loadingProfile ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-[#21a637]" />
                    <span className="ml-3 text-sm text-[#6b9675]">Carregando seus dados...</span>
                  </div>
                ) : (
                  <form onSubmit={instructorForm.handleSubmit(handleInstructorSubmit)} className="space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-4 rounded-2xl p-4"
                      style={{ background: 'rgba(6,20,10,0.8)', border: '1px solid rgba(33,166,55,0.12)' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-80"
                        style={{ border: '2px solid rgba(33,166,55,0.3)', background: '#061409' }}
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-[#21a637]" />
                          </div>
                        ) : avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-2xl font-bold text-[#21a637]">{avatarFallbackLetter}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-end justify-center pb-1 opacity-0 hover:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-[#e8f5ea] mb-2">Foto de perfil</p>
                        <div className="flex gap-2 flex-wrap">
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-[#21a637] transition-colors"
                            style={{ border: '1px solid rgba(33,166,55,0.3)', background: 'rgba(33,166,55,0.08)' }}>
                            Escolher foto
                          </button>
                          {avatarUrl && (
                            <button type="button" onClick={handleRemoveAvatar}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-red-400 transition-colors"
                              style={{ border: '1px solid rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.06)' }}>
                              <Trash2 className="h-3 w-3" />
                              Remover
                            </button>
                          )}
                        </div>
                      </div>
                      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" />
                    </div>

                    <Field label="Nome completo" error={instructorForm.formState.errors.full_name?.message}>
                      <input
                        {...instructorForm.register('full_name')}
                        placeholder="Seu nome completo"
                        onChange={event => {
                          instructorForm.register('full_name').onChange(event)
                          setAvatarFallbackLetter(getFallbackLetter(event.target.value))
                        }}
                        className={inputClass}
                      />
                    </Field>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="E-mail" error={instructorForm.formState.errors.email?.message}>
                        <input {...instructorForm.register('email')} readOnly className={inputClassReadonly} />
                      </Field>
                      <Field label="Telefone" error={instructorForm.formState.errors.phone?.message}>
                        <input {...instructorForm.register('phone')} placeholder="(85) 99999-0000" className={inputClass} />
                      </Field>
                    </div>

                    <Field
                      label="Sua localização"
                      error={instructorForm.formState.errors.neighborhood?.message}
                      hint="A seleção preenche bairro, cidade, estado e coordenadas do mapa."
                    >
                      <div className="relative">
                        <input
                          value={locationQuery}
                          onChange={event => {
                            const value = event.target.value
                            setLocationQuery(value)
                            instructorForm.setValue('neighborhood', value, { shouldDirty: true, shouldValidate: true })
                            setSelectedCity(''); setSelectedState('')
                            setSelectedLatitude(null); setSelectedLongitude(null)
                            setShowLocationSuggestions(true)
                          }}
                          onFocus={() => setShowLocationSuggestions(true)}
                          onBlur={() => window.setTimeout(() => setShowLocationSuggestions(false), 120)}
                          placeholder="Busque rua, bairro ou localidade"
                          className={inputClass}
                        />
                        <input type="hidden" {...instructorForm.register('neighborhood')} />
                        {showLocationSuggestions && (loadingLocationSuggestions || locationSuggestions.length > 0) && (
                          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl shadow-xl"
                            style={{ background: '#061409', border: '1px solid rgba(33,166,55,0.2)' }}>
                            {loadingLocationSuggestions && (
                              <div className="px-4 py-3 text-sm text-[#6b9675]">Buscando endereços...</div>
                            )}
                            {!loadingLocationSuggestions && locationSuggestions.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onMouseDown={event => { event.preventDefault(); void handleSelectLocation(item) }}
                                className="block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-[#0a2010]"
                              >
                                <span className="block font-medium text-[#e8f5ea]">{item.logradouro || item.bairro}</span>
                                <span className="block text-xs text-[#6b9675]">
                                  {[item.bairro, item.localidade, item.cep ? `CEP ${item.cep}` : ''].filter(Boolean).join(' · ')}
                                </span>
                              </button>
                            ))}
                            {!loadingLocationSuggestions && locationSuggestions.length === 0 && locationQuery.trim().length >= 3 && (
                              <div className="px-4 py-3 text-sm text-[#6b9675]">Nenhum endereço encontrado.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </Field>

                    {/* Service mode */}
                    <Field label="Serviços oferecidos" error={instructorForm.formState.errors.service_mode?.message}>
                      <div className="grid gap-3 grid-cols-3">
                        {[
                          { value: 'car', label: 'Carro', icon: Car },
                          { value: 'moto', label: 'Moto', icon: Bike },
                          { value: 'both', label: 'Carro e moto', icon: Car },
                        ].map(({ value, label, icon: Icon }) => {
                          const active = serviceMode === value
                          return (
                            <label key={value}
                              className="cursor-pointer rounded-xl p-3 text-sm font-semibold transition-all text-center"
                              style={active
                                ? { border: '2px solid #21a637', background: 'rgba(33,166,55,0.12)', color: '#21a637' }
                                : { border: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)', color: '#6b9675' }}>
                              <input type="radio" value={value} {...instructorForm.register('service_mode')} className="sr-only" />
                              <Icon className="w-4 h-4 mx-auto mb-1" />
                              {label}
                            </label>
                          )
                        })}
                      </div>
                    </Field>

                    {/* Prices */}
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      {(serviceMode === 'car' || serviceMode === 'both') && (
                        <Field label="Valor por aula de carro (R$)" error={instructorForm.formState.errors.price_car?.message}>
                          <input {...instructorForm.register('price_car')} type="number" min={1} className={inputClass} />
                        </Field>
                      )}
                      {(serviceMode === 'moto' || serviceMode === 'both') && (
                        <Field label="Valor por aula de moto (R$)" error={instructorForm.formState.errors.price_moto?.message}>
                          <input {...instructorForm.register('price_moto')} type="number" min={1} className={inputClass} />
                        </Field>
                      )}
                    </div>
                    <p className="text-xs text-[#2a4030]">
                      Informe o valor líquido que você quer receber. O aluno verá o acréscimo no checkout conforme Pix ou cartão.
                    </p>

                    {/* CNH upload */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#6b9675] uppercase tracking-widest mb-1.5">
                        Foto da CNH <span className="text-[#21a637]">*</span>
                      </label>
                      <div
                        className="relative rounded-2xl p-5 transition-all"
                        style={{ background: 'rgba(6,20,10,0.8)', border: cnhPhotoUrl ? '1px solid rgba(33,166,55,0.4)' : '1px dashed rgba(33,166,55,0.2)' }}
                      >
                        {cnhUploading ? (
                          <div className="flex flex-col items-center gap-2 py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-[#21a637]" />
                            <p className="text-xs text-[#6b9675]">Enviando...</p>
                          </div>
                        ) : cnhPhotoUrl ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(33,166,55,0.15)' }}>
                              <CheckCircle2 className="w-5 h-5 text-[#21a637]" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-[#e8f5ea]">CNH enviada</p>
                              <p className="text-xs text-[#6b9675] truncate">{cnhFileName}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setCnhPhotoUrl(null); setCnhFileName(null) }}
                              className="text-[#6b9675] hover:text-red-400 transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => cnhInputRef.current?.click()}
                            className="w-full flex flex-col items-center gap-2 py-4"
                          >
                            <FileImage className="w-8 h-8 text-[#21a637] opacity-60" />
                            <div className="text-center">
                              <p className="text-sm font-semibold text-[#e8f5ea]">Clique para enviar a foto da CNH</p>
                              <p className="text-xs text-[#6b9675] mt-0.5">JPG, PNG, WEBP ou PDF — máx. 10 MB</p>
                            </div>
                          </button>
                        )}
                        <input
                          ref={cnhInputRef}
                          type="file"
                          accept="image/jpeg,image/png,image/webp,application/pdf"
                          onChange={handleCnhChange}
                          className="hidden"
                        />
                      </div>
                      <p className="mt-1.5 text-xs text-[#2a4030]">
                        Envie uma foto legível da frente da CNH. Usamos para verificar sua habilitação.
                      </p>
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl font-semibold text-sm text-black transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]"
                      style={{
                        background: 'linear-gradient(135deg, #21a637 0%, #178a2e 100%)',
                        boxShadow: loading ? 'none' : '0 6px 24px rgba(33,166,55,0.35)',
                      }}
                    >
                      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                      {loading ? 'Enviando cadastro...' : 'Enviar cadastro para análise'}
                    </button>

                    <p className="text-center text-[11px] text-[#1a3020]">
                      © {new Date().getFullYear()} DirigeComigo — Fortaleza e região metropolitana.
                    </p>
                  </form>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  /* ── Student layout (auth card) ── */
  return (
    <>
      <h1 className="mb-1 text-xl font-extrabold text-[#e8f5ea]"
        style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
        Complete seu perfil
      </h1>
      <p className="mb-6 text-sm text-[#6b9675]">
        Só mais algumas informações para terminar seu cadastro.
      </p>

      {done ? (
        <StudentDoneScreen onContinue={() => router.push('/instrutores')} />
      ) : (
        <form onSubmit={studentForm.handleSubmit(handleStudentSubmit)} className="space-y-4">
          <Field label="Telefone" error={studentForm.formState.errors.phone?.message}>
            <input {...studentForm.register('phone')} placeholder="(85) 99999-0000" className={inputClass} />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Cidade" error={studentForm.formState.errors.city?.message}>
              <input {...studentForm.register('city')} className={inputClass} />
            </Field>
            <Field label="Estado" error={studentForm.formState.errors.state?.message}>
              <select {...studentForm.register('state')} className={`${inputClass} bg-[#061409]`}>
                {BRAZIL_STATES.map(state => (
                  <option key={state.value} value={state.value}>{state.value}</option>
                ))}
              </select>
            </Field>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-semibold text-sm text-black transition-all disabled:opacity-60 active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg, #21a637 0%, #178a2e 100%)', boxShadow: loading ? 'none' : '0 4px 16px rgba(33,166,55,0.3)' }}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Salvando...' : 'Concluir cadastro'}
          </button>
        </form>
      )}
    </>
  )
}

/* ─── Page ─────────────────────────────────────────────────────── */

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#020d04]">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#21a637]/15">
              <Loader2 className="h-9 w-9 animate-spin text-[#21a637]" />
            </div>
            <h1 className="mb-2 text-2xl font-bold text-[#e8f5ea]" style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
              Carregando onboarding
            </h1>
            <p className="text-sm text-[#6b9675]">Estamos preparando seu cadastro inicial.</p>
          </div>
        </div>
      }
    >
      <OnboardingContent />
    </Suspense>
  )
}
