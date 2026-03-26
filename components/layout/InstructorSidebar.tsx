'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  BarChart2,
  CalendarDays,
  ChevronRight,
  Clock4,
  CreditCard,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  User,
  Wallet,
  BookOpen,
  ClipboardList,
  X,
} from 'lucide-react'
import BrandLogo from '@/components/layout/BrandLogo'
import LogoutButton from '@/components/layout/LogoutButton'

const navItems = [
  { href: '/painel/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/painel/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/painel/aulas-externas', label: 'Aulas externas', icon: ClipboardList },
  { href: '/painel/horarios', label: 'Horarios', icon: Clock4 },
  {
    href: '/painel/servicos',
    label: 'Meus Servicos',
    icon: BookOpen,
    children: [
      { href: '/painel/servicos/aulas-avulsas', label: 'Aulas avulsas' },
      { href: '/painel/servicos/pacotes', label: 'Pacotes' },
    ],
  },
  { href: '/painel/carteira', label: 'Carteira', icon: Wallet },
  { href: '/painel/analytics', label: 'Relatorios', icon: BarChart2 },
  { href: '/painel/perfil', label: 'Meu Perfil', icon: User },
  { href: '/painel/assinatura', label: 'Assinatura', icon: CreditCard },
]

type Props = {
  isUnlocked: boolean
  userName: string
  userEmail: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'I'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function InstructorSidebar({ isUnlocked, userName, userEmail }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [servicesOpen, setServicesOpen] = useState(pathname.startsWith('/painel/servicos'))

  const renderLinks = (mobile = false) => (
    <nav className="flex-1 space-y-1">
      {navItems.map(({ href, label, icon: Icon, children }) => {
        const isSubscriptionPage = href === '/painel/assinatura'
        const locked = !isUnlocked && !isSubscriptionPage
        const targetHref = locked ? '/painel/assinatura' : href
        const active = pathname === href || pathname.startsWith(`${href}/`)
        const hasChildren = Array.isArray(children) && children.length > 0

        return (
          <div key={href} className="space-y-1">
            {hasChildren && !locked ? (
              <button
                type="button"
                onClick={() => setServicesOpen(current => !current)}
                className={`group flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#0f2f63] text-white shadow-[0_12px_30px_rgba(15,47,99,0.25)]'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#f6d86c]' : ''}`} />
                <span className="truncate">{label}</span>
                <ChevronRight
                  className={`ml-auto h-4 w-4 transition-transform ${active ? 'text-[#f6d86c]' : 'text-slate-400'} ${servicesOpen ? 'rotate-90' : ''}`}
                />
              </button>
            ) : (
              <Link
                href={targetHref}
                onClick={() => {
                  if (mobile) setMobileOpen(false)
                }}
                className={`group flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
                  active
                    ? 'bg-[#0f2f63] text-white shadow-[0_12px_30px_rgba(15,47,99,0.25)]'
                    : locked
                      ? 'bg-slate-50 text-slate-400'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#f6d86c]' : ''}`} />
                <span className="truncate">{label}</span>
                {locked ? (
                  <span className="ml-auto inline-flex items-center gap-1 rounded-full bg-white px-2 py-0.5 text-[10px] uppercase tracking-wide text-slate-500">
                    <ShieldAlert className="h-3 w-3" />
                    Bloqueado
                  </span>
                ) : null}
              </Link>
            )}

            {hasChildren && !locked && servicesOpen ? (
              <div className="ml-6 space-y-1 border-l border-slate-200 pl-4">
                {children.map(child => {
                  const childActive = pathname === child.href
                  return (
                    <Link
                      key={child.href}
                      href={child.href}
                      onClick={() => {
                        if (mobile) setMobileOpen(false)
                      }}
                      className={`flex items-center rounded-xl px-3 py-2 text-sm font-medium transition-colors ${
                        childActive
                          ? 'bg-white text-[#0f2f63] shadow-sm'
                          : 'text-slate-500 hover:bg-white hover:text-slate-900'
                      }`}
                    >
                      {child.label}
                    </Link>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </nav>
  )

  const userPanel = (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-4 backdrop-blur">
      <div className="flex items-center gap-3">
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#0f2f63] text-sm font-bold text-white">
          {getInitials(userName)}
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-bold text-slate-900">{userName}</p>
          <p className="truncate text-xs text-slate-500">{userEmail}</p>
        </div>
      </div>
      <div className="mt-3 border-t border-slate-200 pt-3">
        <LogoutButton className="rounded-xl px-0 py-1 text-slate-500 hover:text-red-600" />
      </div>
    </div>
  )

  return (
    <>
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-[rgba(248,250,252,0.95)] px-4 py-3 backdrop-blur md:hidden">
        <Link href="/painel/dashboard" className="flex items-center">
          <BrandLogo className="h-9 w-auto" priority />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
          aria-label="Abrir menu do painel"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <aside className="sticky top-0 hidden h-screen w-[292px] shrink-0 border-r border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] md:flex md:flex-col">
        <div className="flex h-full min-h-0 flex-col px-5 py-6">
          <Link href="/painel/dashboard" className="flex items-center">
            <BrandLogo className="h-10 w-auto" priority />
          </Link>

          <div className="mt-8 rounded-2xl bg-[#0f2f63] p-4 text-white shadow-[0_20px_45px_rgba(15,47,99,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f6d86c]">Painel do Instrutor</p>
            <p className="mt-2 text-sm text-slate-200">Gerencie agenda, servicos, pacotes e resultados em um unico lugar.</p>
          </div>

          <div className="mt-6 min-h-0 flex-1 overflow-y-auto pr-1">
            {renderLinks()}
          </div>

          <div className="mt-4 shrink-0">{userPanel}</div>
        </div>
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-slate-950/45"
            onClick={() => setMobileOpen(false)}
            aria-label="Fechar menu do painel"
          />
          <div className="absolute left-0 top-0 flex h-full w-[88vw] max-w-[320px] flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between px-5 py-4">
              <Link href="/painel/dashboard" className="flex items-center" onClick={() => setMobileOpen(false)}>
                <BrandLogo className="h-9 w-auto" priority />
              </Link>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="px-5 pb-4">
              <div className="rounded-2xl bg-[#0f2f63] p-4 text-white">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f6d86c]">Painel do Instrutor</p>
                <p className="mt-2 text-sm text-slate-200">Navegacao otimizada para celular.</p>
              </div>
            </div>

            <div className="flex min-h-0 flex-1 flex-col px-5 pb-5">
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                {renderLinks(true)}
              </div>
              <div className="mt-4 shrink-0">{userPanel}</div>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}
