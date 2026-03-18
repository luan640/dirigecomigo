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
    <header className="sticky top-0 z-50 w-full border-b backdrop-blur-xl" style={{ borderColor: 'rgba(33,166,55,0.12)', background: 'rgba(2,13,4,0.93)', boxShadow: '0 8px 32px rgba(0,0,0,0.5)' }}>
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center">
            <BrandLogo className="h-10 w-auto" priority />
          </Link>

          <nav className="hidden items-center gap-6 md:flex">
            <Link
              href="/instrutores"
              className="text-sm font-medium transition-colors hover:text-yellow-400"
              style={{ color: 'rgba(232,240,255,0.7)' }}
            >
              Buscar instrutor
            </Link>
            <Link
              href="/#como-funciona"
              className="text-sm font-medium transition-colors hover:text-yellow-400"
              style={{ color: 'rgba(232,240,255,0.7)' }}
            >
              Como funciona
            </Link>
            <Link
              href="/#seja-instrutor"
              className="text-sm font-medium transition-colors hover:text-yellow-400"
              style={{ color: 'rgba(232,240,255,0.7)' }}
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
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold" style={{ background: 'rgba(33,166,55,0.2)', color: '#21a637', border: '1px solid rgba(33,166,55,0.3)' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-medium text-white/80">{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4 text-white/40" />
                </button>

                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 rounded-xl py-1" style={{ background: '#06140a', border: '1px solid rgba(33,166,55,0.15)', boxShadow: '0 16px 32px rgba(0,0,0,0.5)' }}>
                    <Link
                      href={dashboardHref}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <LayoutDashboard className="h-4 w-4" />
                      Meu painel
                    </Link>
                    <Link
                      href="/perfil"
                      className="flex items-center gap-2 px-4 py-2.5 text-sm text-white/80 hover:bg-white/5 hover:text-white"
                      onClick={() => setUserMenuOpen(false)}
                    >
                      <User className="h-4 w-4" />
                      Perfil
                    </Link>
                    <hr className="my-1" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
                    <button
                      onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10"
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
                  className="px-4 py-2 text-sm font-medium transition-colors hover:text-yellow-400"
                  style={{ color: 'rgba(232,240,255,0.7)' }}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="rounded-xl px-5 py-2 text-sm font-bold text-black transition-all duration-300 hover:-translate-y-0.5"
                  style={{
                    background: 'linear-gradient(135deg, #f6c400, #ff9500)',
                    boxShadow: '0 0 16px rgba(246,196,0,0.3)',
                  }}
                >
                  Criar conta
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-xl p-2 transition-colors hover:bg-white/10 md:hidden text-white/70"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label="Menu"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t md:hidden" style={{ borderColor: 'rgba(33,166,55,0.1)', background: 'rgba(2,13,4,0.98)' }}>
          <nav className="flex flex-col gap-1 px-4 py-3">
            <Link
              href="/instrutores"
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Buscar instrutor
            </Link>
            <Link
              href="/#como-funciona"
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Como funciona
            </Link>
            <Link
              href="/#seja-instrutor"
              className="rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
              onClick={() => setMobileOpen(false)}
            >
              Seja instrutor
            </Link>
            <hr className="my-2" style={{ borderColor: 'rgba(255,255,255,0.08)' }} />
            {user ? (
              <>
                <div className="px-3 py-2">
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: 'rgba(33,166,55,0.06)', border: '1px solid rgba(33,166,55,0.15)' }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold" style={{ background: 'rgba(33,166,55,0.2)', color: '#21a637' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-white">{user.name}</p>
                      <p className="text-xs" style={{ color: 'var(--land-muted)' }}>
                        {user.role === 'instructor' ? 'Instrutor' : 'Aluno'}
                      </p>
                    </div>
                  </div>
                </div>
                <Link
                  href={dashboardHref}
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-yellow-400 hover:bg-yellow-400/10"
                  onClick={() => setMobileOpen(false)}
                >
                  Meu painel
                </Link>
                <Link
                  href="/perfil"
                  className="rounded-xl px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5"
                  onClick={() => setMobileOpen(false)}
                >
                  Perfil
                </Link>
                <button
                  onClick={handleSignOut}
                  className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 hover:bg-red-500/10"
                >
                  <LogIn className="h-4 w-4" />
                  Sair
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link
                  href="/entrar"
                  className="w-full rounded-xl border px-4 py-2.5 text-center text-sm font-medium text-white/70 hover:bg-white/5"
                  style={{ borderColor: 'rgba(255,255,255,0.1)' }}
                  onClick={() => setMobileOpen(false)}
                >
                  Entrar
                </Link>
                <Link
                  href="/cadastro"
                  className="w-full rounded-xl px-4 py-2.5 text-center text-sm font-bold text-black"
                  style={{ background: 'linear-gradient(135deg, #f6c400, #ff9500)' }}
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
