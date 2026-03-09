'use client'

import { useEffect, useState } from 'react'
import { BookOpen, Loader2, Package, Pencil, Plus, Tag, ToggleLeft, ToggleRight, Trash2 } from 'lucide-react'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'
import type { LessonPackage } from '@/types'
import type { Database, VehicleCategory } from '@/types/database'
import { formatCurrency } from '@/utils/format'

const CATEGORY_OPTIONS: { value: VehicleCategory; label: string }[] = [
  { value: 'A', label: 'Cat. A - Moto' },
  { value: 'B', label: 'Cat. B - Carro' },
  { value: 'AB', label: 'Cat. AB - Moto e carro' },
  { value: 'C', label: 'Cat. C - Caminhao' },
  { value: 'D', label: 'Cat. D - Onibus' },
  { value: 'E', label: 'Cat. E - Carreta' },
]

const CAT_BADGE: Record<string, string> = {
  A: 'bg-orange-100 text-orange-700',
  B: 'bg-blue-100 text-blue-700',
  AB: 'bg-indigo-100 text-indigo-700',
  C: 'bg-green-100 text-green-700',
  D: 'bg-yellow-100 text-yellow-700',
  E: 'bg-gray-100 text-gray-700',
}

const EMPTY_FORM = {
  name: '',
  description: '',
  lessons_count: 5,
  price: 0,
  category: 'B' as VehicleCategory,
}

type PackageForm = typeof EMPTY_FORM
type PackageInsert = Database['public']['Tables']['lesson_packages']['Insert']
type PackageUpdate = Database['public']['Tables']['lesson_packages']['Update']

function normalizePackage(row: Database['public']['Tables']['lesson_packages']['Row']): LessonPackage {
  return {
    id: row.id,
    instructor_id: row.instructor_id,
    name: row.name,
    description: row.description,
    lessons_count: row.lessons_count,
    price: Number(row.price),
    category: row.category,
    is_active: row.is_active,
  }
}

