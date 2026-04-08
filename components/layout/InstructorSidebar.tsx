'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2,
  CalendarDays,
  ChevronDown,
  Clock4,
  CreditCard,
  LayoutDashboard,
  Menu,
  PanelLeft,
  User,
  Wallet,
  BookOpen,
  ClipboardList,
  X,
} from 'lucide-react'
import BrandLogo from '@/components/layout/BrandLogo'
import LogoutButton from '@/components/layout/LogoutButton'

const navItems = [
  { href: '/painel/dashboard',      label: 'Início',          icon: LayoutDashboard },
  { href: '/painel/agenda',         label: 'Agenda',          icon: CalendarDays },
  { href: '/painel/aulas-externas', label: 'Aulas externas',  icon: ClipboardList },
  { href: '/painel/horarios',       label: 'Horários',        icon: Clock4 },
  {
    href: '/painel/servicos',
    label: 'Meus Serviços',
    icon: BookOpen,
    children: [
      { href: '/painel/servicos/aulas-avulsas', label: 'Aulas avulsas' },
      { href: '/painel/servicos/pacotes',       label: 'Pacotes' },
    ],
  },
  { href: '/painel/carteira',    label: 'Carteira',   icon: Wallet },
  { href: '/painel/analytics',   label: 'Relatórios', icon: BarChart2 },
  { href: '/painel/perfil',      label: 'Meu Perfil', icon: User },
  { href: '/painel/assinatura',  label: 'Assinatura', icon: CreditCard },
]

type Props = { isUnlocked: boolean; userName: string; userEmail: string }

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'I'
  if (parts.length === 1) return parts[0][0].toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

function NavContent({ isUnlocked, pathname, mobile, onClose, servicesOpen, setServicesOpen }: {
  isUnlocked: boolean
  pathname: string
  mobile: boolean
  onClose: () => void
  servicesOpen: boolean
  setServicesOpen: (v: boolean) => void
}) {
  return (
    <nav className="flex-1 overflow-y-auto px-3">
      <div className="space-y-0.5">
        {navItems.map(({ href, label, icon: Icon, children }) => {
          const isSubscriptionPage = href === '/painel/assinatura'
          const locked = !isUnlocked && !isSubscriptionPage
          const active = pathname === href || (href !== '/painel/servicos' && pathname.startsWith(`${href}/`))
          const hasChildren = Array.isArray(children) && children.length > 0
          const parentActive = hasChildren && pathname.startsWith(href)

          if (hasChildren && !locked) {
            return (
              <div key={href}>
                <button
                  type="button"
                  onClick={() => setServicesOpen(!servicesOpen)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    parentActive
                      ? 'bg-gray-100 text-gray-900'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                  }`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="flex-1 text-left">{label}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-gray-400 transition-transform ${servicesOpen ? 'rotate-180' : ''}`} />
                </button>
                {servicesOpen && (
                  <div className="ml-4 mt-0.5 border-l border-gray-200 pl-3 space-y-0.5">
                    {children.map(child => {
                      const childActive = pathname === child.href
                      return (
                        <Link
                          key={child.href}
                          href={child.href}
                          onClick={() => { if (mobile) onClose() }}
                          className={`block rounded-lg px-3 py-2 text-sm transition-colors ${
                            childActive
                              ? 'bg-gray-100 font-medium text-gray-900'
                              : 'text-gray-500 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {child.label}
                        </Link>
                      )
                    })}
                  </div>
                )}
              </div>
            )
          }

          return (
            <Link
              key={href}
              href={locked ? '/painel/assinatura' : href}
              onClick={() => { if (mobile) onClose() }}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                active
                  ? 'bg-gray-100 text-gray-900'
                  : locked
                    ? 'text-gray-300 cursor-not-allowed pointer-events-none'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default function InstructorSidebar({ isUnlocked, userName, userEmail }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(pathname.startsWith('/painel/servicos'))

  const sharedNavProps = { isUnlocked, pathname, servicesOpen, setServicesOpen }

  const userFooter = (
    <div className="border-t border-gray-100 px-4 py-4">
      <div className="flex items-center gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#1B5E20] text-xs font-bold text-white">
          {getInitials(userName)}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-gray-900">{userName}</p>
          <p className="truncate text-xs text-gray-400">{userEmail}</p>
        </div>
        <LogoutButton
          className="shrink-0 !w-auto !px-0 !py-0 text-gray-400 hover:text-red-500"
          label=""
        />
      </div>
    </div>
  )

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-100 bg-white px-4 py-3 md:hidden">
        <Link href="/painel/dashboard">
          <BrandLogo className="h-8 w-auto" priority />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 text-gray-500 hover:bg-gray-50"
          aria-label="Abrir menu"
        >
          <Menu className="h-4 w-4" />
        </button>
      </header>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-gray-100 bg-white md:flex">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5">
          <Link href="/painel/dashboard">
            <BrandLogo className="h-8 w-auto" priority />
          </Link>
          <button
            type="button"
            className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
            aria-label="Recolher sidebar"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        {/* Nav */}
        <div className="flex-1 overflow-hidden py-2">
          <NavContent {...sharedNavProps} mobile={false} onClose={() => {}} />
        </div>

        {/* User footer */}
        {userFooter}
      </aside>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/30"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu"
          />
          <div className="absolute left-0 top-0 flex h-full w-72 flex-col bg-white shadow-xl">
            <div className="flex items-center justify-between px-5 py-5">
              <Link href="/painel/dashboard" onClick={() => setMobileOpen(false)}>
                <BrandLogo className="h-8 w-auto" priority />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-400 hover:bg-gray-100"
                aria-label="Fechar menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="flex-1 overflow-hidden py-2">
              <NavContent {...sharedNavProps} mobile={true} onClose={() => setMobileOpen(false)} />
            </div>

            {userFooter}
          </div>
        </div>
      )}
    </>
  )
}
