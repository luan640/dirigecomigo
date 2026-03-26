'use client'

import { useMemo, useState } from 'react'
import { Loader2, Search, X, SlidersHorizontal } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/utils/format'

type StatusUi = {
  label: string
  classes: string
}

export type AdminTransactionRow = {
  id: string
  bookingId: string
  provider: string
  providerPaymentId: string
  amount: number
  refundedAmount: number
  remainingRefundableAmount: number
  refundCount: number
  latestRefundAtLabel: string
  latestRefundReason: string
  status: string
  statusUi: StatusUi
  providerStatusUi: StatusUi
  bookingStatusUi: StatusUi
  method: string
  studentName: string
  studentEmail: string
  instructorName: string
  lessonLabel: string
  bookingStatusLabel: string
  providerStatusDetail: string
  providerLiveMode: boolean | null
  providerStatusError: string
  createdAtLabel: string
  paidAtLabel: string
  canRefund: boolean
}

type Props = {
  initialRows: AdminTransactionRow[]
  failedCount: number
}

type Filters = {
  search: string
  status: string
  method: string
  bookingStatus: string
  environment: string
  dateFrom: string
  dateTo: string
}

const EMPTY_FILTERS: Filters = {
  search: '',
  status: '',
  method: '',
  bookingStatus: '',
  environment: '',
  dateFrom: '',
  dateTo: '',
}

function shortId(value: string) {
  if (!value) return '-'
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value
}

function normalizeStatus(status: string): StatusUi {
  switch (status) {
    case 'paid':
    case 'approved':
      return { label: 'Pago', classes: 'bg-emerald-100 text-emerald-700' }
    case 'processing':
    case 'authorized':
    case 'in_process':
      return { label: 'Processando', classes: 'bg-amber-100 text-amber-700' }
    case 'pending':
      return { label: 'Pendente', classes: 'bg-slate-100 text-slate-700' }
    case 'failed':
    case 'rejected':
    case 'cancelled':
      return { label: 'Falhou', classes: 'bg-red-100 text-red-700' }
    case 'refunded':
    case 'charged_back':
      return { label: 'Reembolsado', classes: 'bg-violet-100 text-violet-700' }
    default:
      return { label: status || '-', classes: 'bg-slate-100 text-slate-700' }
  }
}

function parseDateLabel(label: string): Date | null {
  if (!label || label === '-') return null
  // label format: DD/MM/YYYY, HH:MM:SS (pt-BR toLocaleString)
  const [datePart] = label.split(', ')
  if (!datePart) return null
  const [d, m, y] = datePart.split('/').map(Number)
  if (!d || !m || !y) return null
  return new Date(y, m - 1, d)
}

function activeFilterCount(f: Filters) {
  return Object.values(f).filter(Boolean).length
}

function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">{label}</label>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
      >
        <option value="">Todos</option>
        {options.map(o => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  )
}

