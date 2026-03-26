'use client'

import { useEffect, useMemo, useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ClipboardList, Loader2, Pencil, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { getProfileDataAction } from '../perfil/actions'
import { formatCurrency } from '@/utils/format'

const inputClassName = 'w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0f2f63] focus:ring-2 focus:ring-[#0f2f63]/10'

type ManualLesson = {
  id: string
  student_name: string
  student_phone: string | null
  category: string
  lesson_date: string
  start_time: string
  end_time: string
  amount: number
  status: 'completed' | 'cancelled'
  notes: string | null
  created_at: string
}

type LessonForm = {
  student_name: string
  student_phone: string
  category: string
  notes: string
}

type LessonSessionForm = {
  id: string
  lesson_date: string
  start_time: string
  end_time: string
  amount: string
}

function getTodayDate() {
  return new Date().toISOString().slice(0, 10)
}

function getDefaultForm(category = 'B'): LessonForm {
  return {
    student_name: '',
    student_phone: '',
    category,
    notes: '',
  }
}

function createSession(): LessonSessionForm {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    lesson_date: getTodayDate(),
    start_time: '08:00',
    end_time: '09:00',
    amount: '',
  }
}

function normalizeLesson(row: Record<string, unknown>): ManualLesson {
  return {
    id: String(row.id || ''),
    student_name: String(row.student_name || 'Aluno'),
    student_phone: row.student_phone ? String(row.student_phone) : null,
    category: String(row.category || 'B'),
    lesson_date: String(row.lesson_date || ''),
    start_time: String(row.start_time || ''),
    end_time: String(row.end_time || ''),
    amount: Number(row.amount || 0),
    status: String(row.status || 'completed') === 'cancelled' ? 'cancelled' : 'completed',
    notes: row.notes ? String(row.notes) : null,
    created_at: String(row.created_at || ''),
  }
}

function getStatusBadge(status: ManualLesson['status']) {
  if (status === 'cancelled') {
    return 'bg-slate-100 text-slate-600'
  }

  return 'bg-emerald-100 text-emerald-700'
}

