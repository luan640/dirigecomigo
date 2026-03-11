'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, User, LogIn, LayoutDashboard, ChevronDown } from 'lucide-react'
import { createBrowserClient } from '@supabase/ssr'
import { useRouter } from 'next/navigation'
import BrandLogo from '@/components/layout/BrandLogo'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

interface NavUser {
  name: string
  role: 'student' | 'instructor'
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [user, setUser] = useState<NavUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (DEMO_MODE) return

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    const loadUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser()

      if (!authUser) {
        setUser(null)
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, role')
        .eq('id', authUser.id)
        .single()

      if (profile) {
        setUser({ name: profile.full_name, role: profile.role as 'student' | 'instructor' })
      }
    }

    loadUser()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(() => {
      loadUser()
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleSignOut = async () => {
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const dashboardHref = user?.role === 'instructor' ? '/painel/dashboard' : '/aluno/dashboard'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-[#d9e5f1] bg-white/92 shadow-[0_10px_30px_rgba(3,31,74,0.06)] backdrop-blur-md">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <BrandLogo className="h-10 w-auto" priority />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/instrutores"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-[var(--brand-orange)]"
            >
              Buscar instrutor
            </Link>
            <Link
              href="/#como-funciona"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-[var(--brand-orange)]"
            >
              Como funciona
            </Link>
            <Link
              href="/#seja-instrutor"
              className="text-sm font-medium text-gray-600 transition-colors hover:text-[var(--brand-orange)]"
            >
              Seja instrutor
            </Link>
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-lg px-3 py-2 transition-colors hover:bg-[#f4f8fc]"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#fff5cc] text-sm font-semibold text-[var(--brand-navy)]">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl border border-gray-100 bg-white py-1 shadow-lg">
                    <Link
                      href={dashboardHref}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Meu painel
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogIn className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/entrar"
                  className="px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:text-[var(--brand-orange)]"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-lg bg-[var(--brand-orange)] px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-[#e45f00]"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-lg p-2 transition-colors hover:bg-gray-100 md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-100 bg-white md:hidden">
          <nav className="flex flex-col gap-1 px-4 py-3">
            <Link
              href="/instrutores"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#f4f8fc]"
              onClick={() => setMobileOpen(false)}
            >
              Buscar instrutor
            </Link>
            <Link
              href="/#como-funciona"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#f4f8fc]"
              onClick={() => setMobileOpen(false)}
            >
              Como funciona
            </Link>
            <Link
              href="/#seja-instrutor"
              className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-[#f4f8fc]"
              onClick={() => setMobileOpen(false)}
            >
              Seja instrutor
            </Link>
            <hr className="my-2 border-gray-100" />
            {user ? (
              <>
                <div className="px-3 py-2">
                  <div className="flex items-center gap-3 rounded-lg bg-[#f4f8fc] px-3 py-2.5">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#fff5cc] text-sm font-semibold text-[var(--brand-navy)]">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">{user.name}</p>
                      <p className="text-xs text-gray-500">
                        {user.role === 'instructor' ? 'Instrutor' : 'Aluno'}
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href={dashboardHref}
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--brand-orange)] hover:bg-[#fff3ea]"
                  onClick={() => setMobileOpen(false)}
                >
                  Meu painel
                </Link>
                <Link
                  href="/perfil"
                  className="rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Perfil
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
                >
                  <LogIn className="h-4 w-4" />
                  Sair
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/entrar"
                  className="w-full rounded-lg border border-gray-200 px-4 py-2.5 text-center text-sm font-medium hover:bg-[#f4f8fc]"
                  onClick={() => setMobileOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="w-full rounded-lg bg-[var(--brand-orange)] px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#e45f00]"
                  onClick={() => setMobileOpen(false)}
                >
                  Criar conta
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}
    </header>
  )
}
