import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { formatCurrency } from '@/utils/format'
import SubscriptionAdminTable from './SubscriptionAdminTable'

type AdminInstructorRow = {
  id: string
  created_at?: string
  neighborhood?: string
  city?: string
  state?: string
  price_per_lesson?: number
  rating?: number
  total_lessons?: number
  is_verified?: boolean
}

type AdminProfileRow = {
  id: string
  full_name?: string
  email?: string
  role?: string
}
type AdminRoleLookup = {
  role?: string | null
}

type AdminSubscriptionRow = {
  id: string
  instructor_id: string
  status?: string
  amount?: number
  current_period_start?: string
  current_period_end?: string
  provider?: string
  expires_at?: string
  created_at?: string
}

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

export default async function AdminPage() {
  const role = await getAdminRole()
  if (role !== 'admin') redirect('/entrar')

  const service = getServiceClient()
  if (!service) {
    return (
      <div className="max-w-5xl mx-auto bg-white border border-red-200 rounded-xl p-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Admin</h1>
        <p className="text-sm text-red-700 mt-2">
          SUPABASE_SERVICE_ROLE_KEY nao configurado. Nao foi possivel carregar dados administrativos.
        </p>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = service as any

  const [{ data: instructors }, { data: profiles }, { data: bookings }, { data: subscriptions }] = await Promise.all([
    db.from('instructors').select('*').order('created_at', { ascending: false }),
    db.from('profiles').select('id,full_name,email,role'),
    db.from('bookings').select('*'),
    db.from('subscriptions').select('*'),
  ])

  const instructorRows: AdminInstructorRow[] = Array.isArray(instructors) ? instructors : []
  const profileRows: AdminProfileRow[] = Array.isArray(profiles) ? profiles : []
  const bookingRows = Array.isArray(bookings) ? bookings : []
  const subscriptionRows: AdminSubscriptionRow[] = Array.isArray(subscriptions) ? subscriptions : []

  const profileMap = new Map(profileRows.map(p => [p.id, p]))
  const instructorProfileMap = new Map(
    profileRows
      .filter(p => p.role === 'instructor')
      .map(p => [p.id, p]),
  )
  const subMap = new Map<string, AdminSubscriptionRow>()
  for (const row of subscriptionRows.sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))) {
    if (!subMap.has(row.instructor_id)) subMap.set(row.instructor_id, row)
  }

  const commissionRevenue = bookingRows.reduce((sum: number, row: Record<string, unknown>) => {
    const status = String(row.status || '')
    if (status === 'cancelled' || status === 'no_show') return sum
    const fee = Number(row.platform_fee || 0)
    return sum + (Number.isFinite(fee) ? fee : 0)
  }, 0)

  const subscriptionRevenue = subscriptionRows.reduce((sum, row) => sum + Number(row.amount || 0), 0)
  const totalRevenue = commissionRevenue + subscriptionRevenue
  const activeInstructors = instructorRows.filter(i => {
    const sub = subMap.get(i.id)
    if (!sub || sub.status !== 'active') return false
    const endRaw = sub.current_period_end || sub.expires_at
    return !!endRaw && String(endRaw).slice(0, 10) >= new Date().toISOString().slice(0, 10)
  }).length

  const revenueByInstructor = new Map<string, number>()
  for (const row of bookingRows as Record<string, unknown>[]) {
    const status = String(row.status || '')
    if (status === 'cancelled' || status === 'no_show') continue

    const instructorId = String(row.instructor_id || '')
    if (!instructorId) continue

    const amount = Number(row.total_amount || row.gross_amount || 0)
    const prev = revenueByInstructor.get(instructorId) || 0
    revenueByInstructor.set(instructorId, prev + (Number.isFinite(amount) ? amount : 0))
  }

  const transactionsByStudent = new Map<string, { count: number; total: number; latest: string | null }>()
  for (const row of bookingRows as Record<string, unknown>[]) {
    const status = String(row.status || '')
    if (status === 'cancelled' || status === 'no_show') continue

    const studentId = String(row.student_id || '')
    if (!studentId) continue

    const amount = Number(row.total_amount || row.gross_amount || 0)
    const createdAt = row.created_at ? String(row.created_at) : null
    const prev = transactionsByStudent.get(studentId) || { count: 0, total: 0, latest: null }
    const nextLatest =
      !prev.latest || (createdAt && createdAt > prev.latest) ? createdAt : prev.latest

    transactionsByStudent.set(studentId, {
      count: prev.count + 1,
      total: prev.total + (Number.isFinite(amount) ? amount : 0),
      latest: nextLatest,
    })
  }

  const studentTransactions = Array.from(transactionsByStudent.entries())
    .map(([studentId, stats]) => ({
      studentId,
      stats,
      profile: profileMap.get(studentId),
    }))
    .sort((a, b) => b.stats.total - a.stats.total)

  const adminSubscriptionRows = subscriptionRows
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))
    .map(row => {
      const profile = instructorProfileMap.get(row.instructor_id) || profileMap.get(row.instructor_id)
      return {
        id: row.id,
        instructor_id: row.instructor_id,
        instructor_name: profile?.full_name || 'Sem nome',
        instructor_email: profile?.email || '-',
        status: String(row.status || 'pending'),
        provider: String(row.provider || 'mock'),
        amount: Number(row.amount || 0),
        current_period_start: String(row.current_period_start || row.created_at || '').slice(0, 10),
        current_period_end: String(row.current_period_end || row.expires_at || '').slice(0, 10),
        created_at: String(row.created_at || ''),
      }
    })

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Painel Admin</h1>
        <p className="text-sm text-gray-500 mt-1">Visao geral de instrutores e faturamento da plataforma.</p>
      </div>

      <section className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card title="Instrutores" value={String(instructorRows.length)} />
        <Card title="Instrutores Ativos" value={String(activeInstructors)} />
        <Card title="Receita Comissao" value={formatCurrency(commissionRevenue)} />
        <Card title="Receita Assinaturas" value={formatCurrency(subscriptionRevenue)} />
        <Card title="Faturamento Total" value={formatCurrency(totalRevenue)} />
      </section>

      <SubscriptionAdminTable initialRows={adminSubscriptionRows} />

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Instrutores Cadastrados</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Instrutor</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Faturamento</th>
              </tr>
            </thead>
            <tbody>
              {instructorRows.map(inst => {
                const prof = instructorProfileMap.get(inst.id) || profileMap.get(inst.id)
                const revenue = revenueByInstructor.get(inst.id) || 0

                return (
                  <tr key={inst.id} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{prof?.full_name || 'Sem nome'}</td>
                    <td className="px-4 py-3 text-gray-600">{prof?.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">{formatCurrency(revenue)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h2 className="font-bold text-gray-900">Transacoes por Aluno</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Aluno</th>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Transacoes</th>
                <th className="text-left px-4 py-3 font-semibold">Total Pago</th>
                <th className="text-left px-4 py-3 font-semibold">Ultima</th>
              </tr>
            </thead>
            <tbody>
              {studentTransactions.length === 0 ? (
                <tr>
                  <td className="px-4 py-4 text-gray-500" colSpan={5}>
                    Nenhuma transacao encontrada.
                  </td>
                </tr>
              ) : (
                studentTransactions.map(row => (
                  <tr key={row.studentId} className="border-t border-gray-100">
                    <td className="px-4 py-3 font-medium text-gray-900">{row.profile?.full_name || 'Sem nome'}</td>
                    <td className="px-4 py-3 text-gray-600">{row.profile?.email || '-'}</td>
                    <td className="px-4 py-3 text-gray-700">{row.stats.count}</td>
                    <td className="px-4 py-3 text-gray-700 font-semibold">{formatCurrency(row.stats.total)}</td>
                    <td className="px-4 py-3 text-gray-600">
                      {row.stats.latest ? new Date(row.stats.latest).toLocaleDateString('pt-BR') : '-'}
                    </td>
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

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
      <p className="text-xs text-gray-500">{title}</p>
      <p className="text-xl font-extrabold text-gray-900 mt-1">{value}</p>
    </div>
  )
}
