import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { MercadoPagoConfig, Payment } from 'mercadopago'
import { formatCurrency } from '@/utils/format'

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

function shortId(value: string) {
  if (!value) return '-'
  return value.length > 18 ? `${value.slice(0, 8)}...${value.slice(-6)}` : value
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
      <div className="mx-auto max-w-5xl rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Pagamentos</h1>
        <p className="mt-2 text-sm text-red-700">
          SUPABASE_SERVICE_ROLE_KEY nao configurado. Nao foi possivel carregar os pagamentos administrativos.
        </p>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = service as any
  const [{ data: profiles }, { data: bookings }, { data: payments }] = await Promise.all([
    db.from('profiles').select('id,full_name,email'),
    db.from('bookings').select('*'),
    db.from('payments').select('*').order('created_at', { ascending: false }),
  ])

  const profileRows: AdminProfileRow[] = Array.isArray(profiles) ? profiles : []
  const bookingRows: BookingRecord[] = Array.isArray(bookings) ? bookings : []
  const paymentRows: PaymentRecord[] = Array.isArray(payments) ? payments : []
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

  const rows = paymentRows.map(payment => {
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
    const providerStatus = providerStatusMap.get(providerPaymentId)

    return {
      id: asString(payment.id),
      bookingId,
      provider: asString(payment.provider) || '-',
      providerPaymentId,
      amount,
      status,
      statusUi: normalizeStatus(status),
      providerStatusUi: normalizeStatus(providerStatus?.status || ''),
      method: normalizePaymentMethod(payment, booking),
      studentName: student?.full_name || 'Sem nome',
      studentEmail: student?.email || '-',
      instructorName: instructor?.full_name || 'Sem instrutor',
      providerStatusLabel: providerStatus?.status || '-',
      providerStatusDetail: providerStatus?.statusDetail || '-',
      providerLiveMode: providerStatus?.liveMode,
      providerStatusError: providerStatus?.error || '',
      createdAt,
      paidAt,
      createdAtLabel: formatDateTime(createdAt),
      paidAtLabel: formatDateTime(paidAt),
    }
  })

  const totalPaid = rows
    .filter(row => row.status === 'paid' || row.status === 'approved')
    .reduce((sum, row) => sum + row.amount, 0)

  const paidCount = rows.filter(row => row.status === 'paid' || row.status === 'approved').length
  const pendingCount = rows.filter(row => row.status === 'pending' || row.status === 'processing').length
  const failedCount = rows.filter(row => row.status === 'failed' || row.status === 'rejected' || row.status === 'cancelled').length

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Pagamentos realizados</h1>
          <p className="mt-1 text-sm text-gray-500">
            Auditoria dos pagamentos salvos no sistema com referencia do provedor e status real de cobranca.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          A coluna <span className="font-semibold">Status no provedor</span> consulta o pagamento direto no Mercado Pago.
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Total de registros" value={String(rows.length)} hint="Pagamentos persistidos na tabela payments." />
        <SummaryCard title="Pagos" value={String(paidCount)} hint="Pagamentos marcados como pagos/aprovados." />
        <SummaryCard title="Pendentes" value={String(pendingCount)} hint="Pendentes ou em processamento." />
        <SummaryCard title="Valor pago" value={formatCurrency(totalPaid)} hint="Soma dos pagamentos aprovados." />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">Lista de pagamentos</h2>
          <p className="mt-1 text-sm text-gray-500">
            {failedCount > 0 ? `${failedCount} pagamentos com falha tambem aparecem aqui para auditoria.` : 'Todos os registros encontrados aparecem nesta tabela.'}
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Status</th>
                <th className="px-4 py-3 text-left font-semibold">Valor</th>
                <th className="px-4 py-3 text-left font-semibold">Metodo</th>
                <th className="px-4 py-3 text-left font-semibold">Aluno</th>
                <th className="px-4 py-3 text-left font-semibold">Instrutor</th>
                <th className="px-4 py-3 text-left font-semibold">Pagamento provedor</th>
                <th className="px-4 py-3 text-left font-semibold">Status no provedor</th>
                <th className="px-4 py-3 text-left font-semibold">Reserva</th>
                <th className="px-4 py-3 text-left font-semibold">Criado em</th>
                <th className="px-4 py-3 text-left font-semibold">Pago em</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr>
                  <td className="px-4 py-6 text-gray-500" colSpan={10}>
                    Nenhum pagamento encontrado.
                  </td>
                </tr>
              ) : (
                rows.map(row => (
                  <tr key={row.id} className="border-t border-gray-100 align-top">
                    <td className="px-4 py-3">
                      <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.statusUi.classes}`}>
                        {row.statusUi.label}
                      </span>
                      <div className="mt-2 text-xs text-gray-500">{row.provider || '-'}</div>
                    </td>
                    <td className="px-4 py-3 font-semibold text-gray-900">{formatCurrency(row.amount)}</td>
                    <td className="px-4 py-3 text-gray-700">{row.method}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{row.studentName}</div>
                      <div className="text-xs text-gray-500">{row.studentEmail}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-700">{row.instructorName}</td>
                    <td className="px-4 py-3">
                      <div className="font-mono text-xs text-gray-800">{shortId(row.providerPaymentId)}</div>
                      <div className="mt-1 font-mono text-[11px] text-gray-400">{row.providerPaymentId || '-'}</div>
                    </td>
                    <td className="px-4 py-3">
                      {row.provider === 'mercadopago' ? (
                        <>
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${row.providerStatusUi.classes}`}
                          >
                            {row.providerStatusUi.label}
                          </span>
                          <div className="mt-2 text-xs text-gray-500">detalhe: {row.providerStatusDetail}</div>
                          <div className="mt-1 text-xs text-gray-400">
                            ambiente: {row.providerLiveMode === null ? '-' : row.providerLiveMode ? 'producao' : 'teste'}
                          </div>
                          {row.providerStatusError ? (
                            <div className="mt-1 text-xs text-red-600">{row.providerStatusError}</div>
                          ) : null}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{shortId(row.bookingId)}</td>
                    <td className="px-4 py-3 text-gray-600">{row.createdAtLabel}</td>
                    <td className="px-4 py-3 text-gray-600">{row.paidAtLabel}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  )
}