export default function PacotesPage() {
  const [packages, setPackages] = useState<LessonPackage[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState<PackageForm>(EMPTY_FORM)
  const [errors, setErrors] = useState<Partial<Record<keyof PackageForm, string>>>({})

  useEffect(() => {
    const loadPackages = async () => {
      try {
        const supabase = createClient()
        const lessonPackagesTable = supabase.from('lesson_packages') as any
        const { data: authData } = await supabase.auth.getUser()
        const userId = authData.user?.id
        if (!userId) throw new Error('Sessao expirada. Faca login novamente.')

        const { data, error } = await lessonPackagesTable
          .select('*')
          .eq('instructor_id', userId)
          .order('created_at', { ascending: false })

        if (error) throw error
        setPackages((data || []).map(normalizePackage))
      } catch (err) {
        toast.error((err as Error).message || 'Erro ao carregar pacotes.')
      } finally {
        setLoading(false)
      }
    }

    void loadPackages()
  }, [])

  function resetForm() {
    setForm(EMPTY_FORM)
    setErrors({})
    setEditingId(null)
    setShowForm(false)
  }

  function validate() {
    const nextErrors: Partial<Record<keyof PackageForm, string>> = {}
    if (!form.name.trim()) nextErrors.name = 'Nome obrigatorio'
    if (form.lessons_count < 2) nextErrors.lessons_count = 'Minimo de 2 aulas'
    if (form.price <= 0) nextErrors.price = 'Preco deve ser maior que zero'
    setErrors(nextErrors)
    return Object.keys(nextErrors).length === 0
  }

  async function handleSave() {
    if (!validate()) return

    setSaving(true)
    try {
      const supabase = createClient()
      const lessonPackagesTable = supabase.from('lesson_packages') as any
      const { data: authData } = await supabase.auth.getUser()
      const userId = authData.user?.id
      if (!userId) throw new Error('Sessao expirada. Faca login novamente.')

      const basePayload = {
        name: form.name.trim(),
        description: form.description.trim() || null,
        lessons_count: form.lessons_count,
        price: Number(form.price),
        category: form.category,
      }

      if (editingId) {
        const updatePayload: PackageUpdate = basePayload
        const { data, error } = await lessonPackagesTable
          .update(updatePayload)
          .eq('id', editingId)
          .eq('instructor_id', userId)
          .select('*')
          .single()

        if (error) throw error

        const nextPackage = normalizePackage(data)
        setPackages(prev => prev.map(pkg => pkg.id === editingId ? nextPackage : pkg))
        toast.success('Pacote atualizado!')
      } else {
        const insertPayload: PackageInsert = {
          ...basePayload,
          instructor_id: userId,
          is_active: true,
        }

        const { data, error } = await lessonPackagesTable
          .insert(insertPayload)
          .select('*')
          .single()

        if (error) throw error

        setPackages(prev => [normalizePackage(data), ...prev])
        toast.success('Pacote criado!')
      }

      resetForm()
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao salvar pacote.')
    } finally {
      setSaving(false)
    }
  }

  function handleEdit(pkg: LessonPackage) {
    setEditingId(pkg.id)
    setForm({
      name: pkg.name,
      description: pkg.description || '',
      lessons_count: pkg.lessons_count,
      price: pkg.price,
      category: pkg.category,
    })
    setErrors({})
    setShowForm(true)
  }

  async function toggleActive(pkg: LessonPackage) {
    try {
      const supabase = createClient()
      const lessonPackagesTable = supabase.from('lesson_packages') as any
      const { data, error } = await lessonPackagesTable
        .update({ is_active: !pkg.is_active })
        .eq('id', pkg.id)
        .select('*')
        .single()

      if (error) throw error

      const nextPackage = normalizePackage(data)
      setPackages(prev => prev.map(item => item.id === pkg.id ? nextPackage : item))
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao alterar status do pacote.')
    }
  }

  async function deletePackage(id: string) {
    try {
      const supabase = createClient()
      const lessonPackagesTable = supabase.from('lesson_packages') as any
      const { error } = await lessonPackagesTable
        .delete()
        .eq('id', id)

      if (error) throw error

      setPackages(prev => prev.filter(pkg => pkg.id !== id))
      if (editingId === id) resetForm()
      toast.success('Pacote excluido!')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao excluir pacote.')
    }
  }

  const active = packages.filter(pkg => pkg.is_active)
  const inactive = packages.filter(pkg => !pkg.is_active)

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Pacotes de aulas</h1>
          <p className="mt-0.5 text-sm text-gray-500">
            Crie pacotes com desconto para aumentar suas conversoes.
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (showForm && !editingId) {
              resetForm()
              return
            }
            setEditingId(null)
            setForm(EMPTY_FORM)
            setErrors({})
            setShowForm(true)
          }}
          className="flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800"
        >
          <Plus className="h-4 w-4" />
          {showForm && !editingId ? 'Fechar' : 'Novo pacote'}
        </button>
      </div>

      {showForm && (
        <div className="space-y-4 rounded-2xl border border-blue-100 bg-white p-6 shadow-sm">
          <h2 className="flex items-center gap-2 font-bold text-gray-900">
            <Package className="h-5 w-5 text-blue-700" />
            {editingId ? 'Editar pacote' : 'Criar novo pacote'}
          </h2>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Nome do pacote *
              </label>
              <input
                type="text"
                placeholder="Ex: Pacote Iniciante"
                value={form.name}
                onChange={event => setForm(prev => ({ ...prev, name: event.target.value }))}
                className={inputClassName}
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div className="sm:col-span-2">
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Descricao
              </label>
              <textarea
                rows={2}
                placeholder="Descreva o que esta incluso no pacote..."
                value={form.description}
                onChange={event => setForm(prev => ({ ...prev, description: event.target.value }))}
                className={`${inputClassName} resize-none`}
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Numero de aulas *
              </label>
              <input
                type="number"
                min={2}
                value={form.lessons_count}
                onChange={event => setForm(prev => ({ ...prev, lessons_count: Number.parseInt(event.target.value, 10) || 2 }))}
                className={inputClassName}
              />
              {errors.lessons_count && <p className="mt-1 text-xs text-red-600">{errors.lessons_count}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Preco do pacote (R$) *
              </label>
              <input
                type="number"
                min={1}
                step={0.01}
                placeholder="0,00"
                value={form.price || ''}
                onChange={event => setForm(prev => ({ ...prev, price: Number.parseFloat(event.target.value) || 0 }))}
                className={inputClassName}
              />
              {errors.price && <p className="mt-1 text-xs text-red-600">{errors.price}</p>}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-gray-500">
                Categoria CNH *
              </label>
              <select
                value={form.category}
                onChange={event => setForm(prev => ({ ...prev, category: event.target.value as VehicleCategory }))}
                className={`${inputClassName} bg-white`}
              >
                {CATEGORY_OPTIONS.map(option => (
                  <option key={option.value} value={option.value}>{option.label}</option>
                ))}
              </select>
            </div>

            {form.price > 0 && form.lessons_count >= 2 && (
              <div className="flex items-end">
                <p className="text-sm text-gray-500">
                  {formatCurrency(form.price / form.lessons_count)} por aula neste pacote.
                </p>
              </div>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="rounded-xl bg-blue-700 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-800 disabled:opacity-50"
            >
              {saving ? 'Salvando...' : editingId ? 'Salvar alteracoes' : 'Salvar pacote'}
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="rounded-xl border border-gray-200 px-4 py-2 text-sm font-medium text-gray-500 transition-colors hover:border-gray-300 hover:text-gray-700"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center rounded-2xl border border-gray-100 bg-white py-16 text-gray-500 shadow-sm">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Carregando pacotes...
        </div>
      ) : (
        <>
          <section>
            <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">
              Ativos ({active.length})
            </h2>
            {active.length === 0 ? (
              <EmptyState />
            ) : (
              <div className="space-y-3">
                {active.map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onEdit={() => handleEdit(pkg)}
                    onToggle={() => void toggleActive(pkg)}
                    onDelete={() => void deletePackage(pkg.id)}
                  />
                ))}
              </div>
            )}
          </section>

          {inactive.length > 0 && (
            <section>
              <h2 className="mb-3 text-sm font-bold uppercase tracking-widest text-gray-400">
                Inativos ({inactive.length})
              </h2>
              <div className="space-y-3 opacity-70">
                {inactive.map(pkg => (
                  <PackageCard
                    key={pkg.id}
                    pkg={pkg}
                    onEdit={() => handleEdit(pkg)}
                    onToggle={() => void toggleActive(pkg)}
                    onDelete={() => void deletePackage(pkg.id)}
                  />
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  )
}

function EmptyState() {
  return (
    <div className="rounded-2xl border border-dashed border-gray-200 bg-white py-12 text-center text-gray-400">
      <Package className="mx-auto mb-2 h-10 w-10 opacity-40" />
      <p className="text-sm">Nenhum pacote ativo. Crie o primeiro.</p>
    </div>
  )
}

function PackageCard({
  pkg,
  onEdit,
  onToggle,
  onDelete,
}: {
  pkg: LessonPackage
  onEdit: () => void
  onToggle: () => void
  onDelete: () => void
}) {
  const perLesson = pkg.price / pkg.lessons_count

  return (
    <div className="flex items-start gap-4 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-bold text-gray-900">{pkg.name}</span>
          <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${CAT_BADGE[pkg.category] ?? 'bg-gray-100 text-gray-600'}`}>
            Cat. {pkg.category}
          </span>
        </div>
        {pkg.description && (
          <p className="mt-1 line-clamp-2 text-sm text-gray-500">{pkg.description}</p>
        )}
        <div className="mt-2 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1 text-gray-600">
            <BookOpen className="h-3.5 w-3.5" />
            {pkg.lessons_count} aulas
          </span>
          <span className="flex items-center gap-1 font-semibold text-blue-700">
            <Tag className="h-3.5 w-3.5" />
            {formatCurrency(pkg.price)}
          </span>
          <span className="text-xs text-gray-400">
            {formatCurrency(perLesson)}/aula
          </span>
        </div>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3">
        <button
          type="button"
          onClick={onEdit}
          title="Editar pacote"
          className="text-gray-400 transition-colors hover:text-gray-700"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onToggle}
          title={pkg.is_active ? 'Desativar' : 'Ativar'}
          className="text-gray-400 transition-colors hover:text-blue-700"
        >
          {pkg.is_active ? (
            <ToggleRight className="h-6 w-6 text-blue-700" />
          ) : (
            <ToggleLeft className="h-6 w-6" />
          )}
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Excluir pacote"
          className="text-gray-300 transition-colors hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

const inputClassName = 'w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
