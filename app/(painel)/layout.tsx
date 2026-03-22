import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  BarChart2,
  CalendarDays,
  Clock4,
  CreditCard,
  LayoutDashboard,
  User,
  Wallet,
} from 'lucide-react'

import Navbar from '@/components/layout/Navbar'
import LogoutButton from '@/components/layout/LogoutButton'
import { findLatestMercadoPagoPreapproval, syncPreapprovalToSubscription } from '@/lib/payments/mercadoPagoSubscription'

const navItems = [
  { href: '/painel/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/painel/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/painel/horarios', label: 'Horários', icon: Clock4 },
  { href: '/painel/carteira', label: 'Carteira', icon: Wallet },
  { href: '/painel/analytics', label: 'Relatórios', icon: BarChart2 },
  { href: '/painel/perfil', label: 'Meu perfil', icon: User },
  { href: '/painel/assinatura', label: 'Assinatura', icon: CreditCard },
]

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

  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
        <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-100 bg-white px-3 py-6 md:flex">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-widest text-gray-400">Instrutor</p>
          <nav className="flex-1 space-y-0.5">
            {navItems.map(({ href, label, icon: Icon }) => {
              const isSubscriptionPage = href === '/painel/assinatura'
              const locked = !isUnlocked && !isSubscriptionPage

              return (
                <Link
                  key={href}
                  href={locked ? '/painel/assinatura' : href}
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    locked
                      ? 'bg-gray-50 text-gray-400'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                  {locked ? <span className="ml-auto text-[10px] font-bold uppercase">Bloqueado</span> : null}
                </Link>
              )
            })}
          </nav>
          <LogoutButton />
        </aside>

        <nav className="fixed bottom-0 left-0 right-0 z-40 flex overflow-x-auto border-t border-gray-100 bg-white md:hidden">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => {
            const locked = !isUnlocked && href !== '/painel/assinatura'

            return (
              <Link
                key={href}
                href={locked ? '/painel/assinatura' : href}
                className={`flex min-w-[3.5rem] flex-1 flex-col items-center py-2 text-xs ${
                  locked ? 'text-gray-300' : 'text-gray-500 hover:text-blue-700'
                }`}
              >
                <Icon className="mb-0.5 h-5 w-5" />
                <span className="w-full truncate px-1 text-center">{label}</span>
              </Link>
            )
          })}
        </nav>

        <main className="flex-1 px-4 py-6 pb-20 sm:px-6 md:pb-6">{children}</main>
      </div>
    </>
  )
}
