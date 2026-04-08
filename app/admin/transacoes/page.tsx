import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { formatCurrency } from '@/utils/format'
import AdminTransactionsTable, { type AdminTransactionRow } from './AdminTransactionsTable'

type AdminProfileRow = {
  id: string
  full_name?: string
  email?: string
}

type AdminRoleLookup = {
  role?: string | null
}

type PaymentRecord = Record<string, unknown>
type BookingRecord = Record<string, unknown>
type RefundRecord = Record<string, unknown>

async function getAdminRole() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle() as { data: AdminRoleLookup | null; error: Error | null }

  return profile?.role || null
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

function toRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : {}
}

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizePaymentMethod(payment: PaymentRecord, booking?: BookingRecord) {
  const metadata = toRecord(payment.metadata || payment.provider_metadata)
  const rawMethod =
    asString(metadata.payment_method_id) ||
    asString(metadata.payment_method) ||
    asString(booking?.payment_method) ||
    asString(booking?.paymentMethod)

  const method = rawMethod.trim().toLowerCase()
  if (!method) {
    if (asString(payment.provider).toLowerCase() === 'mercadopago') return 'Mercado Pago'
    return '-'
  }
  if (method.includes('pix')) return 'Pix'
  if (method.includes('card') || method.includes('credit') || method.includes('credito')) return 'Cartao'
  if (method.includes('debit') || method.includes('debito')) return 'Debito'
  if (method.includes('ticket') || method.includes('boleto')) return 'Boleto'
  return method.charAt(0).toUpperCase() + method.slice(1)
}

function normalizeStatus(status: string) {
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

function normalizeBookingStatus(status: string) {
  switch (status) {
    case 'confirmed':
      return { label: 'Confirmada', classes: 'bg-emerald-100 text-emerald-700' }
    case 'completed':
      return { label: 'Concluida', classes: 'bg-blue-100 text-blue-700' }
    case 'pending':
      return { label: 'Pendente', classes: 'bg-amber-100 text-amber-700' }
    case 'cancelled':
      return { label: 'Cancelada', classes: 'bg-red-100 text-red-700' }
    case 'no_show':
      return { label: 'No-show', classes: 'bg-slate-200 text-slate-700' }
    default:
      return { label: status || '-', classes: 'bg-slate-100 text-slate-700' }
  }
}

type ProviderStatusInfo = {
  status: string
  statusDetail: string
  liveMode: boolean | null
  error?: string
}

async function fetchMercadoPagoStatuses(paymentIds: string[]): Promise<Map<string, ProviderStatusInfo>> {
  const accessToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  const uniqueIds = [...new Set(paymentIds.filter(Boolean))]
  const results = new Map<string, ProviderStatusInfo>()

  if (!accessToken || uniqueIds.length === 0) return results

  const client = new MercadoPagoConfig({ accessToken })
  const paymentClient = new Payment(client)

  await Promise.all(
    uniqueIds.map(async paymentId => {
      try {
        const mpPayment = await paymentClient.get({ id: paymentId })
        results.set(paymentId, {
          status: asString(mpPayment.status).toLowerCase() || '-',
          statusDetail: asString(mpPayment.status_detail).toLowerCase() || '-',
          liveMode: typeof mpPayment.live_mode === 'boolean' ? mpPayment.live_mode : null,
        })
      } catch (error) {
        results.set(paymentId, {
          status: '-',
          statusDetail: '-',
          liveMode: null,
          error: error instanceof Error ? error.message : 'Falha ao consultar provedor.',
        })
      }
    }),
  )

  return results
}

function formatDateTime(value: string) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString('pt-BR')
}

function formatLessonSlot(dateValue: string, startTime: string, endTime: string) {
  if (!dateValue) return '-'
  const normalizedDate = dateValue.length <= 10 ? `${dateValue}T00:00:00` : dateValue
  const date = new Date(normalizedDate)
  const label = Number.isNaN(date.getTime()) ? dateValue : date.toLocaleDateString('pt-BR')
  const start = startTime ? startTime.slice(0, 5) : '--:--'
  const end = endTime ? endTime.slice(0, 5) : '--:--'
  return `${label} - ${start} - ${end}`
}

function SummaryCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{hint}</p>
    </div>
  )
}

