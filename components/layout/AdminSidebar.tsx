'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ArrowDownToLine, LayoutDashboard, Menu, ReceiptText, TicketPercent, Users, X } from 'lucide-react'
import BrandLogo from '@/components/layout/BrandLogo'
import LogoutButton from '@/components/layout/LogoutButton'

const navItems = [
  { href: '/admin', label: 'Inicio', icon: LayoutDashboard },
  { href: '/admin/instrutores', label: 'Instrutores', icon: Users },
  { href: '/admin/transacoes', label: 'Pagamentos', icon: ReceiptText },
  { href: '/admin/saques', label: 'Saques', icon: ArrowDownToLine },
  { href: '/admin/cupons', label: 'Cupons', icon: TicketPercent },
]

type Props = {
  userName: string
  userEmail: string
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'A'
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase()
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase()
}

export default function AdminSidebar({ userName, userEmail }: Props) {
  const pathname = usePathname()
  const [mobileOpen, setMobileOpen] = useState(false)

  const renderLinks = (mobile = false) => (
    <nav className="flex-1 space-y-1">
      {navItems.map(({ href, label, icon: Icon }) => {
        const active = pathname === href

        return (
          <Link
            key={href}
            href={href}
            onClick={() => {
              if (mobile) setMobileOpen(false)
            }}
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition-all ${
              active
                ? 'bg-[#0f2f63] text-white shadow-[0_12px_30px_rgba(15,47,99,0.25)]'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            <Icon className={`h-4 w-4 shrink-0 ${active ? 'text-[#f6d86c]' : ''}`} />
            <span className="truncate">{label}</span>
          </Link>
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
        <Link href="/admin" className="flex items-center">
          <BrandLogo className="h-9 w-auto" priority />
        </Link>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700"
          aria-label="Abrir menu do admin"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <aside className="sticky top-0 hidden h-screen w-[292px] shrink-0 border-r border-slate-200 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] md:flex md:flex-col">
        <div className="flex h-full min-h-0 flex-col px-5 py-6">
          <Link href="/admin" className="flex items-center">
            <BrandLogo className="h-10 w-auto" priority />
          </Link>

          <div className="mt-8 rounded-2xl bg-[#0f2f63] p-4 text-white shadow-[0_20px_45px_rgba(15,47,99,0.22)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f6d86c]">Painel Admin</p>
            <p className="mt-2 text-sm text-slate-200">Gerencie instrutores, transacoes e cupons a partir de uma navegacao unica.</p>
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
            aria-label="Fechar menu do admin"
          />
          <div className="absolute left-0 top-0 flex h-full w-[88vw] max-w-[320px] flex-col bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_100%)] shadow-[0_24px_60px_rgba(15,23,42,0.28)]">
            <div className="flex items-center justify-between px-5 py-4">
              <Link href="/admin" className="flex items-center" onClick={() => setMobileOpen(false)}>
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
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#f6d86c]">Painel Admin</p>
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
