'use client'

import { useState } from 'react'
import type { ReactNode } from 'react'
import { Loader2, X, ExternalLink } from 'lucide-react'
import { toast } from 'sonner'
import type { InstructorAdminRow } from './page'

type Props = {
  initialRows: InstructorAdminRow[]
}

type TabKey = 'pending' | 'active' | 'rejected'

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR')
}

function formatCategories(value?: string[] | string) {
  if (!value) return '-'
  if (Array.isArray(value)) return value.join(', ') || '-'
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.join(', ') || '-'
    } catch {
      // not JSON
    }
    return value || '-'
  }
  return '-'
}

function formatLessonTypes(value?: string[] | string) {
  if (!value) return '-'
  if (Array.isArray(value)) return value.join(', ') || '-'
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) return parsed.join(', ') || '-'
    } catch {
      // not JSON
    }
    return value || '-'
  }
  return '-'
}

function StatusBadge({ status, isActive }: { status?: string; isActive?: boolean }) {
  if (status === 'approved' || isActive) {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
        Aprovado
      </span>
    )
  }
  if (status === 'rejected') {
    return (
      <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-700">
        Recusado
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-semibold text-yellow-700">
      Pendente
    </span>
  )
}

function getTab(row: InstructorAdminRow): TabKey {
  if (row.status === 'rejected') return 'rejected'
  if (row.status === 'approved' || row.is_active === true) return 'active'
  return 'pending'
}

