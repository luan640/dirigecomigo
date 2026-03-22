'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import type { PlatformPricingSettings } from '@/lib/platformPricing'
import { formatCurrency } from '@/utils/format'

type Props = {
  initialSettings: PlatformPricingSettings
}

export default function AdminPricingSettingsForm({ initialSettings }: Props) {
  const [platformFee, setPlatformFee] = useState(String(initialSettings.platform_fee_percent))
  const [pixFee, setPixFee] = useState(String(initialSettings.pix_fee_percent))
  const [cardFee, setCardFee] = useState(String(initialSettings.card_fee_percent))
  const [subscriptionPrice, setSubscriptionPrice] = useState(String(initialSettings.subscription_price))
  const [saving, setSaving] = useState(false)

  const previewNet = 100
  const platformPercent = Number(platformFee || 0)
  const pixPercent = Number(pixFee || 0)
  const cardPercent = Number(cardFee || 0)
  const pixPreview = previewNet * (1 + (platformPercent + pixPercent) / 100)
  const cardPreview = previewNet * (1 + (platformPercent + cardPercent) / 100)

  const handleSave = async () => {
    setSaving(true)
    try {
      const response = await fetch('/api/admin/subscriptions?scope=platform-settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          platform_fee_percent: Number(platformFee),
          pix_fee_percent: Number(pixFee),
          card_fee_percent: Number(cardFee),
          subscription_price: Number(subscriptionPrice),
        }),
      })

      const payload = await response.json().catch(() => null)
      if (!response.ok) {
        throw new Error(payload?.error || 'Nao foi possivel salvar a configuracao.')
      }

      setPlatformFee(String(payload.data.platform_fee_percent))
      setPixFee(String(payload.data.pix_fee_percent))
      setCardFee(String(payload.data.card_fee_percent))
      setSubscriptionPrice(String(payload.data.subscription_price))
      toast.success('Configuracao salva.')
    } catch (err) {
      toast.error((err as Error).message || 'Nao foi possivel salvar a configuracao.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm space-y-6">
      <div>
        <h2 className="text-lg font-bold text-gray-900">Configurações de preço</h2>
        <p className="mt-1 text-sm text-gray-500">
          Controle o valor da assinatura mensal dos instrutores e as taxas cobradas sobre as aulas.
        </p>
      </div>

      {/* Assinatura */}
      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4">
        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-blue-700">
          Assinatura mensal do instrutor (R$)
        </label>
        <div className="flex items-center gap-3 mt-2">
          <input
            value={subscriptionPrice}
            onChange={e => setSubscriptionPrice(e.target.value)}
            type="number"
            min={1}
            step={0.01}
            className="w-40 rounded-xl border border-blue-200 bg-white px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="text-sm text-blue-700">
            Cobrado mensalmente via Mercado Pago ao ativar a assinatura.
          </p>
        </div>
      </div>

      {/* Taxas das aulas */}
      <div>
        <p className="text-sm font-semibold text-gray-700 mb-3">Taxas sobre aulas avulsas</p>
        <p className="text-xs text-gray-500 mb-4">
          O aluno paga: valor do instrutor + percentual da plataforma + taxa do Pix ou do cartao.
        </p>
      <div className="grid gap-4 md:grid-cols-3">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">
            Percentual da plataforma (%)
          </label>
          <input
            value={platformFee}
            onChange={event => setPlatformFee(event.target.value)}
            type="number"
            min={0}
            max={100}
            step={0.01}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Parte da receita da plataforma em cada aula.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">
            Taxa do Pix (%)
          </label>
          <input
            value={pixFee}
            onChange={event => setPixFee(event.target.value)}
            type="number"
            min={0}
            max={100}
            step={0.01}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Se o instrutor quiser receber {formatCurrency(previewNet)}, o aluno paga {formatCurrency(pixPreview)} no Pix.
          </p>
        </div>

        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-gray-700">
            Taxa do cartão (%)
          </label>
          <input
            value={cardFee}
            onChange={event => setCardFee(event.target.value)}
            type="number"
            min={0}
            max={100}
            step={0.01}
            className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <p className="mt-2 text-xs text-gray-500">
            Se o instrutor quiser receber {formatCurrency(previewNet)}, o aluno paga {formatCurrency(cardPreview)} no cartao.
          </p>
        </div>
      </div>
      </div>

      <button
        type="button"
        onClick={handleSave}
        disabled={saving}
        className="mt-4 inline-flex items-center gap-2 rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {saving ? 'Salvando...' : 'Salvar configuração'}
      </button>
    </section>
  )
}
