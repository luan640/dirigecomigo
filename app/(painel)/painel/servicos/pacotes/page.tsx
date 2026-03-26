'use client'

import { useEffect, useState } from 'react'
import { Loader2, Package2, Pencil, Power } from 'lucide-react'
import { toast } from 'sonner'
import { getProfileDataAction } from '../../perfil/actions'
import { formatCurrency } from '@/utils/format'

const inp = 'w-full rounded-lg border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'

type InstructorPackage = {
  id: string
  name: string
  description: string | null
  lessons_count: number
  price: number
  category: string
  is_active: boolean
}

export default function PacotesPage() {
  const [loading, setLoading] = useState(true)
  const [savingPackage, setSavingPackage] = useState(false)
  const [editingPackageId, setEditingPackageId] = useState<string | null>(null)
  const [togglingPackageId, setTogglingPackageId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>(['B'])
  const [packages, setPackages] = useState<InstructorPackage[]>([])
  const [packageForm, setPackageForm] = useState({
    name: '',
    description: '',
    lessons_count: '5',
    price: '',
    category: 'B',
  })

  const loadPackages = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: auth } = await supabase.auth.getUser()
    const userId = auth.user?.id
    if (!userId) throw new Error('Sessao expirada.')

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('lesson_packages') as any)
      .select('id,name,description,lessons_count,price,category,is_active')
      .eq('instructor_id', userId)
      .order('lessons_count', { ascending: true })

    if (error) throw error

    setPackages(
      Array.isArray(data)
        ? data.map((item: Record<string, unknown>) => ({
            id: String(item.id || ''),
            name: String(item.name || ''),
            description: item.description ? String(item.description) : null,
            lessons_count: Number(item.lessons_count || 0),
            price: Number(item.price || 0),
            category: String(item.category || 'B'),
            is_active: Boolean(item.is_active),
          }))
        : [],
    )
  }

  useEffect(() => {
    const load = async () => {
      try {
        const data = await getProfileDataAction()
        const rawCats = Array.isArray(data?.categories) ? data.categories.map(String) : []
        const fallback = String(data?.category || '')
        const categories = rawCats.length > 0 ? rawCats
          : fallback === 'AB' ? ['A', 'B']
          : fallback ? [fallback]
          : ['B']

        setAvailableCategories(categories)
        setPackageForm(prev => ({ ...prev, category: categories[0] || 'B' }))
        await loadPackages()
      } catch (err) {
        toast.error((err as Error).message || 'Erro ao carregar pacotes.')
      } finally {
        setLoading(false)
      }
    }
    void load()
  }, [])

  const resetForm = () => {
    setPackageForm({
      name: '',
      description: '',
      lessons_count: '5',
      price: '',
      category: availableCategories[0] || 'B',
    })
    setEditingPackageId(null)
    setModalOpen(false)
  }

  const handleSavePackage = async () => {
    if (!packageForm.name.trim()) {
      toast.error('Informe o nome do pacote.')
      return
    }

    const lessonsCount = Number(packageForm.lessons_count)
    const price = Number(packageForm.price)
    if (!lessonsCount || lessonsCount < 2) {
      toast.error('O pacote precisa ter pelo menos 2 aulas.')
      return
    }
    if (!price || price < 1) {
      toast.error('Informe um valor valido para o pacote.')
      return
    }

    setSavingPackage(true)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: auth } = await supabase.auth.getUser()
      const userId = auth.user?.id
      if (!userId) throw new Error('Sessao expirada.')

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = supabase.from('lesson_packages') as any
      const payload = {
        instructor_id: userId,
        name: packageForm.name.trim(),
        description: packageForm.description.trim() || null,
        lessons_count: lessonsCount,
        price,
        category: packageForm.category,
        is_active: true,
      }

      const result = editingPackageId
        ? await table.update(payload).eq('id', editingPackageId).eq('instructor_id', userId)
        : await table.insert(payload)

      const { error } = result

      if (error) throw error

      resetForm()
      await loadPackages()
      toast.success(editingPackageId ? 'Pacote atualizado com sucesso.' : 'Pacote criado com sucesso.')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao salvar pacote.')
    } finally {
      setSavingPackage(false)
    }
  }

  const handleEditPackage = (pkg: InstructorPackage) => {
    setEditingPackageId(pkg.id)
    setPackageForm({
      name: pkg.name,
      description: pkg.description || '',
      lessons_count: String(pkg.lessons_count),
      price: String(pkg.price),
      category: pkg.category,
    })
    setModalOpen(true)
  }

  const handleOpenCreateModal = () => {
    setEditingPackageId(null)
    setPackageForm({
      name: '',
      description: '',
      lessons_count: '5',
      price: '',
      category: availableCategories[0] || 'B',
    })
    setModalOpen(true)
  }

  const handleTogglePackage = async (pkg: InstructorPackage) => {
    setTogglingPackageId(pkg.id)
    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('lesson_packages') as any)
        .update({ is_active: !pkg.is_active })
        .eq('id', pkg.id)
      if (error) throw error
      await loadPackages()
      toast.success(pkg.is_active ? 'Pacote desativado.' : 'Pacote reativado.')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao atualizar pacote.')
    } finally {
      setTogglingPackageId(null)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      <div>
        <h1 className="text-2xl font-extrabold text-gray-900">Pacotes</h1>
        <p className="mt-1 text-sm text-gray-500">Crie ofertas fechadas com quantidade de aulas e valor definido pelo instrutor.</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="mr-2 h-6 w-6 animate-spin" /> Carregando...
        </div>
      ) : (
        <div className="space-y-5">
          <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-gray-900">Novo pacote</h2>
                <p className="mt-0.5 text-sm text-gray-500">Crie uma oferta fechada e depois gerencie edição ou ativação na lista abaixo.</p>
              </div>
              <button
                type="button"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800"
              >
                <Package2 className="h-4 w-4" />
                Criar pacote
              </button>
            </div>

            <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-4 text-sm text-gray-500">
              O aluno precisará selecionar exatamente a quantidade de horários definida no pacote.
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div>
              <h2 className="text-base font-bold text-gray-900">Pacotes cadastrados</h2>
              <p className="mt-0.5 text-sm text-gray-500">Esses pacotes aparecem no perfil público do instrutor.</p>
            </div>

            <div className="space-y-3">
              {packages.length === 0 ? (
                <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-5 text-sm text-gray-500">
                  Nenhum pacote cadastrado.
                </div>
              ) : (
                packages.map(pkg => (
                  <div key={pkg.id} className="flex flex-col gap-3 rounded-xl border border-gray-200 p-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-bold text-gray-900">{pkg.name}</p>
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-semibold text-blue-700">
                          Cat. {pkg.category}
                        </span>
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600">
                          {pkg.lessons_count} aulas
                        </span>
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${pkg.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
                          {pkg.is_active ? 'Ativo' : 'Inativo'}
                        </span>
                      </div>
                      <p className="mt-1 text-sm font-semibold text-[var(--brand-orange)]">{formatCurrency(pkg.price)}</p>
                      {pkg.description ? <p className="mt-1 text-sm text-gray-500">{pkg.description}</p> : null}
                    </div>
                    <div className="flex items-center gap-2 self-start">
                      <button
                        type="button"
                        onClick={() => handleEditPackage(pkg)}
                        className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                      >
                        <Pencil className="h-4 w-4" />
                        Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleTogglePackage(pkg)}
                        disabled={togglingPackageId === pkg.id}
                        className="inline-flex items-center gap-2 rounded-xl border border-amber-200 px-3 py-2 text-sm font-semibold text-amber-700 hover:bg-amber-50 disabled:opacity-60"
                      >
                        {togglingPackageId === pkg.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Power className="h-4 w-4" />}
                        {pkg.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>
      )}

      {modalOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-2xl rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{editingPackageId ? 'Editar pacote' : 'Criar pacote'}</h2>
                  <p className="mt-1 text-sm text-slate-500">Defina nome, categoria, quantidade de aulas e valor fechado do pacote.</p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={savingPackage}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">Nome do pacote</label>
                <input
                  value={packageForm.name}
                  onChange={event => setPackageForm(prev => ({ ...prev, name: event.target.value }))}
                  placeholder="Ex.: Pacote intensivo"
                  className={inp}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">Categoria</label>
                <select
                  value={packageForm.category}
                  onChange={event => setPackageForm(prev => ({ ...prev, category: event.target.value }))}
                  className={inp}
                >
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">Quantidade de aulas</label>
                <input
                  type="number"
                  min={2}
                  value={packageForm.lessons_count}
                  onChange={event => setPackageForm(prev => ({ ...prev, lessons_count: event.target.value }))}
                  className={inp}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">Valor do pacote (R$)</label>
                <input
                  type="number"
                  min={1}
                  value={packageForm.price}
                  onChange={event => setPackageForm(prev => ({ ...prev, price: event.target.value }))}
                  placeholder="Ex.: 450"
                  className={inp}
                />
              </div>
              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">Descricao</label>
                <textarea
                  rows={3}
                  value={packageForm.description}
                  onChange={event => setPackageForm(prev => ({ ...prev, description: event.target.value }))}
                  placeholder="Opcional. Ex.: 5 aulas para preparação de prova prática."
                  className={inp}
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={resetForm}
                disabled={savingPackage}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSavePackage}
                disabled={savingPackage}
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {savingPackage ? <Loader2 className="h-4 w-4 animate-spin" /> : <Package2 className="h-4 w-4" />}
                {editingPackageId ? 'Salvar alteracoes' : 'Criar pacote'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
