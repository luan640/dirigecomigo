'use client'

import { useMemo, useState } from 'react'
import { format, subDays, subMonths } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { ChevronDown, Funnel } from 'lucide-react'
import AnalyticsCharts from './AnalyticsCharts'
import { formatCurrency } from '@/utils/format'

type BookingMetricRow = {
  date: string
  status: string
  gross: number
  net: number
}

type ManualLessonMetricRow = {
  date: string
  status: string
  amount: number
}

type Props = {
  bookings: BookingMetricRow[]
  manualLessons: ManualLessonMetricRow[]
}

const PERIOD_OPTIONS = [
  { value: 30, label: '30 dias' },
  { value: 90, label: '90 dias' },
  { value: 180, label: '6 meses' },
  { value: 365, label: '12 meses' },
] as const

const FOCUS_OPTIONS = [
  { value: 'overview', label: 'Visao geral' },
  { value: 'platform', label: 'So plataforma' },
  { value: 'external', label: 'So externas' },
] as const

function getMonthBucketCount(periodDays: number) {
  if (periodDays <= 30) return 1
  if (periodDays <= 90) return 3
  if (periodDays <= 180) return 6
  return 12
}

export default function AnalyticsClient({ bookings, manualLessons }: Props) {
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [periodDays, setPeriodDays] = useState<30 | 90 | 180 | 365>(180)
  const [focus, setFocus] = useState<'overview' | 'platform' | 'external'>('overview')

  const analytics = useMemo(() => {
    const today = new Date()
    const periodStart = subDays(today, periodDays - 1)
    const monthCount = getMonthBucketCount(periodDays)

    const filteredPlatform = bookings.filter(row => {
      const status = String(row.status || '')
      if (status === 'cancelled' || status === 'no_show') return false
      if (!row.date) return false
      return new Date(`${row.date}T00:00:00`) >= new Date(format(periodStart, 'yyyy-MM-dd'))
    })

    const filteredManual = manualLessons.filter(row => {
      if (String(row.status || '') !== 'completed') return false
      if (!row.date) return false
      return new Date(`${row.date}T00:00:00`) >= new Date(format(periodStart, 'yyyy-MM-dd'))
    })

    const monthlyBuckets = Array.from({ length: monthCount }, (_, index) => {
      const date = subMonths(today, monthCount - 1 - index)
      return {
        key: format(date, 'yyyy-MM'),
        month: format(date, 'MMM', { locale: ptBR }),
        gross: 0,
        net: 0,
      }
    })
    const monthlyMap = new Map(monthlyBuckets.map(item => [item.key, item]))

    const dailyRevenueBuckets = Array.from({ length: 30 }, (_, index) => {
      const date = subDays(today, 29 - index)
      return {
        key: format(date, 'yyyy-MM-dd'),
        day: format(date, 'dd/MM'),
        net: 0,
      }
    })
    const dailyRevenueMap = new Map(dailyRevenueBuckets.map(item => [item.key, item]))

    for (const row of filteredPlatform) {
      const monthBucket = monthlyMap.get(row.date.slice(0, 7))
      if (monthBucket) {
        monthBucket.gross += row.gross
        monthBucket.net += row.net
      }

      const dayBucket = dailyRevenueMap.get(row.date)
      if (dayBucket) {
        dayBucket.net += row.net
      }
    }

    const weeklyLessons = Array.from({ length: 4 }, (_, index) => {
      const end = subDays(today, (3 - index) * 7)
      const start = subDays(end, 6)
      const aulas = filteredPlatform.filter(row => {
        const date = new Date(`${row.date}T00:00:00`)
        return date >= start && date <= end
      }).length

      return {
        week: `${format(start, 'dd/MM')} - ${format(end, 'dd/MM')}`,
        aulas,
      }
    })

    const currentMonthKey = format(today, 'yyyy-MM')
    const monthPlatform = filteredPlatform.filter(row => row.date.startsWith(currentMonthKey))
    const monthManual = filteredManual.filter(row => row.date.startsWith(currentMonthKey))

    const totalGross = filteredPlatform.reduce((sum, row) => sum + row.gross, 0)
    const totalNet = filteredPlatform.reduce((sum, row) => sum + row.net, 0)
    const totalManualRevenue = filteredManual.reduce((sum, row) => sum + row.amount, 0)
    const upcomingBookings = bookings.filter(row => {
      const status = String(row.status || '')
      if (status !== 'confirmed' && status !== 'pending') return false
      return row.date >= format(today, 'yyyy-MM-dd')
    }).length

    return {
      currentMonthLabel: format(today, "MMMM 'de' yyyy", { locale: ptBR }),
      monthPlatformRevenue: monthPlatform.reduce((sum, row) => sum + row.net, 0),
      monthManualRevenue: monthManual.reduce((sum, row) => sum + row.amount, 0),
      totalGross,
      totalNet,
      totalManualRevenue,
      totalLessons: filteredPlatform.length,
      totalManualLessons: filteredManual.length,
      upcomingBookings,
      monthlyData: monthlyBuckets.map(item => ({
        month: item.month.charAt(0).toUpperCase() + item.month.slice(1),
        gross: item.gross,
        net: item.net,
      })),
      dailyRevenue: dailyRevenueBuckets.map(item => ({
        day: item.day,
        net: item.net,
      })),
      weeklyLessons,
    }
  }, [bookings, manualLessons, periodDays])

  const summaryCards = [
    { key: 'platform-gross', group: 'platform', label: `Receita bruta da plataforma (${PERIOD_OPTIONS.find(item => item.value === periodDays)?.label})`, value: formatCurrency(analytics.totalGross) },
    { key: 'platform-net', group: 'platform', label: `Receita liquida da plataforma (${PERIOD_OPTIONS.find(item => item.value === periodDays)?.label})`, value: formatCurrency(analytics.totalNet), note: 'Valor liquido do instrutor' },
    { key: 'external-revenue', group: 'external', label: `Receita externa (${PERIOD_OPTIONS.find(item => item.value === periodDays)?.label})`, value: formatCurrency(analytics.totalManualRevenue), note: 'Registros fora da plataforma' },
    { key: 'platform-lessons', group: 'platform', label: `Aulas da plataforma (${PERIOD_OPTIONS.find(item => item.value === periodDays)?.label})`, value: String(analytics.totalLessons) },
    { key: 'external-lessons', group: 'external', label: `Aulas externas (${PERIOD_OPTIONS.find(item => item.value === periodDays)?.label})`, value: String(analytics.totalManualLessons) },
    { key: 'upcoming', group: 'platform', label: 'Proximas aulas da plataforma', value: String(analytics.upcomingBookings) },
  ].filter(card => focus === 'overview' || card.group === focus)

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-extrabold text-gray-900">Relatorios</h1>
        <p className="text-sm text-slate-500">
          Analise desempenho da plataforma e registros externos com filtros por periodo. Dados externos continuam separados da operacao financeira da plataforma.
        </p>
      </div>

      <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
        <button
          type="button"
          onClick={() => setFiltersOpen(current => !current)}
          className="flex w-full items-center justify-between px-5 py-4 text-left"
        >
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-100 text-slate-600">
              <Funnel className="h-4 w-4" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900">Filtros da analise</p>
              <p className="text-xs text-slate-500">
                Periodo: {PERIOD_OPTIONS.find(item => item.value === periodDays)?.label} · Foco: {FOCUS_OPTIONS.find(item => item.value === focus)?.label}
              </p>
            </div>
          </div>
          <ChevronDown className={`h-5 w-5 text-slate-400 transition-transform ${filtersOpen ? 'rotate-180' : ''}`} />
        </button>

        {filtersOpen ? (
          <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-5">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Periodo</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setPeriodDays(option.value)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        periodDays === option.value
                          ? 'bg-[#0f2f63] text-white shadow-[0_10px_24px_rgba(15,47,99,0.18)]'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Foco da visao</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {FOCUS_OPTIONS.map(option => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setFocus(option.value)}
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                        focus === option.value
                          ? 'bg-[#f6d86c] text-[#0f2f63] shadow-[0_10px_24px_rgba(246,216,108,0.18)]'
                          : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mes atual</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{analytics.currentMonthLabel}</p>
                <p className="mt-1 text-xs text-slate-500">Plataforma: {formatCurrency(analytics.monthPlatformRevenue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Mes atual</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Receita externa</p>
                <p className="mt-1 text-xs text-slate-500">{formatCurrency(analytics.monthManualRevenue)}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Janela ativa</p>
                <p className="mt-2 text-lg font-bold text-slate-900">{PERIOD_OPTIONS.find(item => item.value === periodDays)?.label}</p>
                <p className="mt-1 text-xs text-slate-500">Os cards e graficos respondem a esse periodo.</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">Separacao</p>
                <p className="mt-2 text-lg font-bold text-slate-900">Financeiro preservado</p>
                <p className="mt-1 text-xs text-slate-500">Registros externos nao entram em carteira ou pagamento.</p>
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {summaryCards.map(({ key, label, value, note }) => (
          <div key={key} className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm">
            <p className="text-xl font-extrabold text-gray-900">{value}</p>
            <p className="mt-0.5 text-xs text-gray-500">{label}</p>
            {note ? <p className="text-xs text-gray-400">{note}</p> : null}
          </div>
        ))}
      </div>

      {focus !== 'external' ? (
        <AnalyticsCharts
          title="Plataforma"
          revenueLabel={`Receita mensal da plataforma (${PERIOD_OPTIONS.find(item => item.value === periodDays)?.label})`}
          dailyRevenueLabel="Receita diaria da plataforma (ultimos 30 dias)"
          lessonsLabel="Aulas da plataforma por semana (ultimas 4 semanas)"
          monthlyData={analytics.monthlyData}
          dailyRevenue={analytics.dailyRevenue}
          weeklyLessons={analytics.weeklyLessons}
        />
      ) : (
        <section className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
          <h2 className="font-bold text-amber-900">Foco em aulas externas</h2>
          <p className="mt-1 text-sm text-amber-800">
            Nesta visao os cards mostram apenas registros externos. Os graficos continuam reservados para a operacao da plataforma.
          </p>
        </section>
      )}

      <section className="rounded-2xl border border-amber-100 bg-amber-50/70 p-5">
        <h2 className="font-bold text-amber-900">Aulas externas ficam separadas</h2>
        <p className="mt-1 text-sm text-amber-800">
          Os graficos mostram apenas dados da plataforma. Os registros externos entram somente nos cards dedicados e na pagina de gestao interna do instrutor.
        </p>
      </section>
    </div>
  )
}
