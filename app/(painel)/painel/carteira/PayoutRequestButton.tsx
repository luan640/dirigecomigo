'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'
import { ArrowDownToLine, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/utils/format'

type Props = {
  availableToWithdraw: number
}

export default function PayoutRequestButton({ availableToWithdraw }: Props) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [amount, setAmount] = useState(availableToWithdraw > 0 ? availableToWithdraw.toFixed(2) : '')
  const [notes, setNotes] = useState('')

  const disabled = availableToWithdraw <= 0

  const handleOpen = () => {
    if (disabled) return
    setAmount(availableToWithdraw.toFixed(2))
    setOpen(true)
  }

  const handleSubmit = async () => {
    const parsedAmount = Number(amount)
    if (!parsedAmount || parsedAmount <= 0) {
      toast.error('Informe um valor valido para o saque.')
      return
    }

    if (parsedAmount > availableToWithdraw) {
      toast.error('O valor excede o saldo disponivel para saque.')
      return
    }

    setSaving(true)

    try {
      const response = await fetch('/api/instructor/payout-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parsedAmount,
          notes,
        }),
      })

      const payload = await response.json()
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel solicitar o saque.')
      }

      toast.success('Solicitacao de saque enviada para o admin.')
      setOpen(false)
      setNotes('')
      router.refresh()
    } catch (error) {
      toast.error((error as Error).message || 'Nao foi possivel solicitar o saque.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <>
      <button
        type="button"
        onClick={handleOpen}
        disabled={disabled}
        className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <ArrowDownToLine className="h-4 w-4" />
        Solicitar saque
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">
          {disabled ? 'Sem saldo' : formatCurrency(availableToWithdraw)}
        </span>
      </button>

      {open ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/45 px-4 py-6">
          <div className="w-full max-w-xl rounded-[28px] bg-white shadow-[0_24px_80px_rgba(15,23,42,0.28)]">
            <div className="border-b border-slate-200 px-6 py-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Solicitar saque</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    O pedido fica pendente para o admin processar manualmente. Saldo disponivel: {formatCurrency(availableToWithdraw)}.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  disabled={saving}
                  className="rounded-full border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-500 hover:bg-slate-50"
                >
                  Fechar
                </button>
              </div>
            </div>

            <div className="space-y-4 px-6 py-5">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Valor do saque</label>
                <input
                  type="number"
                  min={1}
                  step="0.01"
                  value={amount}
                  onChange={event => setAmount(event.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0f2f63] focus:ring-2 focus:ring-[#0f2f63]/10"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">Observacoes</label>
                <textarea
                  rows={4}
                  value={notes}
                  onChange={event => setNotes(event.target.value)}
                  placeholder="Opcional. Ex.: saque da semana, chave Pix cadastrada no contrato."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-sm text-slate-700 outline-none transition focus:border-[#0f2f63] focus:ring-2 focus:ring-[#0f2f63]/10"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-5">
              <button
                type="button"
                onClick={() => setOpen(false)}
                disabled={saving}
                className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={saving}
                className="inline-flex min-w-36 items-center justify-center gap-2 rounded-xl bg-[#0f2f63] px-4 py-2.5 text-sm font-semibold text-white hover:bg-[#0b254e] disabled:opacity-60"
              >
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowDownToLine className="h-4 w-4" />}
                Enviar solicitacao
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
