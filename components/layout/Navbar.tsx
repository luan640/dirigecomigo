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
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) { setUser(null); return }
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

    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
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
    <header className="sticky top-0 z-50 w-full bg-white/90 backdrop-blur-md border-b border-gray-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center">
            <BrandLogo className="h-10 w-auto" priority />
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link
              href="/instrutores"
              className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors"
            >
              Buscar instrutor
            </Link>
            <Link
              href="/#como-funciona"
              className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors"
            >
              Como funciona
            </Link>
            <Link
              href="/#seja-instrutor"
              className="text-sm font-medium text-gray-600 hover:text-violet-600 transition-colors"
            >
              Seja instrutor
            </Link>
          </nav>

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="w-8 h-8 bg-violet-100 rounded-full flex items-center justify-center text-violet-700 font-semibold text-sm">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-gray-700">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="w-4 h-4 text-gray-400" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-100 py-1 z-50">
                    <Link
                      href={dashboardHref}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="w-4 h-4" />
                      Meu painel
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="w-4 h-4" />
                      Perfil
                    </Link>
                    <hr className="my-1 border-gray-100" />
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                    >
                      <LogIn className="w-4 h-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link
                  href="/entrar"
                  className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors px-4 py-2"
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="text-sm font-semibold text-white bg-violet-600 hover:bg-violet-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <nav className="px-4 py-3 flex flex-col gap-1">
            <Link
              href="/instrutores"
              className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Buscar instrutor
            </Link>
            <Link
              href="/#como-funciona"
              className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Como funciona
            </Link>
            <Link
              href="/#seja-instrutor"
              className="px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
              onClick={() => setMobileOpen(false)}
            >
              Seja instrutor
            </Link>
            <hr className="my-2 border-gray-100" />
            {user ? (
              <>
                <Link
                  href={dashboardHref}
                  className="px-3 py-2.5 text-sm font-medium text-violet-600 hover:bg-violet-50 rounded-lg"
                  onClick={() => setMobileOpen(false)}
                >
                  Meu painel
                </Link>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/entrar"
                  className="w-full text-center px-4 py-2.5 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
                  onClick={() => setMobileOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700"
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