export default function AdminTransactionsTable({ initialRows, failedCount }: Props) {
  const [rows, setRows] = useState(initialRows)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [amountById, setAmountById] = useState<Record<string, string>>({})
  const [reasonById, setReasonById] = useState<Record<string, string>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS)
  const [showFilters, setShowFilters] = useState(false)

  const activeRow = expandedId ? rows.find(row => row.id === expandedId) ?? null : null

  const setFilter = <K extends keyof Filters>(key: K, value: Filters[K]) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  const filteredRows = useMemo(() => {
    return rows.filter(row => {
      if (filters.search) {
        const q = filters.search.toLowerCase()
        const match =
          row.studentName.toLowerCase().includes(q) ||
          row.studentEmail.toLowerCase().includes(q) ||
          row.instructorName.toLowerCase().includes(q) ||
          row.providerPaymentId.toLowerCase().includes(q) ||
          row.bookingId.toLowerCase().includes(q)
        if (!match) return false
      }

      if (filters.status) {
        const s = row.status.toLowerCase()
        if (filters.status === 'paid' && s !== 'paid' && s !== 'approved') return false
        if (filters.status === 'pending' && s !== 'pending') return false
        if (filters.status === 'processing' && s !== 'processing' && s !== 'authorized' && s !== 'in_process') return false
        if (filters.status === 'failed' && s !== 'failed' && s !== 'rejected' && s !== 'cancelled') return false
        if (filters.status === 'refunded' && s !== 'refunded' && s !== 'charged_back') return false
      }

      if (filters.method) {
        const m = row.method.toLowerCase()
        if (filters.method === 'pix' && !m.includes('pix')) return false
        if (filters.method === 'card' && !m.includes('cart') && !m.includes('card') && !m.includes('credit') && !m.includes('visa') && !m.includes('master') && !m.includes('amex') && !m.includes('elo')) return false
        if (filters.method === 'debit' && !m.includes('d\u00e9bito') && !m.includes('debito') && !m.includes('debit')) return false
      }

      if (filters.bookingStatus && row.bookingStatusLabel !== filters.bookingStatus) return false

      if (filters.environment) {
        if (filters.environment === 'production' && row.providerLiveMode !== true) return false
        if (filters.environment === 'test' && row.providerLiveMode !== false) return false
      }

      if (filters.dateFrom || filters.dateTo) {
        const rowDate = parseDateLabel(row.createdAtLabel)
        if (rowDate) {
          if (filters.dateFrom) {
            const from = new Date(filters.dateFrom)
            from.setHours(0, 0, 0, 0)
            if (rowDate < from) return false
          }
          if (filters.dateTo) {
            const to = new Date(filters.dateTo)
            to.setHours(23, 59, 59, 999)
            if (rowDate > to) return false
          }
        }
      }

      return true
    })
  }, [rows, filters])

  const totalFiltered = filteredRows.reduce((sum, r) => sum + r.amount, 0)
  const paidFiltered = filteredRows.filter(r => r.status === 'paid' || r.status === 'approved').reduce((sum, r) => sum + r.amount, 0)
  const activeCount = activeFilterCount(filters)

  const handleRefund = async (row: AdminTransactionRow) => {
    setSavingId(row.id)
    try {
      const rawAmount = amountById[row.id]?.trim() || ''
      const normalizedAmount = rawAmount ? Number(rawAmount.replace(',', '.')) : undefined
      if (normalizedAmount !== undefined && (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0)) {
        throw new Error('Informe um valor de reembolso valido.')
      }

      const res = await fetch('/api/admin/payments/refund', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentId: row.id,
          amount: normalizedAmount,
          reason: reasonById[row.id] || '',
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Falha ao processar reembolso.')

      const refundedAmount = Number(payload?.data?.refundedAmount || row.refundedAmount)
      const remainingAmount = Number(payload?.data?.remainingAmount ?? Math.max(0, row.amount - refundedAmount))
      const paymentStatus = String(payload?.data?.paymentStatus || row.status)
      const refundAmount = Number(payload?.data?.refundAmount || 0)
      const reason = (reasonById[row.id] || '').trim()
      const latestRefundAtRaw = String(payload?.data?.refundRecordedAt || payload?.data?.refundedAt || '')
      const latestRefundAtLabel = latestRefundAtRaw
        ? new Date(latestRefundAtRaw).toLocaleString('pt-BR')
        : row.latestRefundAtLabel

      setRows(current => current.map(item => (
        item.id === row.id
          ? {
              ...item,
              refundedAmount,
              remainingRefundableAmount: remainingAmount,
              refundCount: item.refundCount + 1,
              latestRefundAtLabel,
              latestRefundReason: reason || item.latestRefundReason,
              status: paymentStatus,
              statusUi: normalizeStatus(paymentStatus),
              providerStatusUi: paymentStatus === 'refunded' ? normalizeStatus('refunded') : item.providerStatusUi,
              canRefund: remainingAmount > 0 && paymentStatus !== 'refunded',
            }
          : item
      )))

      setAmountById(current => ({ ...current, [row.id]: '' }))
      setReasonById(current => ({ ...current, [row.id]: '' }))
      setExpandedId(null)
      toast.success(
        refundAmount > 0
          ? `Reembolso de ${formatCurrency(refundAmount)} enviado.`
          : 'Reembolso enviado.',
      )
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao processar reembolso.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Header + filter toggle */}
      <div className="border-b border-slate-200 px-5 py-4">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="font-bold text-slate-900">Aulas e pagamentos</h2>
            <p className="mt-1 text-sm text-slate-500">
              {failedCount > 0
                ? `${failedCount} pagamentos com falha tambem aparecem aqui para auditoria.`
                : 'Todos os registros encontrados aparecem nesta tabela.'}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
              {filteredRows.length}/{rows.length} registro(s)
            </span>
            <button
              type="button"
              onClick={() => setShowFilters(v => !v)}
              className={`inline-flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-colors ${
                showFilters || activeCount > 0
                  ? 'border-slate-700 bg-slate-900 text-white'
                  : 'border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-slate-900">
                  {activeCount}
                </span>
              )}
            </button>
            {activeCount > 0 && (
              <button
                type="button"
                onClick={() => setFilters(EMPTY_FILTERS)}
                className="inline-flex items-center gap-1 rounded-xl border border-red-200 px-3 py-2 text-sm font-semibold text-red-600 hover:bg-red-50"
              >
                <X className="h-3.5 w-3.5" />
                Limpar
              </button>
            )}
          </div>
        </div>

        {/* Filter panel */}
        {showFilters && (
          <div className="mt-4 space-y-4 rounded-xl border border-slate-100 bg-slate-50 p-4">
            {/* Search */}
            <div className="flex flex-col gap-1">
              <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Busca</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Aluno, instrutor, e-mail ou ID do pagamento..."
                  value={filters.search}
                  onChange={e => setFilter('search', e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white py-2 pl-9 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                />
                {filters.search && (
                  <button
                    type="button"
                    onClick={() => setFilter('search', '')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            </div>

            {/* Row of selects */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
              <SelectFilter
                label="Status do pagamento"
                value={filters.status}
                onChange={v => setFilter('status', v)}
                options={[
                  { value: 'paid', label: 'Pago' },
                  { value: 'pending', label: 'Pendente' },
                  { value: 'processing', label: 'Processando' },
                  { value: 'failed', label: 'Falhou' },
                  { value: 'refunded', label: 'Reembolsado' },
                ]}
              />
              <SelectFilter
                label="Metodo de pagamento"
                value={filters.method}
                onChange={v => setFilter('method', v)}
                options={[
                  { value: 'pix', label: 'Pix' },
                  { value: 'card', label: 'Cartao de credito' },
                  { value: 'debit', label: 'Cartao de debito' },
                ]}
              />
              <SelectFilter
                label="Status da reserva"
                value={filters.bookingStatus}
                onChange={v => setFilter('bookingStatus', v)}
                options={[
                  { value: 'confirmed', label: 'Confirmada' },
                  { value: 'completed', label: 'Concluida' },
                  { value: 'pending', label: 'Pendente' },
                  { value: 'cancelled', label: 'Cancelada' },
                  { value: 'no_show', label: 'No-show' },
                ]}
              />
              <SelectFilter
                label="Ambiente"
                value={filters.environment}
                onChange={v => setFilter('environment', v)}
                options={[
                  { value: 'production', label: 'Producao' },
                  { value: 'test', label: 'Teste' },
                ]}
              />
              {/* Date range */}
              <div className="col-span-2 grid grid-cols-2 gap-2 md:col-span-1 xl:col-span-1">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">De</label>
                  <input
                    type="date"
                    value={filters.dateFrom}
                    onChange={e => setFilter('dateFrom', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Ate</label>
                  <input
                    type="date"
                    value={filters.dateTo}
                    onChange={e => setFilter('dateTo', e.target.value)}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-slate-400 focus:ring-2 focus:ring-slate-100"
                  />
                </div>
              </div>
            </div>

            {/* Summary of filtered set */}
            {activeCount > 0 && (
              <div className="flex flex-wrap gap-4 border-t border-slate-200 pt-3 text-sm">
                <span className="text-slate-500">
                  Mostrando <span className="font-semibold text-slate-800">{filteredRows.length}</span> de {rows.length} registros
                </span>
                <span className="text-slate-500">
                  Volume filtrado: <span className="font-semibold text-slate-800">{formatCurrency(totalFiltered)}</span>
                </span>
                <span className="text-slate-500">
                  Pagos filtrados: <span className="font-semibold text-emerald-700">{formatCurrency(paidFiltered)}</span>
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="overflow-hidden">
        <table className="w-full table-fixed text-sm">
          <thead className="bg-slate-50 text-slate-600">
            <tr>
              <th className="w-[11%] px-4 py-3 text-left font-semibold">Status</th>
              <th className="w-[10%] px-4 py-3 text-left font-semibold">Valor</th>
              <th className="w-[13%] px-4 py-3 text-left font-semibold">Aluno</th>
              <th className="w-[10%] px-4 py-3 text-left font-semibold">Instrutor</th>
              <th className="w-[14%] px-4 py-3 text-left font-semibold">Aula</th>
              <th className="w-[12%] px-4 py-3 text-left font-semibold">Pagamento provedor</th>
              <th className="w-[12%] px-4 py-3 text-left font-semibold">Status no provedor</th>
              <th className="w-[8%] px-4 py-3 text-left font-semibold">Reserva</th>
              <th className="w-[5%] px-4 py-3 text-left font-semibold">Criado</th>
              <th className="w-[5%] px-4 py-3 text-left font-semibold">Pago</th>
              <th className="w-[10%] px-4 py-3 text-left font-semibold">Acao</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.length === 0 ? (
              <tr>
                <td className="px-4 py-8 text-center text-slate-500" colSpan={11}>
                  {activeCount > 0 ? 'Nenhum resultado para os filtros aplicados.' : 'Nenhum pagamento encontrado.'}
                </td>
              </tr>
            ) : (
              filteredRows.map(row => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-4">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.statusUi.classes}`}>
                      {row.statusUi.label}
                    </span>
                    <div className="mt-2 text-xs text-slate-500">{row.provider || '-'}</div>
                    <div className="mt-1 text-xs text-slate-500">{row.method}</div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-semibold text-slate-900">{formatCurrency(row.amount)}</div>
                    {row.refundedAmount > 0 ? (
                      <div className="mt-1 text-xs text-violet-700">
                        Reembolsado: {formatCurrency(row.refundedAmount)}
                      </div>
                    ) : null}
                    {row.remainingRefundableAmount > 0 && row.refundedAmount > 0 ? (
                      <div className="mt-1 text-xs text-slate-500">
                        Restante: {formatCurrency(row.remainingRefundableAmount)}
                      </div>
                    ) : null}
                  </td>

                  <td className="px-4 py-4">
                    <div className="truncate font-medium text-slate-900">{row.studentName}</div>
                    <div className="mt-1 break-words text-xs text-slate-500">{row.studentEmail}</div>
                  </td>

                  <td className="px-4 py-4 break-words text-slate-700">{row.instructorName}</td>

                  <td className="px-4 py-4">
                    <div className="break-words text-slate-900">{row.lessonLabel}</div>
                    <div className="mt-2">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.bookingStatusUi.classes}`}>
                        {row.bookingStatusUi.label}
                      </span>
                    </div>
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-mono text-xs text-slate-800">{shortId(row.providerPaymentId)}</div>
                    <div className="mt-1 break-all font-mono text-[11px] text-slate-400">{row.providerPaymentId || '-'}</div>
                  </td>

                  <td className="px-4 py-4">
                    {row.provider === 'mercadopago' ? (
                      <>
                        <span
                          className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.providerStatusUi.classes}`}
                        >
                          {row.providerStatusUi.label}
                        </span>
                        <div className="mt-2 break-words text-xs text-slate-500">detalhe: {row.providerStatusDetail}</div>
                        <div className="mt-1 text-xs text-slate-400">
                          ambiente: {row.providerLiveMode === null ? '-' : row.providerLiveMode ? 'producao' : 'teste'}
                        </div>
                        {row.providerStatusError ? (
                          <div className="mt-1 break-words text-xs text-red-600">{row.providerStatusError}</div>
                        ) : null}
                      </>
                    ) : (
                      <span className="text-xs text-slate-400">-</span>
                    )}
                  </td>

                  <td className="px-4 py-4">
                    <div className="font-mono text-xs text-slate-500">{shortId(row.bookingId)}</div>
                    {row.refundCount > 0 ? (
                      <div className="mt-2 text-xs text-violet-700">{row.refundCount} reembolso(s)</div>
                    ) : null}
                    {row.latestRefundAtLabel !== '-' ? (
                      <div className="mt-1 break-words text-xs text-slate-500">ultimo: {row.latestRefundAtLabel}</div>
                    ) : null}
                    {row.latestRefundReason ? (
                      <div className="mt-1 break-words text-xs text-slate-500">motivo: {row.latestRefundReason}</div>
                    ) : null}
                  </td>

                  <td className="px-4 py-4 text-xs text-slate-600">{row.createdAtLabel}</td>
                  <td className="px-4 py-4 text-xs text-slate-600">{row.paidAtLabel}</td>

                  <td className="px-4 py-4">
                    {row.canRefund ? (
                      <button
                        type="button"
                        onClick={() => setExpandedId(row.id)}
                        className="inline-flex w-full items-center justify-center rounded-lg border border-red-200 px-3 py-2 text-xs font-semibold text-red-700 hover:bg-red-50"
                      >
                        Reembolsar
                      </button>
                    ) : row.refundedAmount > 0 ? (
                      <span className="inline-flex rounded-full bg-violet-100 px-2.5 py-1 text-xs font-semibold text-violet-700">
                        Reembolso registrado
                      </span>
                    ) : (
                      <span className="text-xs text-slate-400">Sem acao</span>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {activeRow ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-lg rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Reembolsar pagamento</h3>
                  <p className="mt-1 text-sm text-slate-500">
                    {activeRow.studentName} com {activeRow.instructorName}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedId(null)}
                  disabled={savingId === activeRow.id}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div className="grid gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4 md:grid-cols-2">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Aula</div>
                  <div className="mt-1 text-sm font-medium text-slate-900">{activeRow.lessonLabel}</div>
                </div>
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wide text-slate-400">Valor disponivel</div>
                  <div className="mt-1 text-sm font-bold text-slate-900">
                    {formatCurrency(activeRow.remainingRefundableAmount)}
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Valor do reembolso</label>
                <input
                  type="number"
                  min="0.01"
                  max={activeRow.remainingRefundableAmount}
                  step="0.01"
                  placeholder={activeRow.remainingRefundableAmount.toFixed(2)}
                  value={amountById[activeRow.id] || ''}
                  onChange={event => setAmountById(current => ({ ...current, [activeRow.id]: event.target.value }))}
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                />
                <p className="mt-2 text-xs text-slate-500">
                  Deixe vazio para reembolso total de {formatCurrency(activeRow.remainingRefundableAmount)}.
                </p>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-slate-700">Motivo</label>
                <textarea
                  rows={3}
                  value={reasonById[activeRow.id] || ''}
                  onChange={event => setReasonById(current => ({ ...current, [activeRow.id]: event.target.value }))}
                  placeholder="Opcional. Ex.: aula cancelada pelo instrutor."
                  className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 outline-none transition focus:border-red-300 focus:ring-4 focus:ring-red-100"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={() => setExpandedId(null)}
                disabled={savingId === activeRow.id}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={() => handleRefund(activeRow)}
                disabled={savingId === activeRow.id}
                className="inline-flex min-w-32 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60"
              >
                {savingId === activeRow.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Confirmar reembolso
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  )
}
