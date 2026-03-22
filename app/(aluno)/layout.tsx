import type { ReactNode } from 'react'
import Link from 'next/link'
import { LayoutDashboard, BookOpen, User } from 'lucide-react'
import Navbar from '@/components/layout/Navbar'
import LogoutButton from '@/components/layout/LogoutButton'

const navItems = [
  { href: '/aluno/dashboard', label: 'Início', icon: LayoutDashboard },
  { href: '/aluno/aulas', label: 'Minhas aulas', icon: BookOpen },
  { href: '/aluno/perfil', label: 'Perfil', icon: User },
]

export default function StudentLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Navbar />
      <div className="flex min-h-[calc(100vh-64px)] bg-gray-50">
        {/* Sidebar */}
        <aside className="hidden md:flex flex-col w-56 bg-white border-r border-gray-100 py-6 px-3 shrink-0">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest px-3 mb-3">Aluno</p>
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
          <LogoutButton />
        </aside>

        {/* Mobile bottom nav */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex z-40">
          {navItems.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center py-2.5 text-xs text-gray-500 hover:text-blue-700"
            >
              <Icon className="w-5 h-5 mb-0.5" />
              {label}
            </Link>
          ))}
        </nav>

        <main className="flex-1 py-6 px-4 sm:px-6 pb-20 md:pb-6">{children}</main>
      </div>
    </>
  )
}