export default function AulasExternasPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [editingLessonId, setEditingLessonId] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [availableCategories, setAvailableCategories] = useState<string[]>(['B'])
  const [lessons, setLessons] = useState<ManualLesson[]>([])
  const [form, setForm] = useState<LessonForm>(getDefaultForm())
  const [sessions, setSessions] = useState<LessonSessionForm[]>([createSession()])

  const loadLessons = async () => {
    const { createClient } = await import('@/lib/supabase/client')
    const supabase = createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user

    if (!user) {
      throw new Error('Sessao expirada.')
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase.from('manual_lessons') as any)
      .select('id,student_name,student_phone,category,lesson_date,start_time,end_time,amount,status,notes,created_at')
      .eq('instructor_id', user.id)
      .order('lesson_date', { ascending: false })
      .order('start_time', { ascending: false })

    if (error) throw error

    setLessons(Array.isArray(data) ? data.map((row: Record<string, unknown>) => normalizeLesson(row)) : [])
  }

  useEffect(() => {
    const load = async () => {
      try {
        const profile = await getProfileDataAction()
        const categories = Array.isArray(profile?.categories) && profile.categories.length > 0
          ? profile.categories.map(String)
          : profile?.category
            ? [String(profile.category)]
            : ['B']

        setAvailableCategories(categories)
        setForm(getDefaultForm(categories[0] || 'B'))
        setSessions([createSession()])
        await loadLessons()
      } catch (error) {
        toast.error((error as Error).message || 'Nao foi possivel carregar as aulas externas.')
      } finally {
        setLoading(false)
      }
    }

    void load()
  }, [])

  const completedLessons = useMemo(() => lessons.filter(lesson => lesson.status === 'completed'), [lessons])
  const monthKey = new Date().toISOString().slice(0, 7)
  const monthLessons = useMemo(
    () => completedLessons.filter(lesson => lesson.lesson_date.startsWith(monthKey)),
    [completedLessons, monthKey],
  )

  const stats = [
    {
      label: 'Receita externa no mes',
      value: formatCurrency(monthLessons.reduce((sum, lesson) => sum + lesson.amount, 0)),
      hint: 'Nao entra na carteira nem nos pagamentos da plataforma.',
    },
    {
      label: 'Aulas externas no mes',
      value: String(monthLessons.length),
      hint: 'Somente registros concluidos fora da plataforma.',
    },
    {
      label: 'Total registrado',
      value: String(completedLessons.length),
      hint: 'Historico de aulas externas concluidas.',
    },
  ]

  const resetForm = () => {
    setForm(getDefaultForm(availableCategories[0] || 'B'))
    setSessions([createSession()])
    setEditingLessonId(null)
    setModalOpen(false)
  }

  const openCreateModal = () => {
    setEditingLessonId(null)
    setForm(getDefaultForm(availableCategories[0] || 'B'))
    setSessions([createSession()])
    setModalOpen(true)
  }

  const openEditModal = (lesson: ManualLesson) => {
    setEditingLessonId(lesson.id)
    setForm({
      student_name: lesson.student_name,
      student_phone: lesson.student_phone || '',
      category: lesson.category,
      notes: lesson.notes || '',
    })
    setSessions([{
      id: lesson.id,
      lesson_date: lesson.lesson_date,
      start_time: lesson.start_time.slice(0, 5),
      end_time: lesson.end_time.slice(0, 5),
      amount: String(lesson.amount),
    }])
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.student_name.trim()) {
      toast.error('Informe o nome do aluno.')
      return
    }

    for (const session of sessions) {
      const amount = Number(session.amount)
      if (!amount || amount <= 0) {
        toast.error('Informe um valor valido para cada aula.')
        return
      }

      if (!session.lesson_date) {
        toast.error('Informe a data de cada aula.')
        return
      }

      if (!session.start_time || !session.end_time || session.start_time >= session.end_time) {
        toast.error('O horario final precisa ser maior que o inicial em todas as aulas.')
        return
      }
    }

    setSaving(true)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      const { data: authData } = await supabase.auth.getUser()
      const user = authData.user

      if (!user) {
        throw new Error('Sessao expirada.')
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const table = supabase.from('manual_lessons') as any
      const payloads = sessions.map(session => ({
        instructor_id: user.id,
        student_name: form.student_name.trim(),
        student_phone: form.student_phone.trim() || null,
        category: form.category,
        lesson_date: session.lesson_date,
        start_time: `${session.start_time}:00`,
        end_time: `${session.end_time}:00`,
        amount: Number(session.amount),
        status: 'completed',
        notes: form.notes.trim() || null,
      }))

      const { error } = editingLessonId
        ? await table.update(payloads[0]).eq('id', editingLessonId).eq('instructor_id', user.id)
        : await table.insert(payloads)

      if (error) throw error

      await loadLessons()
      resetForm()
      toast.success(editingLessonId ? 'Aula externa atualizada.' : `${payloads.length} aula${payloads.length === 1 ? '' : 's'} externa${payloads.length === 1 ? '' : 's'} registrada${payloads.length === 1 ? '' : 's'}.`)
    } catch (error) {
      toast.error((error as Error).message || 'Nao foi possivel salvar a aula externa.')
    } finally {
      setSaving(false)
    }
  }

  const addSession = () => {
    setSessions(current => [...current, createSession()])
  }

  const removeSession = (sessionId: string) => {
    setSessions(current => current.length > 1 ? current.filter(session => session.id !== sessionId) : current)
  }

  const updateSession = (sessionId: string, field: keyof Omit<LessonSessionForm, 'id'>, value: string) => {
    setSessions(current => current.map(session => (
      session.id === sessionId
        ? { ...session, [field]: value }
        : session
    )))
  }

  const handleDeleteLesson = async (lesson: ManualLesson) => {
    setDeletingId(lesson.id)

    try {
      const { createClient } = await import('@/lib/supabase/client')
      const supabase = createClient()
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (supabase.from('manual_lessons') as any)
        .delete()
        .eq('id', lesson.id)

      if (error) throw error

      await loadLessons()
      toast.success('Registro excluido.')
    } catch (error) {
      toast.error((error as Error).message || 'Nao foi possivel excluir o registro.')
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">Gestao do negocio</p>
          <h1 className="mt-1 text-2xl font-extrabold text-slate-900">Aulas externas</h1>
          <p className="mt-1 max-w-3xl text-sm text-slate-500">
            Registre aulas realizadas fora da plataforma. Esses valores ficam separados da agenda, da carteira e dos pagamentos da plataforma.
          </p>
        </div>
        <button
          type="button"
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#0f2f63] px-4 py-3 text-sm font-semibold text-white shadow-[0_16px_36px_rgba(15,47,99,0.18)] hover:bg-[#0b254e]"
        >
          <ClipboardList className="h-4 w-4" />
          Registrar aula externa
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map(stat => (
          <article key={stat.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-slate-500">{stat.label}</p>
            <p className="mt-3 text-2xl font-extrabold text-slate-900">{stat.value}</p>
            <p className="mt-2 text-xs text-slate-400">{stat.hint}</p>
          </article>
        ))}
      </div>

      <section className="rounded-3xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-5 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900">Historico separado da plataforma</h2>
            <p className="mt-1 text-sm text-slate-500">Esses registros servem para acompanhamento interno do instrutor e nao geram booking nem pagamento.</p>
          </div>
          <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
            {lessons.length} registro{lessons.length === 1 ? '' : 's'}
          </span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center gap-2 px-6 py-12 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" />
            Carregando registros...
          </div>
        ) : lessons.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-slate-400">
            Nenhuma aula externa registrada ainda.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full table-fixed text-sm">
              <thead className="bg-slate-50 text-slate-500">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Aluno</th>
                  <th className="px-4 py-4 text-left font-semibold">Data</th>
                  <th className="px-4 py-4 text-left font-semibold">Horario</th>
                  <th className="px-4 py-4 text-left font-semibold">Categoria</th>
                  <th className="px-4 py-4 text-left font-semibold">Valor</th>
                  <th className="px-4 py-4 text-left font-semibold">Status</th>
                  <th className="px-4 py-4 text-left font-semibold">Observacoes</th>
                  <th className="px-6 py-4 text-right font-semibold">Acoes</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map(lesson => (
                  <tr key={lesson.id} className="border-t border-slate-100 align-top">
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{lesson.student_name}</p>
                      <p className="mt-1 text-xs text-slate-400">{lesson.student_phone || 'Telefone nao informado'}</p>
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {format(new Date(`${lesson.lesson_date}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR })}
                    </td>
                    <td className="px-4 py-4 text-slate-700">
                      {lesson.start_time.slice(0, 5)} - {lesson.end_time.slice(0, 5)}
                    </td>
                    <td className="px-4 py-4">
                      <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-blue-700">
                        Cat. {lesson.category}
                      </span>
                    </td>
                    <td className="px-4 py-4 font-semibold text-emerald-700">{formatCurrency(lesson.amount)}</td>
                    <td className="px-4 py-4">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${getStatusBadge(lesson.status)}`}>
                        {lesson.status === 'completed' ? 'Concluida' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-slate-500">
                      <div className="line-clamp-2">{lesson.notes || '-'}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditModal(lesson)}
                          className="inline-flex items-center gap-2 rounded-xl border border-blue-200 px-3 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                          Editar
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteLesson(lesson)}
                          disabled={deletingId === lesson.id}
                          className="inline-flex items-center gap-2 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                        >
                          {deletingId === lesson.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                          Excluir
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {modalOpen ? (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/45 px-4 py-6">
          <div className="mx-auto flex min-h-full w-full items-center justify-center">
            <div className="flex max-h-[calc(100vh-3rem)] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">{editingLessonId ? 'Editar aula externa' : 'Registrar aula externa'}</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    O registro fica separado das aulas compradas pela plataforma e serve apenas para gestao interna do instrutor.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetForm}
                  disabled={saving}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="grid flex-1 grid-cols-1 gap-4 overflow-y-auto px-6 py-5 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Aluno</label>
                <input
                  value={form.student_name}
                  onChange={event => setForm(current => ({ ...current, student_name: event.target.value }))}
                  className={inputClassName}
                  placeholder="Nome do aluno"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Telefone</label>
                <input
                  value={form.student_phone}
                  onChange={event => setForm(current => ({ ...current, student_phone: event.target.value }))}
                  className={inputClassName}
                  placeholder="Opcional"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Categoria</label>
                <select
                  value={form.category}
                  onChange={event => setForm(current => ({ ...current, category: event.target.value }))}
                  className={inputClassName}
                >
                  {availableCategories.map(category => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Observacoes</label>
                <textarea
                  rows={4}
                  value={form.notes}
                  onChange={event => setForm(current => ({ ...current, notes: event.target.value }))}
                  className={inputClassName}
                  placeholder="Ex.: aula feita no bairro Aldeota, aluno treinou baliza."
                />
              </div>

              <div className="md:col-span-2">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wide text-slate-500">Aulas do aluno</label>
                    <p className="mt-1 text-sm text-slate-500">
                      {editingLessonId ? 'Edicao de uma aula individual.' : 'Voce pode registrar varias aulas para o mesmo aluno de uma vez.'}
                    </p>
                  </div>
                  {!editingLessonId ? (
                    <button
                      type="button"
                      onClick={addSession}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
                    >
                      <Plus className="h-4 w-4" />
                      Adicionar aula
                    </button>
                  ) : null}
                </div>

                <div className="mt-4 space-y-3">
                  {sessions.map((session, index) => (
                    <div key={session.id} className="rounded-2xl border border-slate-200 bg-slate-50/70 p-4">
                      <div className="mb-4 flex items-center justify-between">
                        <p className="text-sm font-semibold text-slate-900">Aula {index + 1}</p>
                        {!editingLessonId && sessions.length > 1 ? (
                          <button
                            type="button"
                            onClick={() => removeSession(session.id)}
                            className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-semibold text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remover
                          </button>
                        ) : null}
                      </div>

                      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Valor (R$)</label>
                          <input
                            type="number"
                            min={1}
                            step="0.01"
                            value={session.amount}
                            onChange={event => updateSession(session.id, 'amount', event.target.value)}
                            className={inputClassName}
                            placeholder="Ex.: 120"
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Data da aula</label>
                          <input
                            type="date"
                            value={session.lesson_date}
                            onChange={event => updateSession(session.id, 'lesson_date', event.target.value)}
                            className={inputClassName}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Inicio</label>
                          <input
                            type="time"
                            value={session.start_time}
                            onChange={event => updateSession(session.id, 'start_time', event.target.value)}
                            className={inputClassName}
                          />
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Fim</label>
                          <input
                            type="time"
                            value={session.end_time}
                            onChange={event => updateSession(session.id, 'end_time', event.target.value)}
                            className={inputClassName}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={resetForm}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#0f2f63] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b254e] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ClipboardList className="h-4 w-4" />}
                {editingLessonId ? 'Salvar alteracoes' : `Registrar ${sessions.length} aula${sessions.length === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
