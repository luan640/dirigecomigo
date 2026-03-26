'use client'

import { useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/utils/format'

export type AdminPayoutRequestRow = {
  id: string
  instructorName: string
  instructorEmail: string
  amount: number
  status: string
  statusUi: { label: string; classes: string }
  notes: string
  adminNotes: string
  requestedAtLabel: string
  processedAtLabel: string
}

export default function AdminPayoutRequestsTable({ initialRows }: { initialRows: AdminPayoutRequestRow[] }) {
  const [rows, setRows] = useState(initialRows)
  const [updatingId, setUpdatingId] = useState<string | null>(null)
  const [draftNotes, setDraftNotes] = useState<Record<string, string>>({})

  const pendingCount = useMemo(() => rows.filter(row => row.status === 'pending').length, [rows])

  const updateRowStatus = async (row: AdminPayoutRequestRow, status: string) => {
    setUpdatingId(row.id)
    try {
      const response = await fetch(`/api/admin/payout-requests/${row.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status,
          adminNotes: draftNotes[row.id] ?? row.adminNotes,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel atualizar o saque.')
      }

      const updated = payload.data as Record<string, unknown>
      const nextStatus = String(updated.status || status).toLowerCase()
      const nextAdminNotes = String(updated.admin_notes || draftNotes[row.id] || '')
      const processedAt = typeof updated.processed_at === 'string' ? new Date(updated.processed_at).toLocaleString('pt-BR') : '-'

      setRows(current => current.map(item => (
        item.id === row.id
          ? {
              ...item,
              status: nextStatus,
              adminNotes: nextAdminNotes,
              processedAtLabel: processedAt,
              statusUi: normalizePayoutStatus(nextStatus),
            }
          : item
      )))
      toast.success('Status do saque atualizado.')
    } catch (error) {
      toast.error((error as Error).message || 'Nao foi possivel atualizar o saque.')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
        <div>
          <h2 className="font-bold text-slate-900">Fila manual de saques</h2>
          <p className="mt-1 text-sm text-slate-500">O admin processa manualmente e atualiza o status de cada solicitacao.</p>
        </div>
        <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
          {pendingCount} pendente{pendingCount === 1 ? '' : 's'}
        </span>
      </div>

      {rows.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm text-slate-400">Nenhuma solicitacao de saque encontrada.</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-slate-500">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Instrutor</th>
                <th className="px-4 py-3 text-left font-semibold">Valor</th>
                <th className="px-4 py-3 text-left font-semibold">Solicitado em</th>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Observacoes</th>
                <th className="px-4 py-3 text-left font-semibold">Admin</th>
                <th className="px-4 py-3 text-right font-semibold">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(row => (
                <tr key={row.id} className="border-t border-slate-100 align-top">
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-900">{row.instructorName}</div>
                    <div className="mt-1 text-xs text-slate-400">{row.instructorEmail}</div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(row.amount)}</td>
                  <td className="px-4 py-3 text-slate-600">{row.requestedAtLabel}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.statusUi.classes}`}>
                      {row.statusUi.label}
                    </span>
                    <div className="mt-1 text-xs text-slate-400">Atualizado: {row.processedAtLabel}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{row.notes || '-'}</td>
                  <td className="px-4 py-3">
                    <textarea
                      rows={3}
                      value={draftNotes[row.id] ?? row.adminNotes}
                      onChange={event => setDraftNotes(current => ({ ...current, [row.id]: event.target.value }))}
                      className="w-64 rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none transition focus:border-[#0f2f63] focus:ring-2 focus:ring-[#0f2f63]/10"
                      placeholder="Observacao interna do admin"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex justify-end gap-2">
                      {['processing', 'paid', 'rejected'].map(status => (
                        <button
                          key={status}
                          type="button"
                          onClick={() => updateRowStatus(row, status)}
                          disabled={updatingId === row.id}
                          className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
                        >
                          {updatingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : statusLabel(status)}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function normalizePayoutStatus(status: string) {
  switch (status) {
    case 'paid':
      return { label: 'Pago', classes: 'bg-emerald-100 text-emerald-700' }
    case 'processing':
      return { label: 'Em processamento', classes: 'bg-blue-100 text-blue-700' }
    case 'rejected':
      return { label: 'Recusado', classes: 'bg-red-100 text-red-700' }
    case 'cancelled':
      return { label: 'Cancelado', classes: 'bg-slate-100 text-slate-700' }
    default:
      return { label: 'Pendente', classes: 'bg-amber-100 text-amber-700' }
  }
}

function statusLabel(status: string) {
  switch (status) {
    case 'processing':
      return 'Processar'
    case 'paid':
      return 'Marcar pago'
    case 'rejected':
      return 'Recusar'
    default:
      return status
  }
}
