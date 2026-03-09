'use client'

import { useEffect, useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, ShieldCheck, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { geocodeCepAction } from '@/lib/location'
import { deleteAvatarAction, getProfileDataAction, uploadAvatarAction } from './actions'

const schema = z.object({
  full_name: z.string().min(3, 'Nome muito curto'),
  email: z.string().email('E-mail invalido'),
  bio: z.string().max(400, 'Maximo 400 caracteres').optional(),
  neighborhood: z.string().min(2, 'Informe o bairro'),
  phone: z.string().optional(),
  service_mode: z.enum(['car', 'moto', 'both']),
  price_car: z.coerce.number().nullable(),
  price_moto: z.coerce.number().nullable(),
  min_advance_booking_hours: z.coerce.number().int().min(0, 'Minimo 0h').max(168, 'Maximo 168h'),
  cancellation_notice_hours: z.coerce.number().int().min(1, 'Minimo 1h').max(720, 'Maximo 720h'),
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

type FormData = z.infer<typeof schema>

type AddressSuggestion = {
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

function getFallbackLetter(name: string) {
  return name.trim().charAt(0).toUpperCase() || 'I'
}

export default function PainelPerfilPage() {
  const [saving, setSaving] = useState(false)
  const [loading, setLoading] = useState(true)
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null)
  const [originalAvatarUrl, setOriginalAvatarUrl] = useState<string | null>(null)
  const [avatarRemoved, setAvatarRemoved] = useState(false)
  const [avatarFallbackLetter, setAvatarFallbackLetter] = useState('I')
  const [locationQuery, setLocationQuery] = useState('')
  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false)
  const [locationSuggestions, setLocationSuggestions] = useState<AddressSuggestion[]>([])
  const [loadingLocationSuggestions, setLoadingLocationSuggestions] = useState(false)
  const [selectedCity, setSelectedCity] = useState('Fortaleza')
  const [selectedState, setSelectedState] = useState('CE')
  const [selectedLatitude, setSelectedLatitude] = useState<number | null>(null)
  const [selectedLongitude, setSelectedLongitude] = useState<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isDirty },
    reset,
  } = useForm<FormData>({
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    resolver: zodResolver(schema) as any,
    defaultValues: {
      full_name: '',
      email: '',
      bio: '',
      neighborhood: '',
      phone: '',
      service_mode: 'car',
      price_car: 80,
      price_moto: null,
      min_advance_booking_hours: 2,
      cancellation_notice_hours: 24,
    },
  })

  const serviceMode = watch('service_mode')

  useEffect(() => {
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
        const encodedQuery = encodeURIComponent(query)
        const urls = [
          `https://viacep.com.br/ws/CE/Fortaleza/${encodedQuery}/json/`,
          `https://viacep.com.br/ws/CE/Caucaia/${encodedQuery}/json/`,
        ]

        const responses = await Promise.all(urls.map(url => fetch(url, { cache: 'no-store' })))
        const payloads = await Promise.all(
          responses.map(async response => {
            if (!response.ok) return []
            const data = await response.json()
            return Array.isArray(data) ? data : []
          }),
        )

        if (!active) return

        const merged = payloads
          .flat()
          .filter((item): item is AddressSuggestion => Boolean(item?.cep && item?.bairro && item?.localidade))
          .slice(0, 10)

        setLocationSuggestions(merged)
      } catch {
        if (active) setLocationSuggestions([])
      } finally {
        if (active) setLoadingLocationSuggestions(false)
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [locationQuery, showLocationSuggestions])

  useEffect(() => {
    const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
    if (DEMO_MODE) {
      setLoading(false)
      return
    }

    const loadProfile = async () => {
      try {
        const data = await getProfileDataAction()
        const profile = data?.profile || {}
        const nextFullName = String(profile.full_name || '')
        const nextEmail = String(profile.email || '')
        const rawCategories = Array.isArray(data?.categories) ? data.categories : []
        const normalizedCategories = rawCategories.map((item: unknown) => String(item))
        const fallbackCategory = String(data?.category || '')
        const hasCar = normalizedCategories.includes('B') || fallbackCategory === 'B' || fallbackCategory === 'AB'
        const hasMoto = normalizedCategories.includes('A') || fallbackCategory === 'A' || fallbackCategory === 'AB'

        reset({
          full_name: nextFullName,
          email: nextEmail,
          bio: String(data?.bio || ''),
          neighborhood: String(data?.neighborhood || ''),
          phone: String(profile.phone || ''),
          service_mode: hasCar && hasMoto ? 'both' : hasMoto ? 'moto' : 'car',
          price_car: hasCar ? Number(data?.price_per_lesson_b ?? data?.price_per_lesson ?? 80) : null,
          price_moto: hasMoto ? Number(data?.price_per_lesson_a ?? data?.price_per_lesson ?? 80) : null,
          min_advance_booking_hours: Number(data?.min_advance_booking_hours ?? 2),
          cancellation_notice_hours: Number(data?.cancellation_notice_hours ?? 24),
        })

        const nextAvatarUrl = String(profile.avatar_url || '').trim() || null
        setAvatarUrl(nextAvatarUrl)
        setOriginalAvatarUrl(nextAvatarUrl)
        setAvatarRemoved(false)
        setAvatarFallbackLetter(getFallbackLetter(nextFullName))
        setLocationQuery(
          [String(data?.neighborhood || '').trim(), String(data?.city || '').trim()]
            .filter(Boolean)
            .join(', '),
        )
        setSelectedCity(String(data?.city || 'Fortaleza'))
        setSelectedState(String(data?.state || 'CE'))
        setSelectedLatitude(data?.latitude !== null && data?.latitude !== undefined ? Number(data.latitude) : null)
        setSelectedLongitude(data?.longitude !== null && data?.longitude !== undefined ? Number(data.longitude) : null)
      } catch (err) {
        toast.error((err as Error).message || 'Erro ao carregar perfil.')
      } finally {
        setLoading(false)
      }
    }

    void loadProfile()
  }, [reset])

  const handleSelectLocation = async (address: AddressSuggestion) => {
    setLocationQuery(`${address.logradouro || address.bairro} - ${address.bairro}, ${address.localidade}`)
    setValue('neighborhood', address.bairro, { shouldDirty: true, shouldValidate: true })
    setSelectedCity(address.localidade)
    setSelectedState(address.uf)
    setShowLocationSuggestions(false)

    try {
      const geocoded = await geocodeCepAction(address.cep)
      if (!geocoded) {
        setSelectedLatitude(null)
        setSelectedLongitude(null)
        toast.error('Nao foi possivel obter latitude e longitude para esse endereco.')
        return
      }

      setSelectedLatitude(geocoded.latitude)
      setSelectedLongitude(geocoded.longitude)
    } catch {
      setSelectedLatitude(null)
      setSelectedLongitude(null)
      toast.error('Nao foi possivel obter latitude e longitude para esse endereco.')
    }
  }

  const onSubmit = async (values: FormData) => {
    setSaving(true)
    try {
      const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
      if (DEMO_MODE) {
        await new Promise(resolve => setTimeout(resolve, 800))
        toast.success('Perfil atualizado!')
        return
      }

      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id
      if (!userId) throw new Error('Sessao expirada. Faca login novamente.')
      if (selectedLatitude === null || selectedLongitude === null) {
        throw new Error('Selecione um local valido para preencher latitude e longitude.')
      }
      if (!selectedCity || !selectedState) {
        throw new Error('Selecione um local valido em Fortaleza ou Caucaia.')
      }

      const profilePayload: Record<string, unknown> = {
        full_name: values.full_name,
        phone: values.phone || null,
        avatar_url: avatarRemoved ? null : avatarUrl,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: profileError } = await (supabase.from('profiles') as any)
        .update(profilePayload)
        .eq('id', userId)

      if (profileError) throw profileError

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

      const instructorPayload: Record<string, unknown> = {
        bio: values.bio || null,
        neighborhood: values.neighborhood,
        city: selectedCity,
        state: selectedState,
        latitude: selectedLatitude,
        longitude: selectedLongitude,
        category: primaryCategory,
        categories,
        price_per_lesson: Math.min(...selectedPrices),
        price_per_lesson_a: categories.includes('A') ? values.price_moto : null,
        price_per_lesson_b: categories.includes('B') ? values.price_car : null,
        vehicle_type: values.service_mode === 'both' ? 'Carro e moto' : values.service_mode === 'moto' ? 'Moto' : 'Carro',
        min_advance_booking_hours: values.min_advance_booking_hours,
        cancellation_notice_hours: values.cancellation_notice_hours,
      }

      const updateInstructor = async (payload: Record<string, unknown>) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return (supabase.from('instructors') as any)
          .update(payload)
          .eq('id', userId)
      }

      let instructorResult = await updateInstructor(instructorPayload)
      let instructorError = instructorResult.error as Error | null
      let removedColumnsCount = 0

      while (instructorError) {
        const message = String(instructorError.message || '')
        const match = message.match(/Could not find the '([^']+)' column/i)
        if (!match) break

        const missingColumn = match[1]
        if (!(missingColumn in instructorPayload)) break

        delete instructorPayload[missingColumn]
        removedColumnsCount += 1
        instructorResult = await updateInstructor(instructorPayload)
        instructorError = instructorResult.error as Error | null
      }

      if (instructorError) throw instructorError
      if (removedColumnsCount > 0) {
        toast.warning('Alguns campos nao existem no banco atual. O restante do perfil foi salvo.')
      }

      setOriginalAvatarUrl(avatarRemoved ? null : avatarUrl)
      toast.success('Perfil atualizado!')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao atualizar perfil.')
    } finally {
      setSaving(false)
    }
  }

  const handleChooseAvatar = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleRemoveAvatar = () => {
    if (originalAvatarUrl) {
      void deleteAvatarAction(originalAvatarUrl)
    }
    setAvatarUrl(null)
    setOriginalAvatarUrl(null)
    setAvatarRemoved(true)
  }

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Meu perfil profissional</h1>
          <p className="mt-1 text-sm text-gray-500">
            Aqui voce ajusta como seu perfil aparece para os alunos.
          </p>
        </div>
        <div className="inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
          <ShieldCheck className="h-4 w-4" />
          Perfil ativo
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleChooseAvatar}
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
              <p className="text-sm font-semibold text-gray-900">Foto publica do perfil</p>
              <p className="text-xs text-gray-500">Essa imagem aparece na busca e na pagina do instrutor.</p>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleChooseAvatar}
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

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Nome completo" error={errors.full_name?.message}>
              <input
                {...register('full_name')}
                onChange={event => {
                  register('full_name').onChange(event)
                  setAvatarFallbackLetter(getFallbackLetter(event.target.value))
                }}
                className={inp}
              />
            </Field>
            <Field label="E-mail da conta" error={errors.email?.message}>
              <input {...register('email')} readOnly className={`${inp} bg-gray-50 text-gray-500`} />
            </Field>
          </div>

          <Field label="Bio profissional" error={errors.bio?.message}>
            <textarea
              {...register('bio')}
              rows={4}
              placeholder="Descreva seu estilo de aula, experiencia e diferenciais."
              className={inp}
            />
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Telefone/WhatsApp" error={errors.phone?.message}>
              <input {...register('phone')} placeholder="(85) 99999-0000" className={inp} />
            </Field>
            <Field label="Sua localização" error={errors.neighborhood?.message}>
              <div className="relative">
                <input
                  value={locationQuery}
                  onChange={event => {
                    const value = event.target.value
                    setLocationQuery(value)
                    setValue('neighborhood', value, { shouldDirty: true, shouldValidate: true })
                    setSelectedCity('')
                    setSelectedState('')
                    setSelectedLatitude(null)
                    setSelectedLongitude(null)
                    setShowLocationSuggestions(true)
                  }}
                  onFocus={() => setShowLocationSuggestions(true)}
                  onBlur={() => {
                    window.setTimeout(() => setShowLocationSuggestions(false), 120)
                  }}
                  placeholder="Busque rua, bairro ou localidade"
                  className={inp}
                />
                <input type="hidden" {...register('neighborhood')} />
                {showLocationSuggestions && (loadingLocationSuggestions || locationSuggestions.length > 0) && (
                    <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
                      {loadingLocationSuggestions && (
                        <div className="px-4 py-3 text-sm text-gray-500">Buscando em Fortaleza e Caucaia...</div>
                      )}
                    {!loadingLocationSuggestions && locationSuggestions.map(item => (
                      <button
                        key={`${item.cep}-${item.logradouro}-${item.bairro}`}
                        type="button"
                        onMouseDown={event => {
                          event.preventDefault()
                          void handleSelectLocation(item)
                        }}
                        className="block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-blue-50"
                      >
                        <span className="block font-medium text-gray-900">{item.logradouro || item.bairro}</span>
                        <span className="block text-xs text-gray-500">{item.bairro} · {item.localidade} · CEP {item.cep}</span>
                      </button>
                    ))}
                    {!loadingLocationSuggestions && locationSuggestions.length === 0 && locationQuery.trim().length >= 3 && (
                      <div className="px-4 py-3 text-sm text-gray-500">Nenhum endereco encontrado em Fortaleza ou Caucaia.</div>
                    )}
                  </div>
                )}
              </div>
              <p className="mt-1 text-xs text-gray-400">
                A selecao preenche bairro, cidade, estado e coordenadas do mapa.
              </p>
              <p className="mt-1 text-xs text-gray-500">
                Latitude: {selectedLatitude !== null ? selectedLatitude.toFixed(6) : '-'} | Longitude: {selectedLongitude !== null ? selectedLongitude.toFixed(6) : '-'}
              </p>
            </Field>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Serviços e preços</h2>
            <p className="mt-1 text-sm text-gray-500">
              Defina o que você oferece hoje e quanto cobra por tipo de aula.
            </p>
          </div>

          <Field label="Serviços oferecidos" error={errors.service_mode?.message}>
            <div className="grid gap-3 sm:grid-cols-3">
              {[
                { value: 'car', label: 'Apenas carro' },
                { value: 'moto', label: 'Apenas moto' },
                { value: 'both', label: 'Carro e moto' },
              ].map(option => (
                <label
                  key={option.value}
                  className={`cursor-pointer rounded-2xl border p-4 text-sm font-semibold transition-colors ${
                    serviceMode === option.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  <input type="radio" value={option.value} {...register('service_mode')} className="sr-only" />
                  {option.label}
                </label>
              ))}
            </div>
          </Field>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {(serviceMode === 'car' || serviceMode === 'both') && (
              <Field label="Quanto voce quer receber por aula de carro? (R$)" error={errors.price_car?.message}>
                <input {...register('price_car')} type="number" min={50} className={inp} />
              </Field>
            )}

            {(serviceMode === 'moto' || serviceMode === 'both') && (
              <Field label="Quanto voce quer receber por aula de moto? (R$)" error={errors.price_moto?.message}>
                <input {...register('price_moto')} type="number" min={50} className={inp} />
              </Field>
            )}
          </div>

          <p className="text-xs text-gray-500">
            Esse e o valor liquido que voce quer receber. O checkout adiciona o acrescimo da plataforma conforme Pix ou cartao.
          </p>

        </section>

        <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Regras da agenda</h2>
            <p className="mt-1 text-sm text-gray-500">
              Controle com quanta antecedência o aluno pode agendar ou cancelar.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Field label="Aceitar agendamento ate (horas antes)" error={errors.min_advance_booking_hours?.message}>
              <input {...register('min_advance_booking_hours')} type="number" min={0} max={168} className={inp} />
            </Field>
            <Field label="Aceitar cancelamento ate (horas antes)" error={errors.cancellation_notice_hours?.message}>
              <input {...register('cancellation_notice_hours')} type="number" min={1} max={720} className={inp} />
            </Field>
          </div>
          <p className="rounded-lg border border-gray-200 bg-gray-50 px-3 py-2 text-xs text-gray-500">
            Padrão recomendado: agendamento com 2 horas de antecedência e cancelamento ate 24 horas antes da aula.
          </p>
        </section>

        <button
          type="submit"
          disabled={loading || !isDirty || saving}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
        >
          {loading ? <><Loader2 className="h-4 w-4 animate-spin" /> Carregando...</> : saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar alterações'}
        </button>
      </form>
    </div>
  )
}

const inp = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">{label}</label>
      {children}
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  )
}