export default function InstructorsAdminTable({ initialRows }: Props) {
  const [rows, setRows] = useState<InstructorAdminRow[]>(initialRows)
  const [activeTab, setActiveTab] = useState<TabKey>('pending')
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const [loadingAction, setLoadingAction] = useState<'approve' | 'reject' | null>(null)
  const [modalRow, setModalRow] = useState<InstructorAdminRow | null>(null)

  const pendingRows = rows.filter(r => getTab(r) === 'pending')
  const activeRows = rows.filter(r => getTab(r) === 'active')
  const rejectedRows = rows.filter(r => getTab(r) === 'rejected')

  const visibleRows =
    activeTab === 'pending' ? pendingRows
    : activeTab === 'active' ? activeRows
    : rejectedRows

  const handleAction = async (id: string, action: 'approve' | 'reject') => {
    setLoadingId(id)
    setLoadingAction(action)
    try {
      const res = await fetch('/api/admin/instrutores', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Falha ao processar acao.')

      const updated = payload?.data
      setRows(current =>
        current.map(row =>
          row.id === id
            ? {
                ...row,
                status: updated?.status ?? (action === 'approve' ? 'approved' : 'rejected'),
                is_active: updated?.is_active ?? (action === 'approve'),
                is_verified: updated?.is_verified ?? (action === 'approve'),
              }
            : row
        )
      )

      if (modalRow?.id === id) {
        setModalRow(prev =>
          prev
            ? {
                ...prev,
                status: updated?.status ?? (action === 'approve' ? 'approved' : 'rejected'),
                is_active: updated?.is_active ?? (action === 'approve'),
                is_verified: updated?.is_verified ?? (action === 'approve'),
              }
            : null
        )
      }

      toast.success(action === 'approve' ? 'Instrutor aprovado com sucesso.' : 'Instrutor recusado.')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao processar acao.')
    } finally {
      setLoadingId(null)
      setLoadingAction(null)
    }
  }

  const tabs: { key: TabKey; label: string; count: number }[] = [
    { key: 'pending', label: 'Pendentes', count: pendingRows.length },
    { key: 'active', label: 'Ativos', count: activeRows.length },
    { key: 'rejected', label: 'Recusados', count: rejectedRows.length },
  ]

  return (
    <>
      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Gerenciar Instrutores</h2>
          <p className="text-sm text-gray-500 mt-1">Aprove ou recuse cadastros de instrutores.</p>
        </div>

        <div className="flex gap-1 px-5 pt-4">
          {tabs.map(tab => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key)}
              className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === tab.key
                  ? 'bg-blue-700 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {tab.label}
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                  activeTab === tab.key
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700'
                }`}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        <div className="overflow-x-auto mt-4">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Nome</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Telefone</th>
                <th className="text-left px-4 py-3 font-semibold">CPF</th>
                <th className="text-left px-4 py-3 font-semibold">Cidade</th>
                <th className="text-left px-4 py-3 font-semibold">Categorias</th>
                <th className="text-left px-4 py-3 font-semibold">Criado em</th>
                <th className="text-left px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {visibleRows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={9}>
                    Nenhum instrutor nesta categoria.
                  </td>
                </tr>
              ) : (
                visibleRows.map(row => {
                  const isLoading = loadingId === row.id
                  return (
                    <tr key={row.id} className="border-t border-gray-100">
                      <td className="px-4 py-3 font-medium text-gray-900">{row.full_name || 'Sem nome'}</td>
                      <td className="px-4 py-3 text-gray-600">{row.email || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">{row.phone || '-'}</td>
                      <td className="px-4 py-3 text-gray-600 font-mono text-xs">{row.cpf || '-'}</td>
                      <td className="px-4 py-3 text-gray-600">
                        {[row.city, row.state].filter(Boolean).join(' - ') || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-600">{formatCategories(row.categories)}</td>
                      <td className="px-4 py-3 text-gray-600">{formatDate(row.created_at)}</td>
                      <td className="px-4 py-3">
                        <StatusBadge status={row.status} isActive={row.is_active} />
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setModalRow(row)}
                            className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            Ver dados
                          </button>
                          {getTab(row) !== 'active' && (
                            <button
                              type="button"
                              onClick={() => handleAction(row.id, 'approve')}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 rounded-lg bg-green-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
                            >
                              {isLoading && loadingAction === 'approve' ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : null}
                              Aprovar
                            </button>
                          )}
                          {getTab(row) !== 'rejected' && (
                            <button
                              type="button"
                              onClick={() => handleAction(row.id, 'reject')}
                              disabled={isLoading}
                              className="inline-flex items-center gap-1 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
                            >
                              {isLoading && loadingAction === 'reject' ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : null}
                              Recusar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalRow && (
        <InstructorModal
          row={modalRow}
          onClose={() => setModalRow(null)}
          onApprove={() => handleAction(modalRow.id, 'approve')}
          onReject={() => handleAction(modalRow.id, 'reject')}
          loadingId={loadingId}
          loadingAction={loadingAction}
        />
      )}
    </>
  )
}

function InstructorModal({
  row,
  onClose,
  onApprove,
  onReject,
  loadingId,
  loadingAction,
}: {
  row: InstructorAdminRow
  onClose: () => void
  onApprove: () => void
  onReject: () => void
  loadingId: string | null
  loadingAction: 'approve' | 'reject' | null
}) {
  const isLoading = loadingId === row.id

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={e => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl border border-gray-100 shadow-xl">
        <div className="sticky top-0 z-10 flex items-center justify-between bg-white border-b border-gray-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">{row.full_name || 'Instrutor'}</h3>
            <p className="text-sm text-gray-500">Detalhes do cadastro</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-5 space-y-6">
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Informacoes Pessoais</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Nome" value={row.full_name} />
              <Field label="Email" value={row.email} />
              <Field label="Telefone" value={row.phone} />
              <Field label="CPF" value={row.cpf} mono />
              <Field label="Data de Nascimento" value={formatDate(row.birth_date)} />
              <Field
                label="Status"
                value={
                  <StatusBadge status={row.status} isActive={row.is_active} />
                }
              />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Localizacao</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Bairro" value={row.neighborhood} />
              <Field label="Cidade" value={row.city} />
              <Field label="Estado" value={row.state} />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Dados Profissionais</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Categorias" value={formatCategories(row.categories)} />
              <Field
                label="Preco por Aula"
                value={row.price_per_lesson != null ? `R$ ${Number(row.price_per_lesson).toFixed(2)}` : undefined}
              />
              <Field label="Tipos de Aula" value={formatLessonTypes(row.lesson_types)} />
              <Field
                label="Aceita carro do aluno"
                value={row.accepts_student_car === true ? 'Sim' : row.accepts_student_car === false ? 'Nao' : undefined}
              />
            </div>
          </div>

          {row.cnh_photo_url && (
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Foto CNH</h4>
              <a
                href={row.cnh_photo_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-gray-50 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                Ver foto da CNH
              </a>
              <div className="mt-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.cnh_photo_url}
                  alt="Foto CNH"
                  className="max-h-48 rounded-xl border border-gray-200 object-contain"
                />
              </div>
            </div>
          )}

          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-3">Outros</h4>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Cadastrado em" value={formatDate(row.created_at)} />
              <Field label="Verificado" value={row.is_verified === true ? 'Sim' : row.is_verified === false ? 'Nao' : undefined} />
            </div>
          </div>
        </div>

        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-3 bg-white border-t border-gray-100 px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
          {getTab(row) !== 'rejected' && (
            <button
              type="button"
              onClick={onReject}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60 transition-colors"
            >
              {isLoading && loadingAction === 'reject' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Recusar
            </button>
          )}
          {getTab(row) !== 'active' && (
            <button
              type="button"
              onClick={onApprove}
              disabled={isLoading}
              className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-60 transition-colors"
            >
              {isLoading && loadingAction === 'approve' ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
              Aprovar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

function Field({
  label,
  value,
  mono,
}: {
  label: string
  value?: string | ReactNode
  mono?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      {typeof value === 'string' || value == null ? (
        <p className={`text-sm font-medium text-gray-900 ${mono ? 'font-mono' : ''}`}>
          {value || '-'}
        </p>
      ) : (
        <div className="mt-0.5">{value}</div>
      )}
    </div>
  )
}
