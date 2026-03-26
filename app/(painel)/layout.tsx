import type { ReactNode } from 'react'
import InstructorSidebar from '@/components/layout/InstructorSidebar'
import { findLatestMercadoPagoPreapproval, syncPreapprovalToSubscription } from '@/lib/payments/mercadoPagoSubscription'

async function hasActiveSubscription() {
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (DEMO_MODE) return true

  try {
    const { createClient } = await import('@/lib/supabase/server')
    const supabase = await createClient()
    const { data: authData } = await supabase.auth.getUser()
    const user = authData.user
    if (!user) return false

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: sub } = await (supabase as any)
      .from('subscriptions')
      .select('*')
      .eq('instructor_id', user.id)
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle()

    if (sub?.status === 'active') {
      const endDateRaw = sub.current_period_end || sub.expires_at
      if (!endDateRaw) return false

      const today = new Date().toISOString().split('T')[0]
      return String(endDateRaw).slice(0, 10) >= today
    }

    if (!user.email) return false

    const remoteSubscription = await findLatestMercadoPagoPreapproval({
      payerEmail: user.email,
      externalReference: user.id,
    })
    if (!remoteSubscription) return false

    const synced = await syncPreapprovalToSubscription({
      db: supabase,
      preapproval: remoteSubscription as unknown as Record<string, unknown>,
      fallbackInstructorId: user.id,
      fallbackAmount: Number(sub?.amount || 15),
    })
    const nextSub = synced.error ? sub : synced.data
    if (!nextSub || nextSub.status !== 'active') return false

    const endDateRaw = nextSub.current_period_end || nextSub.expires_at
    if (!endDateRaw) return false
    const today = new Date().toISOString().split('T')[0]
    return String(endDateRaw).slice(0, 10) >= today
  } catch {
    return false
  }
}

export default async function PainelLayout({ children }: { children: ReactNode }) {
  const isUnlocked = await hasActiveSubscription()
  const { createClient } = await import('@/lib/supabase/server')
  const supabase = await createClient()
  const { data: authData } = await supabase.auth.getUser()
  const user = authData.user
  const fallbackName = user?.email?.split('@')[0] || 'Instrutor'
  const fallbackEmail = user?.email || ''

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('full_name,email')
    .eq('id', user?.id || '')
    .maybeSingle()

  const userName = String(profile?.full_name || fallbackName)
  const userEmail = String(profile?.email || fallbackEmail)

  return (
    <div className="flex min-h-screen bg-[#f3f6fb]">
      <InstructorSidebar isUnlocked={isUnlocked} userName={userName} userEmail={userEmail} />
      <main className="min-w-0 flex-1 px-4 py-5 sm:px-6 md:px-8 md:py-8">{children}</main>
    </div>
  )
}
