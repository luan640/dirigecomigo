import { redirect } from 'next/navigation'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import AdminPayoutRequestsTable, { type AdminPayoutRequestRow } from './AdminPayoutRequestsTable'
import { formatCurrency } from '@/utils/format'

type AdminRoleLookup = {
  role?: string | null
}

type ProfileRow = {
  id: string
  full_name?: string
  email?: string
}

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) return null
  return createAdminClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
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

function asString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

function asNumber(value: unknown) {
  const parsed = Number(value || 0)
  return Number.isFinite(parsed) ? parsed : 0
}

function normalizePayoutStatus(status: string) {
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

function SummaryCard({ title, value, hint }: { title: string; value: string; hint: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">{title}</p>
      <p className="mt-2 text-2xl font-extrabold text-gray-900">{value}</p>
      <p className="mt-1 text-sm text-gray-500">{hint}</p>
    </div>
  )
}

export default async function AdminPayoutRequestsPage() {
  const role = await getAdminRole()
  if (role !== 'admin') redirect('/entrar')

  const service = getServiceClient()
  if (!service) {
    return (
      <div className="w-full rounded-xl border border-red-200 bg-white p-6">
        <h1 className="text-2xl font-extrabold text-gray-900">Saques</h1>
        <p className="mt-2 text-sm text-red-700">
          SUPABASE_SERVICE_ROLE_KEY nao configurado. Nao foi possivel carregar os saques administrativos.
        </p>
      </div>
    )
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = service as any
  const [{ data: payoutRequests }, { data: profiles }] = await Promise.all([
    db.from('payout_requests').select('*').order('requested_at', { ascending: false }),
    db.from('profiles').select('id,full_name,email'),
  ])

  const profileMap = new Map(
    (Array.isArray(profiles) ? profiles : []).map((profile: ProfileRow) => [profile.id, profile]),
  )

  const rows: AdminPayoutRequestRow[] = (Array.isArray(payoutRequests) ? payoutRequests : []).map((request: Record<string, unknown>) => {
    const instructor = profileMap.get(asString(request.instructor_id))
    return {
      id: asString(request.id),
      instructorName: instructor?.full_name || 'Instrutor',
      instructorEmail: instructor?.email || '-',
      amount: asNumber(request.amount),
      status: asString(request.status).toLowerCase(),
      statusUi: normalizePayoutStatus(asString(request.status).toLowerCase()),
      notes: asString(request.notes),
      adminNotes: asString(request.admin_notes),
      requestedAtLabel: request.requested_at ? new Date(asString(request.requested_at)).toLocaleString('pt-BR') : '-',
      processedAtLabel: request.processed_at ? new Date(asString(request.processed_at)).toLocaleString('pt-BR') : '-',
    }
  })

  const totalRequested = rows.reduce((sum, row) => sum + row.amount, 0)
  const pendingCount = rows.filter(row => row.status === 'pending').length
  const processingCount = rows.filter(row => row.status === 'processing').length
  const paidTotal = rows.filter(row => row.status === 'paid').reduce((sum, row) => sum + row.amount, 0)

  return (
    <div className="w-full max-w-none space-y-6">
      <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">Saques</h1>
          <p className="mt-1 text-sm text-gray-500">
            Fila administrativa de pedidos de saque enviados pelos instrutores. O processamento do pagamento e manual.
          </p>
        </div>
        <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          Atualize o status conforme o repasse real for sendo feito fora da plataforma.
        </div>
      </div>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <SummaryCard title="Solicitacoes" value={String(rows.length)} hint="Total de pedidos registrados." />
        <SummaryCard title="Pendentes" value={String(pendingCount)} hint="Aguardando inicio do processamento." />
        <SummaryCard title="Em processamento" value={String(processingCount)} hint="Admin ja assumiu o envio manual." />
        <SummaryCard title="Pago" value={formatCurrency(paidTotal)} hint={`Solicitado no total: ${formatCurrency(totalRequested)}`} />
      </section>

      <AdminPayoutRequestsTable initialRows={rows} />
    </div>
  )
}
