'use client'

import { useEffect, useState } from 'react'
import { CheckSquare, Loader2, Square } from 'lucide-react'
import { toast } from 'sonner'
import { getProfileDataAction } from '../../perfil/actions'

const CATEGORIES = [
  { value: 'A', label: 'Categoria A', desc: 'Motocicletas', priceKey: 'price_per_lesson_a' },
  { value: 'B', label: 'Categoria B', desc: 'Carros', priceKey: 'price_per_lesson_b' },
  { value: 'C', label: 'Categoria C', desc: 'Veiculos pesados', priceKey: 'price_per_lesson_c' },
  { value: 'D', label: 'Categoria D', desc: 'Transporte de passageiros', priceKey: 'price_per_lesson_d' },
  { value: 'E', label: 'Categoria E', desc: 'Combinacao de veiculos', priceKey: 'price_per_lesson_e' },
]

const LESSON_TYPE_OPTIONS = [
  { value: 'exam_prep', label: 'Preparacao para exame' },
  { value: 'fear_driving', label: 'Medo de dirigir' },
]

const inp = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

export default function AulasAvulsasPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [prices, setPrices] = useState<Record<string, string>>({})
  const [acceptsStudentCar, setAcceptsStudentCar] = useState(false)
  const [lessonTypes, setLessonTypes] = useState<string[]>([])
  const [priceErrors, setPriceErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfileDataAction()
        const rawCats = Array.isArray(data?.categories) ? data.categories.map(String) : []
        const fallback = String(data?.category || '')
        const cats = rawCats.length > 0 ? rawCats
          : fallback === 'AB' ? ['A', 'B']
          : fallback ? [fallback]
          : []
        setSelectedCategories(cats)

        const initialPrices: Record<string, string> = {}
        CATEGORIES.forEach(({ value, priceKey }) => {
          const raw = (data as Record<string, unknown>)?.[priceKey] ?? data?.price_per_lesson
          if (raw != null) initialPrices[value] = String(Number(raw))
        })
        setPrices(initialPrices)
        setAcceptsStudentCar(Boolean(data?.accepts_student_car))

        const rawLessonTypes = data?.lesson_types
        if (Array.isArray(rawLessonTypes)) setLessonTypes(rawLessonTypes.map(String))
      } catch (err) {
        toast.error((err as Error).message || 'Erro ao carregar servicos.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const toggleCategory = (cat: string) => {
    setSelectedCategories(prev => prev.includes(cat) ? prev.filter(item => item !== cat) : [...prev, cat])
    setPriceErrors(prev => {
      const next = { ...prev }
      delete next[cat]
      return next
    })
  }

  const toggleLessonType = (value: string) => {
    setLessonTypes(prev => prev.includes(value) ? prev.filter(item => item !== value) : [...prev, value])
  }

  const handleSave = async () => {
    if (selectedCategories.length === 0) {
      toast.error('Selecione pelo menos uma categoria.')
      return
    }

    const errors: Record<string, string> = {}
    selectedCategories.forEach(cat => {
      const price = Number(prices[cat])
      if (!price || price < 1) errors[cat] = 'Informe um valor de no minimo R$ 1'
    })

    if (Object.keys(errors).length > 0) {
      setPriceErrors(errors)
      return
    }

    setSaving(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id
      if (!userId) throw new Error('Sessao expirada.')

      const catPrices = CATEGORIES.reduce((acc, { value, priceKey }) => {
        acc[priceKey] = selectedCategories.includes(value) ? Number(prices[value]) : null
        return acc
      }, {} as Record<string, number | null>)

      const allPrices = selectedCategories.map(cat => Number(prices[cat])).filter(price => price >= 1)
      const primaryCategory = selectedCategories.length === 1 ? selectedCategories[0]
        : selectedCategories.includes('A') && selectedCategories.includes('B') ? 'AB'
        : selectedCategories[0]

      const payload = {
        categories: selectedCategories,
        category: primaryCategory,
        price_per_lesson: Math.min(...allPrices),
        ...catPrices,
        accepts_student_car: acceptsStudentCar,
        lesson_types: lessonTypes,
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('instructors') as any).update(payload).eq('id', userId)
      if (error) throw error

      toast.success('Aulas avulsas atualizadas!')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao salvar servicos.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Aulas avulsas</h1>
        <p className="mt-1 text-sm text-gray-500">Defina categorias, preços por aula e modalidades que aparecem no perfil público.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900">Categorias que voce ensina</h2>
              <p className="mt-0.5 text-sm text-gray-500">Selecione uma ou mais e informe o valor por aula de cada.</p>
            </div>

            <div className="space-y-3">
              {CATEGORIES.map(({ value, label, desc }) => {
                const selected = selectedCategories.includes(value)
                return (
                  <div key={value} className={`rounded-xl border-2 transition-colors ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>
                    <button
                      type="button"
                      onClick={() => toggleCategory(value)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left"
                    >
                      {selected
                        ? <CheckSquare className="h-5 w-5 shrink-0 text-blue-600" />
                        : <Square className="h-5 w-5 shrink-0 text-gray-400" />
                      }
                      <div>
                        <p className={`text-sm font-semibold ${selected ? 'text-blue-700' : 'text-gray-700'}`}>{label}</p>
                        <p className="text-xs text-gray-500">{desc}</p>
                      </div>
                    </button>

                    {selected && (
                      <div className="px-4 pb-4">
                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-600">
                          Valor por aula (R$)
                        </label>
                        <input
                          type="number"
                          min={1}
                          value={prices[value] ?? ''}
                          onChange={event => {
                            setPrices(prev => ({ ...prev, [value]: event.target.value }))
                            setPriceErrors(prev => {
                              const next = { ...prev }
                              delete next[value]
                              return next
                            })
                          }}
                          className={`${inp} max-w-xs`}
                          placeholder="Ex: 100"
                        />
                        {priceErrors[value] ? (
                          <p className="mt-1 text-xs text-red-500">{priceErrors[value]}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            <label className="flex cursor-pointer items-center gap-3 pt-1">
              <button type="button" onClick={() => setAcceptsStudentCar(value => !value)} className="text-blue-600">
                {acceptsStudentCar
                  ? <CheckSquare className="h-5 w-5" />
                  : <Square className="h-5 w-5 text-gray-400" />
                }
              </button>
              <span className="text-sm font-medium text-gray-700">Aceito dar aula no carro do aluno</span>
            </label>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900">Tipos de aula oferecidos</h2>
              <p className="mt-0.5 text-sm text-gray-500">Selecione todas as modalidades que voce atende.</p>
            </div>

            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {LESSON_TYPE_OPTIONS.map(({ value, label }) => {
                const selected = lessonTypes.includes(value)
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => toggleLessonType(value)}
                    className={`flex items-center gap-3 rounded-xl border-2 px-4 py-3 text-left text-sm font-medium transition-colors ${
                      selected ? 'border-blue-600 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    {selected
                      ? <CheckSquare className="h-4 w-4 shrink-0" />
                      : <Square className="h-4 w-4 shrink-0 text-gray-400" />
                    }
                    {label}
                  </button>
                )
              })}
            </div>
          </section>

          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-700 py-3 font-bold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
          >
            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Salvando...</> : 'Salvar aulas avulsas'}
          </button>
        </div>
      )}
    </div>
  )
}
