import { ArrowDownToLine, Clock3, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import PayoutRequestButton from './PayoutRequestButton'
import { computePayoutBalances, getWalletReleaseStatus } from '@/lib/payments/payouts'
import { formatCurrency } from '@/utils/format'

type BookingRow = {
  id?: string
  student_id?: string
  scheduled_date?: string
  start_time?: string
  end_time?: string
  status?: string
  instructor_net?: number | string
}

type PaymentRow = {
  id?: string
  booking_id?: string
  amount?: number | string
  status?: string
  created_at?: string
  paid_at?: string
  provider?: string
  metadata?: Record<string, unknown> | null
}

type PayoutRequestRow = {
  id?: string
  amount?: number | string
  status?: string
  notes?: string | null
  admin_notes?: string | null
  requested_at?: string
  processed_at?: string | null
}

type ProfileRow = {
  id?: string
  full_name?: string
}

type RefundRow = {
  id?: string
  payment_id?: string
  amount?: number | string
  reason?: string | null
  created_at?: string
}

type WalletEntry = {
  id: string
  bookingId: string
  studentName: string
  lessonDate: string
  lessonEndTime: string
  lessonTime: string
  amount: number
  paymentStatus: string
  bookingStatus: string
  provider: string
  receivedAt: string
  releaseAt: string
  releaseStatus: 'available' | 'pending'
  lessonsCount: number
  refundedAmount: number
  refundReason: string
  isRefunded: boolean
}

function toNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeWalletStatusLabel(status: WalletEntry['releaseStatus']) {
  if (status === 'available') {
    return { label: 'Disponivel', classes: 'bg-emerald-100 text-emerald-700' }
  }

  return { label: 'A liberar', classes: 'bg-amber-100 text-amber-700' }
}

function normalizePayoutStatusLabel(status: string) {
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

export default async function CarteiraPage() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: bookings }, { data: payments }, { data: payoutRequests }, { data: refunds }] = await Promise.all([
    db
      .from('bookings')
      .select('id,student_id,scheduled_date,start_time,end_time,status,instructor_net')
      .eq('instructor_id', user.id),
    db
      .from('payments')
      .select('id,booking_id,amount,status,created_at,paid_at,provider,metadata')
      .order('paid_at', { ascending: false, nullsFirst: false })
      .order('created_at', { ascending: false }),
    db
      .from('payout_requests')
      .select('id,amount,status,notes,admin_notes,requested_at,processed_at')
      .eq('instructor_id', user.id)
      .order('requested_at', { ascending: false }),
    db
      .from('payment_refunds')
      .select('id,payment_id,amount,reason,created_at')
      .order('created_at', { ascending: false }),
  ])

  const bookingRows: BookingRow[] = Array.isArray(bookings) ? bookings : []
  const bookingMap = new Map(bookingRows.map((booking: BookingRow) => [String(booking.id || ''), booking]))
  const studentIds = Array.from(
    new Set(
      bookingRows
        .map((booking: BookingRow) => String(booking.student_id || '').trim())
        .filter(Boolean),
    ),
  )

  let profileMap = new Map<string, ProfileRow>()
  if (studentIds.length > 0) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id,full_name')
      .in('id', studentIds)

    profileMap = new Map(
      (Array.isArray(profiles) ? profiles : []).map((profile: ProfileRow) => [String(profile.id || ''), profile]),
    )
  }

  const paymentRows: PaymentRow[] = Array.isArray(payments) ? payments : []
  const refundRows: RefundRow[] = Array.isArray(refunds) ? refunds : []

  // Map payment_id -> total refunded + latest reason
  const refundByPayment = new Map<string, { total: number; reason: string }>()
  for (const r of refundRows) {
    const pid = String(r.payment_id || '')
    if (!pid) continue
    const prev = refundByPayment.get(pid)
    refundByPayment.set(pid, {
      total: (prev?.total ?? 0) + toNumber(r.amount),
      reason: String(r.reason || prev?.reason || ''),
    })
  }

  const entries: WalletEntry[] = paymentRows
    .map((payment: PaymentRow) => {
      const bookingId = String(payment.booking_id || '')
      const booking = bookingMap.get(bookingId)
      if (!booking) return null

      const paymentStatus = String(payment.status || '').toLowerCase()
      const isRefunded = paymentStatus === 'refunded' || paymentStatus === 'charged_back'
      if (paymentStatus !== 'paid' && paymentStatus !== 'approved' && !isRefunded) return null

      const student = profileMap.get(String(booking.student_id || ''))
      const meta = payment.metadata && typeof payment.metadata === 'object' ? payment.metadata : {}
      const lessonsCount = Math.max(1, Number(meta.lessonsCount || 1))
      // instructor_net is stored per-slot; multiply by lesson count to get total for the transaction
      const totalInstructorNet = Math.round(toNumber(booking.instructor_net) * lessonsCount * 100) / 100

      const release = getWalletReleaseStatus({
        amount: totalInstructorNet,
        lessonDate: String(booking.scheduled_date || ''),
        endTime: String(booking.end_time || ''),
        bookingStatus: String(booking.status || ''),
        paymentStatus,
      })
      const paymentId = String(payment.id || '')
      const refundInfo = refundByPayment.get(paymentId)

      return {
        id: paymentId || bookingId,
        bookingId,
        studentName: String(student?.full_name || 'Aluno'),
        lessonDate: String(booking.scheduled_date || ''),
        lessonEndTime: String(booking.end_time || ''),
        lessonTime: `${String(booking.start_time || '').slice(0, 5)} - ${String(booking.end_time || '').slice(0, 5)}`,
        amount: totalInstructorNet,
        lessonsCount,
        paymentStatus,
        bookingStatus: String(booking.status || '').toLowerCase(),
        provider: String(payment.provider || '-'),
        receivedAt: String(payment.paid_at || payment.created_at || ''),
        releaseAt: release.releaseAt,
        releaseStatus: release.releaseStatus,
        refundedAmount: refundInfo?.total ?? 0,
        refundReason: refundInfo?.reason ?? '',
        isRefunded,
      }
    })
    .filter((entry): entry is WalletEntry => Boolean(entry))
    .sort((a, b) => {
      const dateA = new Date(a.receivedAt || `${a.lessonDate}T${a.lessonTime.slice(0, 5)}`).getTime()
      const dateB = new Date(b.receivedAt || `${b.lessonDate}T${b.lessonTime.slice(0, 5)}`).getTime()
      return dateB - dateA
    })

  const payoutRequestRows: PayoutRequestRow[] = Array.isArray(payoutRequests) ? payoutRequests : []
  const balances = computePayoutBalances(
    entries.filter(e => !e.isRefunded).map(entry => ({
      amount: entry.amount,
      lessonDate: entry.lessonDate,
      endTime: entry.lessonEndTime,
      bookingStatus: entry.bookingStatus,
      paymentStatus: entry.paymentStatus,
    })),
    payoutRequestRows.map(request => ({
      amount: toNumber(request.amount),
      status: String(request.status || ''),
    })),
  )

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Carteira</h1>
          <p className="mt-1 text-sm text-gray-500">Acompanhe seu saldo, sua fila de saques e o historico real dos pagamentos recebidos.</p>
        </div>
        <PayoutRequestButton availableToWithdraw={balances.availableToWithdraw} />
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Saldo disponivel para saque" value={formatCurrency(balances.availableToWithdraw)} hint="Ja desconta saques pendentes, em processamento e pagos." icon={Wallet} />
        <SummaryCard title="Reservado em saques" value={formatCurrency(balances.reservedBalance)} hint="Pedidos enviados ao admin e ainda nao finalizados." icon={ArrowDownToLine} />
        <SummaryCard title="A liberar" value={formatCurrency(balances.pendingReleaseBalance)} hint="Pagamentos aguardando conclusao da aula ou carencia de 5 dias uteis." icon={Clock3} />
        <SummaryCard title="Total recebido" value={formatCurrency(balances.totalReceived)} hint="Soma do liquido do instrutor nos pagamentos pagos." icon={ArrowDownToLine} />
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">Solicitacoes de saque</h2>
          <p className="mt-1 text-sm text-gray-500">O admin processa esses pedidos manualmente e atualiza o status por la.</p>
        </div>

        {payoutRequestRows.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Nenhuma solicitacao de saque enviada ainda.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Solicitado em</th>
                  <th className="px-4 py-3 text-left font-semibold">Valor</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Observacoes</th>
                  <th className="px-4 py-3 text-left font-semibold">Atualizado</th>
                </tr>
              </thead>
              <tbody>
                {payoutRequestRows.map(request => {
                  const statusUi = normalizePayoutStatusLabel(String(request.status || 'pending').toLowerCase())
                  return (
                    <tr key={String(request.id || '')} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-3 text-gray-700">
                        {request.requested_at ? format(new Date(String(request.requested_at)), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-900">{formatCurrency(toNumber(request.amount))}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${statusUi.classes}`}>
                          {statusUi.label}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        <div>{String(request.notes || '-')}</div>
                        {request.admin_notes ? <div className="mt-1 text-xs text-gray-400">Admin: {String(request.admin_notes)}</div> : null}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {request.processed_at ? format(new Date(String(request.processed_at)), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 px-5 py-4">
          <h2 className="font-bold text-gray-900">Extrato</h2>
          <p className="mt-1 text-sm text-gray-500">Historico real baseado nos pagamentos vinculados as suas aulas.</p>
        </div>

        {entries.length === 0 ? (
          <div className="px-5 py-10 text-center text-sm text-gray-400">Nenhum registro encontrado na carteira.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead className="bg-gray-50 text-gray-600">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Aluno</th>
                  <th className="px-4 py-3 text-left font-semibold">Aula</th>
                  <th className="px-4 py-3 text-left font-semibold">Valor liquido</th>
                  <th className="px-4 py-3 text-left font-semibold">Status</th>
                  <th className="px-4 py-3 text-left font-semibold">Pago em</th>
                  <th className="px-4 py-3 text-left font-semibold">Reserva</th>
                </tr>
              </thead>
              <tbody>
                {entries.map(entry => {
                  const release = normalizeWalletStatusLabel(entry.releaseStatus)
                  return (
                    <tr key={entry.id} className={`border-t border-gray-100 align-top ${entry.isRefunded ? 'bg-red-50/40' : ''}`}>
                      <td className="px-4 py-3 font-medium text-gray-900">{entry.studentName}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{entry.lessonDate ? format(new Date(`${entry.lessonDate}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</div>
                        <div className="mt-1 text-xs text-gray-400">{entry.lessonTime}</div>
                      </td>
                      <td className="px-4 py-3">
                        {entry.isRefunded ? (
                          <>
                            <span className="font-semibold text-red-500 line-through">{formatCurrency(entry.amount)}</span>
                            {entry.refundedAmount > 0 && (
                              <div className="mt-1 text-xs text-red-500">
                                Reembolso: {formatCurrency(entry.refundedAmount)}
                              </div>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="font-semibold text-emerald-700">{formatCurrency(entry.amount)}</span>
                            {entry.lessonsCount > 1 && (
                              <div className="mt-1 text-xs text-gray-400">{entry.lessonsCount} aulas</div>
                            )}
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {entry.isRefunded ? (
                          <>
                            <span className="inline-flex rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-700">
                              Reembolsado
                            </span>
                            {entry.refundReason && (
                              <div className="mt-1 text-xs text-gray-400">Motivo: {entry.refundReason}</div>
                            )}
                          </>
                        ) : (
                          <>
                            <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${release.classes}`}>
                              {release.label}
                            </span>
                            <div className="mt-1 text-xs text-gray-400">{entry.provider}</div>
                            <div className="mt-1 text-xs text-gray-400">
                              {entry.releaseAt ? `Liberacao: ${format(new Date(entry.releaseAt), 'dd/MM/yyyy', { locale: ptBR })}` : 'Liberacao pendente'}
                            </div>
                          </>
                        )}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {entry.receivedAt ? format(new Date(entry.receivedAt), 'dd/MM/yyyy HH:mm', { locale: ptBR }) : '-'}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-gray-500">{entry.bookingId}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  )
}

function SummaryCard({
  title,
  value,
  hint,
  icon: Icon,
}: {
  title: string
  value: string
  hint: string
  icon: typeof Wallet
}) {
  return (
    <article className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-gray-500">{title}</p>
          <p className="mt-3 text-2xl font-extrabold text-gray-900">{value}</p>
        </div>
        <div className="rounded-xl bg-emerald-50 p-2 text-emerald-700">
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-3 text-xs text-gray-400">{hint}</p>
    </article>
  )
}
