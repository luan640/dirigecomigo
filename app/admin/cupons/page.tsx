'use client'

import { useEffect, useState } from 'react'
import { Loader2, TicketPercent } from 'lucide-react'
import { toast } from 'sonner'
import { formatCurrency } from '@/utils/format'

type Coupon = {
  id: string
  code: string
  discount_type: 'percent' | 'fixed'
  value: number
  min_amount: number
  used_count: number
  max_uses: number | null
  is_active: boolean
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [code, setCode] = useState('')
  const [discountType, setDiscountType] = useState<'percent' | 'fixed'>('percent')
  const [value, setValue] = useState<number>(10)
  const [minAmount, setMinAmount] = useState<number>(0)
  const [maxUses, setMaxUses] = useState<string>('')

  const loadCoupons = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/admin/coupons', { cache: 'no-store' })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Erro ao carregar cupons.')
      setCoupons(payload?.data || [])
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao carregar cupons.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadCoupons()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return toast.error('Informe o codigo do cupom.')
    if (!value || value <= 0) return toast.error('Valor do desconto invalido.')

    setSaving(true)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code,
          discount_type: discountType,
          value,
          min_amount: minAmount,
          max_uses: maxUses ? Number(maxUses) : null,
        }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Erro ao criar cupom.')

      setCode('')
      setValue(10)
      setMinAmount(0)
      setMaxUses('')
      toast.success('Cupom criado com sucesso.')
      await loadCoupons()
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao criar cupom.')
    } finally {
      setSaving(false)
    }
  }

  const toggleCoupon = async (coupon: Coupon) => {
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: coupon.id, is_active: !coupon.is_active }),
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Erro ao atualizar cupom.')
      toast.success('Status do cupom atualizado.')
      await loadCoupons()
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao atualizar cupom.')
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Cupons de Desconto</h1>
        <p className="text-sm text-gray-500 mt-1">Crie cupons para alunos usarem no checkout de agendamento.</p>
      </div>

      <form onSubmit={handleCreate} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <Input label="Codigo" value={code} onChange={setCode} placeholder="EX: BOASVINDAS10" />
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">Tipo</label>
            <select
              value={discountType}
              onChange={e => setDiscountType(e.target.value as 'percent' | 'fixed')}
              className={inp}
            >
              <option value="percent">Percentual (%)</option>
              <option value="fixed">Valor fixo (R$)</option>
            </select>
          </div>
          <Input label="Valor" value={String(value)} onChange={v => setValue(Number(v || 0))} type="number" />
          <Input label="Minimo pedido (R$)" value={String(minAmount)} onChange={v => setMinAmount(Number(v || 0))} type="number" />
          <Input label="Max usos (opcional)" value={maxUses} onChange={setMaxUses} type="number" />
        </div>
        <button
          type="submit"
          disabled={saving}
          className="px-4 py-2.5 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-bold inline-flex items-center gap-2 disabled:opacity-60"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <TicketPercent className="w-4 h-4" />}
          Criar cupom
        </button>
      </form>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Cupons cadastrados</h2>
        </div>
        {loading ? (
          <div className="px-5 py-8 text-sm text-gray-500 flex items-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Carregando...
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="text-left px-4 py-3 font-semibold">Codigo</th>
                  <th className="text-left px-4 py-3 font-semibold">Desconto</th>
                  <th className="text-left px-4 py-3 font-semibold">Minimo</th>
                  <th className="text-left px-4 py-3 font-semibold">Uso</th>
                  <th className="text-left px-4 py-3 font-semibold">Status</th>
                  <th className="text-left px-4 py-3 font-semibold">Acao</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-semibold text-gray-900">{c.code}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {c.discount_type === 'percent' ? `${c.value}%` : formatCurrency(c.value)}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{formatCurrency(c.min_amount || 0)}</td>
                    <td className="px-4 py-3 text-gray-700">
                      {c.used_count}{c.max_uses ? ` / ${c.max_uses}` : ''}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-600'}`}>
                        {c.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => toggleCoupon(c)}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        {c.is_active ? 'Desativar' : 'Ativar'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function Input({
  label, value, onChange, placeholder, type = 'text',
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder?: string
  type?: string
}) {
  return (
    <div>
      <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1">{label}</label>
      <input
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
        className={inp}
      />
    </div>
  )
}

const inp = 'w-full px-3 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