export default async function AdminTransactionsPage() {
  const role = await getAdminRole()
  if (role !== 'admin') redirect('/entrar')

  const service = getServiceClient()
  if (!service) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Pagamentos</h1>
        <p className="mt-2 text-sm text-red-700">
          SUPABASE_SERVICE_ROLE_KEY nao configurado. Nao foi possivel carregar os pagamentos administrativos.
        </p>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = service as any
  const [{ data: profiles }, { data: bookings }, { data: payments }, { data: refunds }] = await Promise.all([
    db.from('profiles').select('id,full_name,email'),
    db.from('bookings').select('*'),
    db.from('payments').select('*').order('created_at', { ascending: false }),
    db.from('payment_refunds').select('*').order('created_at', { ascending: false }),
  ])

  const profileRows: AdminProfileRow[] = Array.isArray(profiles) ? profiles : []
  const bookingRows: BookingRecord[] = Array.isArray(bookings) ? bookings : []
  const paymentRows: PaymentRecord[] = Array.isArray(payments) ? payments : []
  const refundRows: RefundRecord[] = Array.isArray(refunds) ? refunds : []

  const mercadoPagoProviderIds = paymentRows
    .map(payment => {
      const provider = asString(payment.provider).toLowerCase()
      const providerPaymentId = asString(payment.provider_payment_id) || asString(payment.provider_reference)
      return provider === 'mercadopago' ? providerPaymentId : ''
    })
    .filter(Boolean)
  const providerStatusMap = await fetchMercadoPagoStatuses(mercadoPagoProviderIds)

  const profileMap = new Map(profileRows.map(profile => [profile.id, profile]))
  const bookingMap = new Map(bookingRows.map(booking => [asString(booking.id), booking]))
  const refundMap = new Map<string, RefundRecord[]>()

  for (const refund of refundRows) {
    const paymentId = asString(refund.payment_id)
    if (!paymentId) continue
    const current = refundMap.get(paymentId) || []
    current.push(refund)
    refundMap.set(paymentId, current)
  }

  const rows: AdminTransactionRow[] = paymentRows.map(payment => {
    const bookingId = asString(payment.booking_id)
    const booking = bookingMap.get(bookingId)
    const studentId = asString(payment.student_id) || asString(booking?.student_id)
    const instructorId = asString(booking?.instructor_id)
    const student = profileMap.get(studentId)
    const instructor = profileMap.get(instructorId)
    const createdAt = asString(payment.created_at)
    const paidAt = asString(payment.paid_at)
    const amount = asNumber(payment.amount || booking?.total_amount || booking?.gross_amount)
    const providerPaymentId = asString(payment.provider_payment_id) || asString(payment.provider_reference)
    const status = asString(payment.status).toLowerCase()
    const provider = asString(payment.provider).toLowerCase() || '-'
    const providerStatus = providerStatusMap.get(providerPaymentId)
    const refundHistory = refundMap.get(asString(payment.id)) || []
    const refundedAmount = refundHistory.reduce((sum, refund) => sum + asNumber(refund.amount), 0)
    const remainingRefundableAmount = Math.max(0, amount - refundedAmount)
    const bookingStatus = asString(booking?.status).toLowerCase()
    const providerStatusValue = providerStatus?.status || '-'
    const canRefund =
      provider === 'mercadopago' &&
      !!providerPaymentId &&
      remainingRefundableAmount > 0 &&
      ['paid', 'approved'].includes(status) &&
      !['refunded', 'charged_back'].includes(providerStatusValue)

    return {
      id: asString(payment.id),
      bookingId,
      provider,
      providerPaymentId,
      amount,
      refundedAmount,
      remainingRefundableAmount,
      refundCount: refundHistory.length,
      latestRefundAtLabel: formatDateTime(asString(refundHistory[0]?.created_at)),
      latestRefundReason: asString(refundHistory[0]?.reason),
      status,
      statusUi: normalizeStatus(status),
      providerStatusUi: normalizeStatus(providerStatusValue),
      bookingStatusUi: normalizeBookingStatus(bookingStatus),
      method: normalizePaymentMethod(payment, booking),
      studentName: student?.full_name || 'Sem nome',
      studentEmail: student?.email || '-',
      instructorName: instructor?.full_name || 'Sem instrutor',
      lessonLabel: formatLessonSlot(
        asString(booking?.scheduled_date) || asString(booking?.date),
        asString(booking?.start_time),
        asString(booking?.end_time),
      ),
      bookingStatusLabel: bookingStatus || '-',
      providerStatusDetail: providerStatus?.statusDetail || '-',
      providerLiveMode: providerStatus?.liveMode ?? null,
      providerStatusError: providerStatus?.error || '',
      createdAtLabel: formatDateTime(createdAt),
      paidAtLabel: formatDateTime(paidAt),
      canRefund,
    }
  })

  const totalPaid = rows
    .filter(row => row.status === 'paid' || row.status === 'approved')
    .reduce((sum, row) => sum + row.amount, 0)
  const totalRefunded = rows.reduce((sum, row) => sum + row.refundedAmount, 0)
  const paidCount = rows.filter(row => row.status === 'paid' || row.status === 'approved').length
  const pendingCount = rows.filter(row => row.status === 'pending' || row.status === 'processing').length
  const failedCount = rows.filter(row => row.status === 'failed' || row.status === 'rejected' || row.status === 'cancelled').length

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Pagamentos e aulas</h1>
          <p className="mt-1 text-sm text-gray-500">
            Visao operacional das aulas pagas, do status real no Mercado Pago e dos reembolsos feitos pelo admin.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          O botao <span className="font-semibold">Reembolsar</span> usa o <span className="font-semibold">provider_payment_id</span>
          {' '}e registra auditoria em <span className="font-semibold">payment_refunds</span>.
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <SummaryCard title="Total de registros" value={String(rows.length)} hint="Pagamentos persistidos na tabela payments." />
        <SummaryCard title="Pagos" value={String(paidCount)} hint="Pagamentos marcados como pagos/aprovados." />
        <SummaryCard title="Pendentes" value={String(pendingCount)} hint="Pendentes ou em processamento." />
        <SummaryCard title="Valor pago" value={formatCurrency(totalPaid)} hint="Soma dos pagamentos aprovados." />
        <SummaryCard title="Reembolsado" value={formatCurrency(totalRefunded)} hint="Total auditado na tabela payment_refunds." />
      </section>

      <AdminTransactionsTable
        initialRows={rows}
        failedCount={failedCount}
      />
    </div>
  )
}
