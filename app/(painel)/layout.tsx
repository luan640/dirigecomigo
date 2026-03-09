import type { ReactNode } from 'react'
import Link from 'next/link'
import {
  LayoutDashboard, CalendarDays, Clock4, User, BarChart2,
  CreditCard, LogOut, Package, Wallet
} from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

const navItems = [
  { href: '/painel/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/painel/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/painel/horarios', label: 'Horários', icon: Clock4 },
  { href: '/painel/pacotes', label: 'Pacotes', icon: Package },
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

    if (!sub || sub.status !== 'active') return false
    const endDateRaw = sub.current_period_end || sub.expires_at
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
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 py-6 px-3 shrink-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">Instrutor</p>
          <nav className="space-y-0.5 flex-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              (() => {
                const isSubscriptionPage = href === '/painel/assinatura'
                const locked = !isUnlocked && !isSubscriptionPage
                return (
              <Link
                key={href}
                href={locked ? '/painel/assinatura' : href}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  locked
                    ? 'text-gray-400 bg-gray-50'
                    : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {label}
                {locked ? <span className="ml-auto text-[10px] font-bold uppercase">Bloqueado</span> : null}
              </Link>
                )
              })()
            ))}
          </nav>
          <Link
            href="/entrar"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </Link>
        </aside>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40 overflow-x-auto">
          {navItems.slice(0, 5).map(({ href, label, icon: Icon }) => (
            (() => {
              const locked = !isUnlocked && href !== '/painel/assinatura'
              return (
            <Link
              key={href}
              href={locked ? '/painel/assinatura' : href}
              className={`flex-1 flex flex-col items-center py-2 text-xs min-w-[3.5rem] ${
                locked ? 'text-gray-300' : 'text-gray-500 hover:text-blue-700'
              }`}
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate w-full text-center px-1">{label}</span>
            </Link>
              )
            })()
          ))}
        </nav>

        <main className="flex-1 py-6 px-4 sm:px-6 pb-20 md:pb-6">{children}</main>
      </div>
    </>
  )
}
