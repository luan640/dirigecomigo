import { addMonths, format } from 'date-fns'
import { MercadoPagoConfig, PreApproval } from 'mercadopago'

type DbClient = {
  from: (table: string) => {
    select: (fields: string) => {
      eq: (column: string, value: unknown) => {
        maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
        order: (column: string, options: { ascending: boolean }) => {
          limit: (value: number) => {
            maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
          }
        }
      }
    }
    insert: (payload: Record<string, unknown>) => {
      select: (fields: string) => {
        single: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
      }
    }
    update: (payload: Record<string, unknown>) => {
      eq: (column: string, value: unknown) => {
        select: (fields: string) => {
          maybeSingle: () => Promise<{ data: Record<string, unknown> | null; error: { message: string } | null }>
        }
      }
    }
  }
}

function isUuid(value: string) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
}

export function mapPreapprovalStatus(status?: string): 'active' | 'pending' | 'cancelled' | 'expired' {
  switch (String(status || '').toLowerCase()) {
    case 'authorized':
      return 'active'
    case 'paused':
    case 'pending':
      return 'pending'
    case 'cancelled':
      return 'cancelled'
    case 'expired':
      return 'expired'
    default:
      return 'pending'
  }
}

export function getMercadoPagoSubscriptionClient() {
  const accessToken =
    String(process.env.MERCADOPAGO_ACCESS_TOKEN_ASSINATURA || '').trim() ||
    String(process.env.MERCADOPAGO_ACCESS_TOKEN || '').trim()
  if (!accessToken) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN_ASSINATURA nao configurado.')
  }

  return new PreApproval(new MercadoPagoConfig({ accessToken }))
}

export function getMercadoPagoPlanId() {
  return (
    String(process.env.MERCADOPAGO_PREAPPROVAL_PLAN_ID || '').trim() ||
    String(process.env.MERCADOPAGO_SUBSCRIPTION_PLAN_ID || '').trim() ||
    String(process.env.MP_PREAPPROVAL_PLAN_ID || '').trim()
  )
}

export async function findLatestMercadoPagoPreapproval(args: {
  payerEmail?: string
  externalReference?: string
}) {
  const client = getMercadoPagoSubscriptionClient()
  const payerEmail = String(args.payerEmail || '').trim()
  const externalReference = String(args.externalReference || '').trim()

  if (!payerEmail && !externalReference) return null

  const searchOptions: { payer_email?: string; q?: string } = {}
  if (payerEmail) searchOptions.payer_email = payerEmail
  if (externalReference) searchOptions.q = externalReference

  const search = await client.search({
    options: searchOptions,
  })

  const results = Array.isArray(search.results) ? search.results : []
  const filtered = results.filter((item) => {
    const itemRef = String(item.external_reference || '').trim()
    if (externalReference && itemRef !== externalReference) return false
    return true
  })

  const sorted = [...filtered].sort(
    (a, b) => Number(b.last_modified || b.date_created || 0) - Number(a.last_modified || a.date_created || 0),
  )
  const latestId = String(sorted[0]?.id || '').trim()
  if (!latestId) return null

  return client.get({ id: latestId })
}

export async function ensureInstructorRow(db: DbClient, instructorId: string) {
  const { data: current, error: fetchError } = await db
    .from('instructors')
    .select('id')
    .eq('id', instructorId)
    .maybeSingle()

  if (fetchError) return { ok: false as const, error: fetchError.message }
  if (current?.id) return { ok: true as const }

  const { error: insertError } = await db
    .from('instructors')
    .insert({
      id: instructorId,
      price_per_lesson: 50,
      neighborhood: 'Centro',
    })
    .select('id')
    .single()

  if (insertError) return { ok: false as const, error: insertError.message }
  return { ok: true as const }
}

async function resolveInstructorId(db: DbClient, preapproval: Record<string, unknown>, fallbackInstructorId?: string) {
  const externalReference = String(preapproval.external_reference || '')
  if (isUuid(externalReference)) return externalReference
  if (fallbackInstructorId) return fallbackInstructorId

  const payerEmail = String(preapproval.payer_email || '').trim()
  if (!payerEmail) return null

  const { data: profile } = await db
    .from('profiles')
    .select('id,role')
    .eq('email', payerEmail)
    .maybeSingle()

  if (!profile?.id) return null
  return String(profile.id)
}

export async function syncPreapprovalToSubscription(args: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any
  preapproval: Record<string, unknown>
  fallbackInstructorId?: string
  fallbackAmount?: number
}) {
  const { db, preapproval, fallbackInstructorId, fallbackAmount = 15 } = args
  const instructorId = await resolveInstructorId(db as DbClient, preapproval, fallbackInstructorId)
  if (!instructorId) return { data: null, error: 'Nao foi possivel identificar o instrutor da assinatura.' }

  const ensured = await ensureInstructorRow(db as DbClient, instructorId)
  if (!ensured.ok) return { data: null, error: ensured.error }

  const mpStatus = String(preapproval.status || '')
  const mappedStatus = mapPreapprovalStatus(mpStatus)
  const now = new Date()
  const periodStart = format(now, 'yyyy-MM-dd')

  const nextPaymentDateRaw = String(preapproval.next_payment_date || '').trim()
  const periodEnd = nextPaymentDateRaw
    ? nextPaymentDateRaw.slice(0, 10)
    : format(addMonths(now, 1), 'yyyy-MM-dd')

  const autoRecurring = preapproval.auto_recurring as Record<string, unknown> | undefined
  const amount = Number(autoRecurring?.transaction_amount || fallbackAmount || 15)
  const providerSubId = String(preapproval.id || '')

  const payload = {
    instructor_id: instructorId,
    status: mappedStatus,
    amount,
    current_period_start: periodStart,
    current_period_end: periodEnd,
    provider: 'mercadopago',
    provider_sub_id: providerSubId,
    cancelled_at: mappedStatus === 'cancelled' ? now.toISOString() : null,
    updated_at: now.toISOString(),
  }

  if (providerSubId) {
    const updateByProvider = await db
      .from('subscriptions')
      .update(payload)
      .eq('provider_sub_id', providerSubId)
      .select('*')
      .maybeSingle()

    if (!updateByProvider.error && updateByProvider.data) {
      return { data: updateByProvider.data, error: null }
    }
  }

  const { data: latest } = await db
    .from('subscriptions')
    .select('*')
    .eq('instructor_id', instructorId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (latest?.id) {
    const updateLatest = await db
      .from('subscriptions')
      .update(payload)
      .eq('id', latest.id)
      .select('*')
      .maybeSingle()

    if (!updateLatest.error && updateLatest.data) {
      return { data: updateLatest.data, error: null }
    }
  }

  const insertNew = await db.from('subscriptions').insert(payload).select('*').single()
  if (insertNew.error) return { data: null, error: insertNew.error.message }
  return { data: insertNew.data, error: null }
}
