'use client'

import { Suspense, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSearchParams } from 'next/navigation'
import { CheckCircle2, XCircle, Loader2, CreditCard, Shield, Zap, Clock } from 'lucide-react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { PLATFORM_CONFIG } from '@/constants/pricing'
import { formatCurrency } from '@/utils/format'

type SubStatus = 'active' | 'pending' | 'trial' | 'expired' | 'cancelled'

type SubscriptionPayload = {
  status?: string
  amount?: number
  provider?: string
  current_period_start?: string
  current_period_end?: string
  started_at?: string
  expires_at?: string
}

const BENEFITS = [
  { icon: Zap, text: 'Apareca nos resultados de busca para alunos' },
  { icon: Shield, text: 'Receba pagamentos diretamente pela plataforma' },
  { icon: CheckCircle2, text: 'Acesso ao painel de controle completo' },
  { icon: CreditCard, text: 'Relatorios de receita e analytics mensais' },
]

function normalizeSubscription(raw: SubscriptionPayload | null) {
  const status = (raw?.status as SubStatus) || 'expired'
  const start = raw?.current_period_start || (raw?.started_at ? raw.started_at.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'))
  const end = raw?.current_period_end || (raw?.expires_at ? raw.expires_at.slice(0, 10) : format(new Date(), 'yyyy-MM-dd'))
  const amount = Number(raw?.amount || PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE)
  return {
    status,
    provider: String(raw?.provider || ''),
    current_period_start: start,
    current_period_end: end,
    amount,
  }
}

type InstructorStatus = 'pending' | 'approved' | 'rejected' | null

function AssinaturaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [instructorStatus, setInstructorStatus] = useState<InstructorStatus>(null)
  const [subscriptionPrice, setSubscriptionPrice] = useState(PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE)
  const [sub, setSub] = useState(() =>
    normalizeSubscription(null)
  )

  const isActive = useMemo(() => {
    if (sub.status !== 'active') return false
    return sub.current_period_end >= format(new Date(), 'yyyy-MM-dd')
  }, [sub])

  const loadSubscription = async () => {
    setFetching(true)
    try {
      const [subRes, instrRes] = await Promise.all([
        fetch('/api/subscriptions/status', { cache: 'no-store' }),
        fetch('/api/instructor/status', { cache: 'no-store' }),
      ])
      const subPayload = await subRes.json()
      if (!subRes.ok) throw new Error(subPayload?.error || 'Falha ao buscar assinatura.')
      setSub(normalizeSubscription(subPayload?.data || null))
      if (typeof subPayload?.subscriptionPrice === 'number') {
        setSubscriptionPrice(subPayload.subscriptionPrice)
      }

      if (instrRes.ok) {
        const instrPayload = await instrRes.json()
        const st = instrPayload?.data?.status as string | undefined
        setInstructorStatus((st as InstructorStatus) ?? null)
      }

      return subPayload?.data || null
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao carregar assinatura.')
      return null
    } finally {
      setFetching(false)
    }
  }

  useEffect(() => {
    loadSubscription()
  }, [])

  useEffect(() => {
    const checkoutStatus = searchParams.get('checkout')
    const preapprovalId = searchParams.get('preapproval_id')
    const syncCheckout = async () => {
      if (!preapprovalId && checkoutStatus !== 'success') {
        await loadSubscription()
        return
      }

      try {
        const verifyUrl = preapprovalId
          ? `/api/subscriptions/verify?preapproval_id=${encodeURIComponent(preapprovalId)}`
          : '/api/subscriptions/verify'
        const res = await fetch(verifyUrl, {
          cache: 'no-store',
        })
        const payload = await res.json()
        if (!res.ok) throw new Error(payload?.error || 'Falha ao confirmar checkout.')
        const nextSub = normalizeSubscription(payload?.data || null)
        setSub(nextSub)
        router.refresh()
        router.replace('/painel/assinatura')
      } catch (err) {
        toast.error((err as Error).message || 'Erro ao confirmar checkout.')
        await loadSubscription()
      }
    }

    if (checkoutStatus === 'success') {
      toast.success('Checkout concluido. A assinatura sera confirmada assim que o Mercado Pago autorizar a cobranca.')
      void syncCheckout()
    }
    if (checkoutStatus === 'cancelled') {
      toast.info('Checkout cancelado.')
      router.replace('/painel/assinatura')
    }
  }, [router, searchParams])

  const handleRenew = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/activate', {
        method: 'POST',
      })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Falha ao ativar assinatura.')
      if (payload?.redirect_url) {
        toast.info('Voce sera redirecionado para o checkout seguro do Mercado Pago.')
        window.location.href = String(payload.redirect_url)
        return
      }
      setSub(normalizeSubscription(payload?.data || null))
      toast.success('Assinatura ativada! Acesso ao painel liberado.')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao ativar assinatura.')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = async () => {
    if (!confirm('Tem certeza que deseja cancelar sua assinatura?')) return
    setLoading(true)
    try {
      const res = await fetch('/api/subscriptions/cancel', { method: 'POST' })
      const payload = await res.json()
      if (!res.ok) throw new Error(payload?.error || 'Falha ao cancelar assinatura.')
      setSub(prev => ({ ...prev, status: 'cancelled' }))
      toast.info('Assinatura cancelada.')
    } catch (err) {
      toast.error((err as Error).message || 'Erro ao cancelar assinatura.')
    } finally {
      setLoading(false)
    }
  }

  const statusConfig = {
    active: { label: 'Ativa', cls: 'bg-emerald-100 text-emerald-700' },
    pending: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
    trial: { label: 'Pendente', cls: 'bg-amber-100 text-amber-700' },
    expired: { label: 'Expirada', cls: 'bg-red-100 text-red-700' },
    cancelled: { label: 'Cancelada', cls: 'bg-gray-100 text-gray-600' },
  }

  function formatDate(d: string) {
    return format(new Date(d + 'T00:00:00'), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
  }

  const isPending = instructorStatus === 'pending' || instructorStatus === null

  return (
    <div className="max-w-xl mx-auto space-y-5">
      <h1 className="text-2xl font-extrabold text-gray-900">Assinatura</h1>

      {isPending && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-4 flex items-start gap-3">
          <Clock className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-blue-800">Cadastro em avaliação</p>
            <p className="text-sm text-blue-700 mt-0.5">
              Seu cadastro está sendo analisado pela nossa equipe. Assim que for aprovado, você poderá ativar a assinatura e ter acesso completo ao painel.
            </p>
          </div>
        </div>
      )}

      {!isPending && !isActive && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-sm text-amber-800">
          Seu acesso ao painel esta bloqueado. Ative a assinatura de {formatCurrency(subscriptionPrice)}/mes para liberar todas as opcoes.
        </div>
      )}

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        {fetching ? (
          <div className="py-8 flex items-center justify-center text-gray-500 text-sm">
            <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando assinatura...
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-500">Plano atual</p>
                <p className="text-xl font-extrabold text-gray-900 mt-0.5">DirecaoFacil Pro</p>
              </div>
              <span className={`text-sm font-bold px-3 py-1 rounded-full ${statusConfig[sub.status].cls}`}>
                {statusConfig[sub.status].label}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 py-4 border-t border-b border-gray-50">
              <div>
                <p className="text-xs text-gray-400">Valor mensal</p>
                <p className="font-bold text-gray-900 mt-0.5">
                  {formatCurrency(subscriptionPrice)}<span className="text-xs font-normal text-gray-400">/mes</span>
                </p>
              </div>
              {isActive && (
                <>
                  <div>
                    <p className="text-xs text-gray-400">Renova em</p>
                    <p className="font-bold text-gray-900 mt-0.5 text-sm">{formatDate(sub.current_period_end)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-400">Inicio do periodo</p>
                    <p className="font-medium text-gray-700 mt-0.5 text-sm">{formatDate(sub.current_period_start)}</p>
                  </div>
                </>
              )}
            </div>

            {!isActive && !isPending && (
              <div className="mt-4 rounded-xl border border-gray-100 bg-gray-50 p-4 space-y-3">
                <p className="text-sm font-semibold text-gray-800">Pagamento recorrente seguro no Mercado Pago</p>
                <p className="text-xs text-gray-500">
                  Voce sera redirecionado para um ambiente seguro do Mercado Pago para autorizar a assinatura de {formatCurrency(subscriptionPrice)}/mes.
                </p>
              </div>
            )}

            <div className="mt-4 flex gap-3">
              {!isActive && !isPending && (
                <button
                  onClick={handleRenew}
                  disabled={loading}
                  className="flex-1 py-2.5 bg-blue-700 hover:bg-blue-800 text-white font-bold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CreditCard className="w-4 h-4" />}
                  Ir para checkout seguro do Mercado Pago
                </button>
              )}
              {isActive && (
                <button
                  onClick={handleCancel}
                  disabled={loading}
                  className="flex-1 py-2.5 border border-gray-200 text-gray-600 hover:text-red-600 hover:border-red-200 font-semibold rounded-xl flex items-center justify-center gap-2 text-sm transition-colors disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                  Cancelar assinatura
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h2 className="font-bold text-gray-900 mb-4">O que esta incluido</h2>
        <div className="space-y-3">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-gray-600">
              <Icon className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

export default function AssinaturaPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-xl mx-auto space-y-5">
          <h1 className="text-2xl font-extrabold text-gray-900">Assinatura</h1>
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <div className="py-8 flex items-center justify-center text-gray-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin mr-2" /> Carregando assinatura...
            </div>
          </div>
        </div>
      }
    >
      <AssinaturaContent />
    </Suspense>
  )
}
