import type { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, TicketPercent, ReceiptText, LogOut } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/transacoes', label: 'Pagamentos', icon: ReceiptText },
  { href: '/admin/cupons', label: 'Cupons', icon: TicketPercent },
]

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 py-6 px-3 shrink-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">Admin</p>
          <nav className="space-y-0.5 flex-1">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:bg-blue-50 hover:text-blue-700 transition-colors"
              >
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            ))}
          </nav>
          <Link
            href="/entrar"
            className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-400 hover:text-red-600 transition-colors"
          >
            <LogOut className="w-4 h-4" /> Sair
          </Link>
        </aside>

        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-2 text-xs text-gray-500 hover:text-blue-700 min-w-[3.5rem]"
            >
              <Icon className="w-5 h-5 mb-0.5" />
              <span className="truncate w-full text-center px-1">{label}</span>
            </Link>
          ))}
        </nav>

        <main className="flex-1 py-6 px-4 sm:px-6 pb-20 md:pb-6">{children}</main>
      </div>
    </>
  )
}
