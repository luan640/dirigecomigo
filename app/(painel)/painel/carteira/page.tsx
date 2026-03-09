import { ArrowDownToLine, Clock3, Wallet } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
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
}

type ProfileRow = {
  id?: string
  full_name?: string
}

type WalletEntry = {
  id: string
  bookingId: string
  studentName: string
  lessonDate: string
  lessonTime: string
  amount: number
  paymentStatus: string
  bookingStatus: string
  provider: string
  receivedAt: string
  releaseStatus: 'available' | 'pending'
}

function toNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizeStatusLabel(status: WalletEntry['releaseStatus']) {
  if (status === 'available') {
    return { label: 'Disponivel', classes: 'bg-emerald-100 text-emerald-700' }
  }

  return { label: 'A liberar', classes: 'bg-amber-100 text-amber-700' }
}

export default async function CarteiraPage() {
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user

  if (!user) return null

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = supabase as any
  const [{ data: bookings }, { data: payments }] = await Promise.all([
    db
      .from('bookings')
      .select('id,student_id,scheduled_date,start_time,end_time,status,instructor_net')
      .eq('instructor_id', user.id),
    db
      .from('payments')
      .select('id,booking_id,amount,status,created_at,paid_at,provider')
      .order('paid_at', { ascending: false, nullsFirst: false })
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
  const entries: WalletEntry[] = paymentRows
    .map((payment: PaymentRow) => {
      const bookingId = String(payment.booking_id || '')
      const booking = bookingMap.get(bookingId)
      if (!booking) return null

      const paymentStatus = String(payment.status || '').toLowerCase()
      if (paymentStatus !== 'paid' && paymentStatus !== 'approved') return null

      const student = profileMap.get(String(booking.student_id || ''))
      const bookingStatus = String(booking.status || '').toLowerCase()
      const amount = toNumber(booking.instructor_net)
      const receivedAt = String(payment.paid_at || payment.created_at || '')
      const releaseStatus: WalletEntry['releaseStatus'] = bookingStatus === 'completed' ? 'available' : 'pending'

      return {
        id: String(payment.id || bookingId),
        bookingId,
        studentName: String(student?.full_name || 'Aluno'),
        lessonDate: String(booking.scheduled_date || ''),
        lessonTime: `${String(booking.start_time || '').slice(0, 5)} - ${String(booking.end_time || '').slice(0, 5)}`,
        amount,
        paymentStatus,
        bookingStatus,
        provider: String(payment.provider || '-'),
        receivedAt,
        releaseStatus,
      }
    })
    .filter((entry): entry is WalletEntry => Boolean(entry))
    .sort((a, b) => {
      const dateA = new Date(a.receivedAt || `${a.lessonDate}T${a.lessonTime.slice(0, 5)}`).getTime()
      const dateB = new Date(b.receivedAt || `${b.lessonDate}T${b.lessonTime.slice(0, 5)}`).getTime()
      return dateB - dateA
    })

  const availableBalance = entries
    .filter(entry => entry.releaseStatus === 'available')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const pendingBalance = entries
    .filter(entry => entry.releaseStatus === 'pending')
    .reduce((sum, entry) => sum + entry.amount, 0)
  const totalReceived = entries.reduce((sum, entry) => sum + entry.amount, 0)

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-gray-900">Carteira</h1>
          <p className="mt-1 text-sm text-gray-500">Acompanhe seu saldo e o histórico real dos pagamentos recebidos.</p>
        </div>
        <button
          type="button"
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-blue-200 bg-blue-50 px-4 py-2.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-100"
        >
          <ArrowDownToLine className="h-4 w-4" />
          Pedir saque
          <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-bold uppercase text-blue-600">Mock</span>
        </button>
      </div>

      <section className="grid gap-4 md:grid-cols-3">
        <SummaryCard title="Saldo em carteira" value={formatCurrency(availableBalance)} hint="Valor de aulas concluídas e pagas." icon={Wallet} />
        <SummaryCard title="A liberar" value={formatCurrency(pendingBalance)} hint="Pagamentos recebidos de aulas ainda nao concluidas." icon={Clock3} />
        <SummaryCard title="Total recebido" value={formatCurrency(totalReceived)} hint="Soma do líquido do instrutor nos pagamentos pagos." icon={ArrowDownToLine} />
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
                  const release = normalizeStatusLabel(entry.releaseStatus)
                  return (
                    <tr key={entry.id} className="border-t border-gray-100 align-top">
                      <td className="px-4 py-3 font-medium text-gray-900">{entry.studentName}</td>
                      <td className="px-4 py-3 text-gray-700">
                        <div>{entry.lessonDate ? format(new Date(`${entry.lessonDate}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR }) : '-'}</div>
                        <div className="mt-1 text-xs text-gray-400">{entry.lessonTime}</div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-emerald-700">{formatCurrency(entry.amount)}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${release.classes}`}>
                          {release.label}
                        </span>
                        <div className="mt-1 text-xs text-gray-400">{entry.provider}</div>
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
