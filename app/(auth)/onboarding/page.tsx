'use client'

import { Suspense, useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  CheckCircle2, ChevronRight, Loader2, Trash2,
  Camera, FileImage, Clock, ShieldCheck, Car, Bike, Truck, Bus,
} from 'lucide-react'
import { toast } from 'sonner'

import { BRAZIL_STATES } from '@/constants/locations'
import { searchLocationSuggestionsAction, lookupCepAction, type AddressSuggestion } from '@/lib/location'
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
  phone: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 10 || v.length === 11, 'Informe um telefone válido com DDD (10 ou 11 dígitos)'),
  birth_date: z.string().min(1, 'Informe sua data de nascimento').refine(v => {
    const d = new Date(v)
    if (isNaN(d.getTime())) return false
    const age = (Date.now() - d.getTime()) / (1000 * 60 * 60 * 24 * 365.25)
    return age >= 18
  }, 'Você deve ter pelo menos 18 anos'),
  cpf: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 11, 'CPF inválido — informe 11 dígitos'),
  neighborhood: z.string().min(2, 'Informe sua localização'),
  service_mode: z.enum(['car', 'moto', 'both']).optional(),
  price_car: z.number().nullable().optional(),
  price_moto: z.number().nullable().optional(),
})

const studentSchema = z.object({
  phone: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 10 || v.length === 11, 'Informe um telefone válido com DDD (10 ou 11 dígitos)'),
  cep: z.string().transform(v => v.replace(/\D/g, '')).refine(v => v.length === 8, 'CEP inválido — informe 8 dígitos'),
  city: z.string().min(1, 'CEP não encontrado'),
  state: z.string().min(1, 'CEP não encontrado'),
  goal: z.enum(['exam', 'fear'], { error: 'Selecione seu objetivo' }),
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

const CNH_CATEGORIES = [
  { value: 'A',  label: 'Categoria A', desc: 'Motocicletas',              icon: Bike  },
  { value: 'B',  label: 'Categoria B', desc: 'Carros',                    icon: Car   },
  { value: 'C',  label: 'Categoria C', desc: 'Veículos pesados',          icon: Truck },
  { value: 'D',  label: 'Categoria D', desc: 'Transporte de passageiros', icon: Bus   },
  { value: 'E',  label: 'Categoria E', desc: 'Combinação de veículos',    icon: Truck },
]

const LESSON_TYPES = [
  { value: 'exam_prep',    label: 'Exame CNH',       desc: 'Preparação para prova prática' },
  { value: 'fear_driving', label: 'Medo de dirigir', desc: 'Aulas para quem quer destravar o medo' },
]

function maskCpf(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 3) return digits
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`
}

function maskPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11)
  if (digits.length <= 2) return digits
  if (digits.length <= 6) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`
  if (digits.length <= 10) return `(${digits.slice(0, 2)}) ${digits.slice(2, 6)}-${digits.slice(6)}`
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`
}

function getFallbackLetter(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'I'
}

/* ─── Input / Field helpers ────────────────────────────────────── */

const inputClass = 'w-full px-4 py-3 bg-white/[0.06] border border-white/[0.18] rounded-xl text-sm text-white placeholder:text-[#6b7280] focus:outline-none focus:border-white/40 focus:ring-2 focus:ring-white/10 transition-all'
const inputClassReadonly = `${inputClass} opacity-50 cursor-not-allowed`
const inputClassLight = 'w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition-all'

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-1.5">{label}</label>
      {children}
      {hint && !error && <p className="mt-1 text-xs text-[#6b7280]">{hint}</p>}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  )
}

/* ─── Done screen (instructor) ─────────────────────────────────── */

function InstructorDoneScreen() {
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
          { icon: CheckCircle2, text: 'Você receberá um WhatsApp quando aprovado' },
        ].map(({ icon: Icon, text }, i) => (
          <div key={i} className="flex items-start gap-3">
            <Icon className="w-4 h-4 text-[#21a637] mt-0.5 flex-shrink-0" />
            <p className="text-sm text-[#6b9675]">{text}</p>
          </div>
        ))}
      </div>

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
      <h2 className="mb-2 text-xl font-bold text-gray-900"
        style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
        Tudo pronto!
      </h2>
      <p className="mb-6 text-sm text-gray-500">
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
  const returnUrl = searchParams.get('returnUrl') || ''
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

  // Categories & prices
  const [selectedCategories, setSelectedCategories] = useState<string[]>(['B'])
  const [categoryPrices, setCategoryPrices] = useState<Record<string, string>>({ B: '80' })
  const [categoriesError, setCategoriesError] = useState<string | null>(null)

  // Lesson options
  const [acceptsStudentCar, setAcceptsStudentCar] = useState(false)
  const [selectedLessonTypes, setSelectedLessonTypes] = useState<string[]>([])

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
    defaultValues: { full_name: '', email: '', phone: '', birth_date: '', cpf: '', neighborhood: '' },
  })

  const [cepLookupStatus, setCepLookupStatus] = useState<'idle' | 'loading' | 'found' | 'notfound'>('idle')
  const [cepFoundAddress, setCepFoundAddress] = useState<{ city: string; state: string } | null>(null)

  const studentForm = useForm<StudentFormData>({
    resolver: zodResolver(studentSchema),
    defaultValues: { city: '', state: '', phone: '', cep: '' },
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
    // Validate categories
    if (selectedCategories.length === 0) {
      setCategoriesError('Selecione pelo menos uma categoria.')
      return
    }
    for (const cat of selectedCategories) {
      const price = Number(categoryPrices[cat] || 0)
      if (!price || price < 1) {
        setCategoriesError(`Informe um valor de no mínimo R$1 para a Categoria ${cat}.`)
        return
      }
    }
    setCategoriesError(null)

    setLoading(true)
    try {
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user
      if (!user) throw new Error('Sessão expirada. Faça login novamente.')

      await updateProfilesUpsert(user.id, { full_name: values.full_name, phone: values.phone, email: values.email, role: 'instructor' })

      const categories = [...selectedCategories].sort()
      const primaryCategory = categories.length === 1 ? categories[0] : categories.includes('A') && categories.includes('B') ? 'AB' : categories[0]
      const prices = selectedCategories.map(cat => Number(categoryPrices[cat] || 0)).filter(p => p >= 1)
      const pricePerLesson = Math.min(...prices)

      if (selectedLatitude === null || selectedLongitude === null) throw new Error('Selecione um local válido para preencher latitude e longitude.')
      if (!selectedCity || !selectedState) throw new Error('Selecione um local válido em Fortaleza ou Caucaia.')

      const vehicleTypeLabel = categories.map(cat => CNH_CATEGORIES.find(c => c.value === cat)?.desc || cat).join(' e ')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const instructorPayload: any = {
        id: user.id, profile_id: user.id,
        category: primaryCategory, categories,
        price_per_lesson: pricePerLesson,
        price_per_lesson_a: categories.includes('A') ? Number(categoryPrices['A'] || 0) : null,
        price_per_lesson_b: categories.includes('B') ? Number(categoryPrices['B'] || 0) : null,
        price_per_lesson_c: categories.includes('C') ? Number(categoryPrices['C'] || 0) : null,
        price_per_lesson_d: categories.includes('D') ? Number(categoryPrices['D'] || 0) : null,
        price_per_lesson_e: categories.includes('E') ? Number(categoryPrices['E'] || 0) : null,
        accepts_student_car: acceptsStudentCar,
        lesson_types: selectedLessonTypes,
        vehicle_type: vehicleTypeLabel,
        neighborhood: values.neighborhood, city: selectedCity, state: selectedState,
        latitude: selectedLatitude, longitude: selectedLongitude,
        birth_date: values.birth_date || null,
        cpf: values.cpf || null,
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

  /* CEP lookup */
  async function handleCepChange(raw: string) {
    const clean = raw.replace(/\D/g, '')
    const masked = clean.length > 5 ? `${clean.slice(0, 5)}-${clean.slice(5, 8)}` : clean
    studentForm.setValue('cep', masked, { shouldValidate: false })
    if (clean.length !== 8) {
      if (cepLookupStatus !== 'idle') setCepLookupStatus('idle')
      setCepFoundAddress(null)
      studentForm.setValue('city', '', { shouldValidate: false })
      studentForm.setValue('state', '', { shouldValidate: false })
      return
    }
    setCepLookupStatus('loading')
    const result = await lookupCepAction(clean)
    if (result) {
      studentForm.setValue('city', result.city, { shouldValidate: true })
      studentForm.setValue('state', result.state, { shouldValidate: true })
      setCepFoundAddress({ city: result.city, state: result.state })
      setCepLookupStatus('found')
    } else {
      studentForm.setValue('city', '', { shouldValidate: true })
      studentForm.setValue('state', '', { shouldValidate: true })
      setCepFoundAddress(null)
      setCepLookupStatus('notfound')
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
      const studentPayload: any = { id: user.id, profile_id: user.id, city: values.city, state: values.state, cep: values.cep, goal: values.goal }
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

/* ── Instructor layout (full-screen split) ── */
  if (isInstructor) {
    return (
      <div className="fixed inset-0 z-50 flex overflow-hidden bg-[#0d0d10]">
        <AuthLeftPanel
          headline={<>Seja um<br /><span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(120deg,#21a637 0%,#f6c400 100%)' }}>instrutor.</span></>}
          subtext="Complete seu cadastro para começar a receber alunos em Fortaleza e região metropolitana."
        />

        <div className="flex-1 flex flex-col items-center justify-start px-6 py-10 lg:px-10 overflow-y-auto bg-[#0d0d10]">
          {/* Mobile logo */}
          <div className="lg:hidden mb-6 self-start w-full max-w-lg mx-auto">
            <Link href="/"><BrandLogo className="h-10 w-auto rounded-md" priority /></Link>
          </div>

          <div className="w-full max-w-lg">
            {done ? (
              <InstructorDoneScreen />
            ) : (
              <>
                <h1
                  className="text-2xl font-bold text-white mb-1"
                  style={{ fontFamily: 'Syne, system-ui, sans-serif' }}
                >
                  Concluir cadastro
                </h1>
                <p className="text-sm text-[#9ca3af] mb-7">
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
                    <Loader2 className="w-6 h-6 animate-spin text-white/60" />
                    <span className="ml-3 text-sm text-[#9ca3af]">Carregando seus dados...</span>
                  </div>
                ) : (
                  <form onSubmit={instructorForm.handleSubmit(handleInstructorSubmit)} className="space-y-5">
                    {/* Avatar */}
                    <div className="flex items-center gap-4 rounded-2xl p-4"
                      style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-full transition-opacity hover:opacity-80"
                        style={{ border: '2px solid rgba(255,255,255,0.15)', background: 'rgba(255,255,255,0.05)' }}
                        disabled={avatarUploading}
                      >
                        {avatarUploading ? (
                          <div className="flex h-full w-full items-center justify-center">
                            <Loader2 className="w-5 h-5 animate-spin text-white/60" />
                          </div>
                        ) : avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={avatarUrl} alt="Avatar" className="h-full w-full object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <span className="text-2xl font-bold text-white/60">{avatarFallbackLetter}</span>
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-end justify-center pb-1 opacity-0 hover:opacity-100 transition-opacity">
                          <Camera className="w-4 h-4 text-white drop-shadow" />
                        </div>
                      </button>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-white">Foto de perfil</p>
                        <p className="text-xs text-[#9ca3af] mb-2 mt-0.5">Essa foto será exibida aos alunos no seu perfil público.</p>
                        <div className="flex gap-2 flex-wrap">
                          <button type="button" onClick={() => fileInputRef.current?.click()} disabled={avatarUploading}
                            className="px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 transition-colors"
                            style={{ border: '1px solid rgba(255,255,255,0.2)', background: 'rgba(255,255,255,0.06)' }}>
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
                      <Field label="Data de nascimento" error={instructorForm.formState.errors.birth_date?.message}>
                        <input
                          {...instructorForm.register('birth_date')}
                          type="date"
                          className={inputClass}
                          style={{ colorScheme: 'dark' }}
                        />
                      </Field>
                      <Field label="CPF" error={instructorForm.formState.errors.cpf?.message}>
                        <input
                          {...instructorForm.register('cpf')}
                          placeholder="000.000.000-00"
                          maxLength={14}
                          onChange={e => {
                            const masked = maskCpf(e.target.value)
                            instructorForm.setValue('cpf', masked, { shouldDirty: true, shouldValidate: true })
                            e.target.value = masked
                          }}
                          className={inputClass}
                        />
                      </Field>
                    </div>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                      <Field label="E-mail" error={instructorForm.formState.errors.email?.message}>
                        <input {...instructorForm.register('email')} readOnly className={inputClassReadonly} />
                      </Field>
                      <Field label="Telefone" error={instructorForm.formState.errors.phone?.message}>
                        <input
                          {...instructorForm.register('phone')}
                          placeholder="(85) 99999-0000"
                          maxLength={16}
                          onChange={e => {
                            const masked = maskPhone(e.target.value)
                            instructorForm.setValue('phone', masked, { shouldDirty: true, shouldValidate: true })
                            e.target.value = masked
                          }}
                          className={inputClass}
                        />
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
                            style={{ background: '#1c1c24', border: '1px solid rgba(255,255,255,0.12)' }}>
                            {loadingLocationSuggestions && (
                              <div className="px-4 py-3 text-sm text-[#9ca3af]">Buscando endereços...</div>
                            )}
                            {!loadingLocationSuggestions && locationSuggestions.map(item => (
                              <button
                                key={item.id}
                                type="button"
                                onMouseDown={event => { event.preventDefault(); void handleSelectLocation(item) }}
                                className="block w-full px-4 py-3 text-left text-sm transition-colors hover:bg-white/[0.05]"
                              >
                                <span className="block font-medium text-white">{item.logradouro || item.bairro}</span>
                                <span className="block text-xs text-[#6b7280]">
                                  {[item.bairro, item.localidade, item.cep ? `CEP ${item.cep}` : ''].filter(Boolean).join(' · ')}
                                </span>
                              </button>
                            ))}
                            {!loadingLocationSuggestions && locationSuggestions.length === 0 && locationQuery.trim().length >= 3 && (
                              <div className="px-4 py-3 text-sm text-[#9ca3af]">Nenhum endereço encontrado.</div>
                            )}
                          </div>
                        )}
                      </div>
                    </Field>

                    {/* Categories */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-2">
                        Serviços oferecidos
                      </label>
                      <div className="grid gap-2 grid-cols-2 sm:grid-cols-3">
                        {CNH_CATEGORIES.map(({ value, label, desc, icon: Icon }) => {
                          const active = selectedCategories.includes(value)
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setCategoriesError(null)
                                setSelectedCategories(prev =>
                                  prev.includes(value) ? prev.filter(c => c !== value) : [...prev, value]
                                )
                              }}
                              className="rounded-xl p-3 text-left transition-all"
                              style={active
                                ? { border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)' }
                                : { border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                            >
                              <Icon className={`w-4 h-4 mb-1.5 ${active ? 'text-white' : 'text-[#6b7280]'}`} />
                              <p className={`text-xs font-bold ${active ? 'text-white' : 'text-[#6b7280]'}`}>{label}</p>
                              <p className={`text-[11px] ${active ? 'text-white/60' : 'text-[#4b5563]'}`}>{desc}</p>
                            </button>
                          )
                        })}
                      </div>
                      {categoriesError && <p className="mt-1.5 text-xs text-red-400">{categoriesError}</p>}
                    </div>

                    {/* Price per selected category */}
                    {selectedCategories.length > 0 && (
                      <div className="space-y-3">
                        <p className="text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest">
                          Valor por aula (R$)
                        </p>
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {selectedCategories.sort().map(cat => {
                            const catInfo = CNH_CATEGORIES.find(c => c.value === cat)
                            return (
                              <div key={cat}>
                                <label className="block text-xs text-[#9ca3af] mb-1">
                                  {catInfo?.label} — {catInfo?.desc}
                                </label>
                                <input
                                  type="number"
                                  min={1}
                                  placeholder="Ex: 80"
                                  value={categoryPrices[cat] ?? ''}
                                  onChange={e => {
                                    setCategoriesError(null)
                                    setCategoryPrices(prev => ({ ...prev, [cat]: e.target.value }))
                                  }}
                                  className={inputClass}
                                />
                              </div>
                            )
                          })}
                        </div>
                        <p className="text-xs text-[#6b7280]">
                          Informe o valor líquido que você quer receber. O aluno verá o acréscimo no checkout conforme Pix ou cartão.
                        </p>
                      </div>
                    )}

                    {/* Accepts student car */}
                    <button
                      type="button"
                      onClick={() => setAcceptsStudentCar(prev => !prev)}
                      className="w-full flex items-center justify-between rounded-xl p-4 transition-all"
                      style={acceptsStudentCar
                        ? { border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)' }
                        : { border: '2px solid rgba(255,255,255,0.1)', background: 'rgba(255,255,255,0.03)' }}
                    >
                      <div className="text-left">
                        <p className={`text-sm font-semibold ${acceptsStudentCar ? 'text-white' : 'text-[#6b7280]'}`}>
                          Aceito dar aula no veículo do aluno
                        </p>
                        <p className="text-xs text-[#4b5563] mt-0.5">
                          O aluno traz o próprio veículo (carro, moto, caminhão…)
                        </p>
                      </div>
                      <div
                        className="w-11 h-6 rounded-full flex-shrink-0 transition-all relative"
                        style={{ background: acceptsStudentCar ? '#16a34a' : 'rgba(255,255,255,0.1)' }}
                      >
                        <div
                          className="absolute top-0.5 w-5 h-5 rounded-full bg-white transition-all"
                          style={{ left: acceptsStudentCar ? '22px' : '2px' }}
                        />
                      </div>
                    </button>

                    {/* Lesson types */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-2">
                        Modalidades de aula
                      </label>
                      <div className="space-y-2">
                        {LESSON_TYPES.map(({ value, label, desc }) => {
                          const active = selectedLessonTypes.includes(value)
                          return (
                            <button
                              key={value}
                              type="button"
                              onClick={() => setSelectedLessonTypes(prev =>
                                prev.includes(value) ? prev.filter(t => t !== value) : [...prev, value]
                              )}
                              className="w-full flex items-center gap-3 rounded-xl px-4 py-3 text-left transition-all"
                              style={active
                                ? { border: '2px solid rgba(255,255,255,0.4)', background: 'rgba(255,255,255,0.08)' }
                                : { border: '2px solid rgba(255,255,255,0.08)', background: 'rgba(255,255,255,0.02)' }}
                            >
                              <div
                                className="w-4 h-4 rounded flex-shrink-0 flex items-center justify-center transition-all"
                                style={active
                                  ? { background: 'rgba(255,255,255,0.9)', border: '2px solid white' }
                                  : { background: 'transparent', border: '2px solid rgba(255,255,255,0.2)' }}
                              >
                                {active && <CheckCircle2 className="w-3 h-3 text-black" />}
                              </div>
                              <div>
                                <p className={`text-sm font-semibold ${active ? 'text-white' : 'text-[#6b7280]'}`}>{label}</p>
                                <p className="text-xs text-[#4b5563]">{desc}</p>
                              </div>
                            </button>
                          )
                        })}
                      </div>
                    </div>

                    {/* CNH upload */}
                    <div>
                      <label className="block text-[10px] font-semibold text-[#9ca3af] uppercase tracking-widest mb-1.5">
                        Foto da CNH <span className="text-white/60">*</span>
                      </label>
                      <div
                        className="relative rounded-2xl p-5 transition-all"
                        style={{ background: 'rgba(255,255,255,0.03)', border: cnhPhotoUrl ? '1px solid rgba(255,255,255,0.3)' : '1px dashed rgba(255,255,255,0.15)' }}
                      >
                        {cnhUploading ? (
                          <div className="flex flex-col items-center gap-2 py-4">
                            <Loader2 className="w-6 h-6 animate-spin text-white/60" />
                            <p className="text-xs text-[#9ca3af]">Enviando...</p>
                          </div>
                        ) : cnhPhotoUrl ? (
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                              style={{ background: 'rgba(255,255,255,0.08)' }}>
                              <CheckCircle2 className="w-5 h-5 text-white/80" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-white">CNH enviada</p>
                              <p className="text-xs text-[#9ca3af] truncate">{cnhFileName}</p>
                            </div>
                            <button
                              type="button"
                              onClick={() => { setCnhPhotoUrl(null); setCnhFileName(null) }}
                              className="text-[#6b7280] hover:text-red-400 transition-colors"
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
                            <FileImage className="w-8 h-8 text-white/40" />
                            <div className="text-center">
                              <p className="text-sm font-semibold text-white">Clique para enviar a foto da CNH</p>
                              <p className="text-xs text-[#9ca3af] mt-0.5">JPG, PNG, WEBP ou PDF — máx. 10 MB</p>
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
                      <p className="mt-1.5 text-xs text-[#6b7280]">
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

                    <p className="text-center text-[11px] text-[#6b7280]">
                      © {new Date().getFullYear()} DireçãoFácil — Fortaleza e região metropolitana.
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
      <h1 className="mb-1 text-xl font-extrabold text-gray-900"
        style={{ fontFamily: 'Syne, system-ui, sans-serif' }}>
        Complete seu perfil
      </h1>
      <p className="mb-6 text-sm text-gray-500">
        Só mais algumas informações para terminar seu cadastro.
      </p>

      {done ? (
        <StudentDoneScreen onContinue={() => router.push(returnUrl || '/instrutores')} />
      ) : (
        <form onSubmit={studentForm.handleSubmit(handleStudentSubmit)} className="space-y-4">
          <div>
            <p className="mb-2 text-sm font-semibold text-gray-700">Qual é o seu objetivo?</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {([
                { value: 'exam', label: 'Tirar a CNH', desc: 'Preparação para o exame' },
                { value: 'fear', label: 'Já tenho CNH e quero perder o medo', desc: 'Aulas para ganhar confiança' },
              ] as const).map(({ value, label, desc }) => {
                const selected = studentForm.watch('goal') === value
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => studentForm.setValue('goal', value, { shouldValidate: true })}
                    className={`flex flex-col items-start rounded-xl border-2 px-4 py-3 text-left transition-colors ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}
                  >
                    <span className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-gray-800'}`}>{label}</span>
                    <span className="text-xs text-gray-500">{desc}</span>
                  </button>
                )
              })}
            </div>
            {studentForm.formState.errors.goal && (
              <p className="mt-1 text-xs text-red-500">{studentForm.formState.errors.goal.message}</p>
            )}
          </div>

          <Field label="Telefone" error={studentForm.formState.errors.phone?.message}>
            <input
              {...studentForm.register('phone')}
              placeholder="(85) 99999-0000"
              maxLength={16}
              onChange={e => {
                const masked = maskPhone(e.target.value)
                studentForm.setValue('phone', masked, { shouldDirty: true, shouldValidate: true })
                e.target.value = masked
              }}
              className={inputClassLight}
            />
          </Field>

          <Field label="CEP" error={studentForm.formState.errors.cep?.message || studentForm.formState.errors.city?.message}>
            <div className="relative">
              <input
                value={studentForm.watch('cep') || ''}
                onChange={e => handleCepChange(e.target.value)}
                placeholder="00000-000"
                maxLength={9}
                inputMode="numeric"
                className={inputClassLight}
              />
              {cepLookupStatus === 'loading' && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-blue-500" />
              )}
              {cepLookupStatus === 'found' && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-500" />
              )}
            </div>
            {cepLookupStatus === 'found' && cepFoundAddress && (
              <p className="mt-1.5 text-xs text-green-600 font-medium">
                {cepFoundAddress.city} — {cepFoundAddress.state}
              </p>
            )}
            {cepLookupStatus === 'notfound' && (
              <p className="mt-1 text-xs text-red-500">CEP não encontrado. Verifique e tente novamente.</p>
            )}
          </Field>

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
