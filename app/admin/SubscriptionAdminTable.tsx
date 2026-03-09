'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'

type AdminSubscriptionItem = {
  id: string
  instructor_id: string
  instructor_name: string
  instructor_email: string
  status: string
  provider: string
  amount: number
  current_period_start: string
  current_period_end: string
  created_at: string
}

type Props = {
  initialRows: AdminSubscriptionItem[]
}

function formatDate(value?: string) {
  if (!value) return '-'
  return new Date(`${String(value).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR')
}

export default function SubscriptionAdminTable({ initialRows }: Props) {
  const [rows, setRows] = useState(initialRows)
  const [savingId, setSavingId] = useState<string | null>(null)

  const handleChange = (id: string, value: string) => {
    setRows(current => current.map(row => (
      row.id === id
        ? { ...row, current_period_end: value }
        : row
    )))
  }

  const handleSave = async (id: string) => {
    const row = rows.find(item => item.id === id)
    if (!row) return

    setSavingId(id)
    try {
      const res = await fetch('/api/admin/subscriptions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          current_period_end: row.current_period_end,
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Falha ao atualizar assinatura.')

      setRows(current => current.map(item => (
        item.id === id
          ? {
              ...item,
              current_period_end: String(payload?.data?.current_period_end || item.current_period_end),
              status: String(payload?.data?.status || item.status),
            }
          : item
      )))

      toast.success('Data limite atualizada.')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao atualizar assinatura.')
    } finally {
      setSavingId(null)
    }
  }

  return (
    <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b border-gray-100">
        <h2 className="font-bold text-gray-900">Assinaturas de Instrutores</h2>
        <p className="text-sm text-gray-500 mt-1">O admin pode consultar a assinatura e ajustar a data limite de acesso.</p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-gray-600">
            <tr>
              <th className="text-left px-4 py-3 font-semibold">Instrutor</th>
              <th className="text-left px-4 py-3 font-semibold">Email</th>
              <th className="text-left px-4 py-3 font-semibold">Status</th>
              <th className="text-left px-4 py-3 font-semibold">Provedor</th>
              <th className="text-left px-4 py-3 font-semibold">Valor</th>
              <th className="text-left px-4 py-3 font-semibold">Inicio</th>
              <th className="text-left px-4 py-3 font-semibold">Limite de Acesso</th>
              <th className="text-left px-4 py-3 font-semibold">Acao</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-gray-500" colSpan={8}>
                  Nenhuma assinatura encontrada.
                </td>
              </tr>
            ) : (
              rows.map(row => (
                <tr key={row.id} className="border-t border-gray-100">
                  <td className="px-4 py-3 font-medium text-gray-900">{row.instructor_name}</td>
                  <td className="px-4 py-3 text-gray-600">{row.instructor_email}</td>
                  <td className="px-4 py-3 text-gray-700">{row.status}</td>
                  <td className="px-4 py-3 text-gray-700">{row.provider}</td>
                  <td className="px-4 py-3 text-gray-700">R$ {row.amount.toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(row.current_period_start)}</td>
                  <td className="px-4 py-3">
                    <input
                      type="date"
                      value={String(row.current_period_end || '').slice(0, 10)}
                      onChange={event => handleChange(row.id, event.target.value)}
                      className="w-40 rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700"
                    />
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => handleSave(row.id)}
                      disabled={savingId === row.id}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-700 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
                    >
                      {savingId === row.id ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                      Salvar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}
