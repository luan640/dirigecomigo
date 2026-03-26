'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { Menu, X, User, LogIn, LayoutDashboard, ChevronDown } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import BrandLogo from '@/components/layout/BrandLogo'

const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'

interface NavUser {
  name: string
  role: 'student' | 'instructor' | 'admin'
}

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const [user, setUser] = useState<NavUser | null>(null)
  const router = useRouter()

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 16)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    if (DEMO_MODE) return
    const supabase = createClient()
    let mounted = true

    const loadProfile = async (userId: string, email?: string) => {
      const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', userId).maybeSingle() as { data: { full_name: string | null; role: string | null } | null }
      if (!mounted) return
      if (profile) {
        setUser({ name: profile.full_name || email?.split('@')[0] || 'Usuário', role: (profile.role as NavUser['role']) || 'student' })
      } else {
        setUser({ name: email?.split('@')[0] || 'Usuário', role: 'student' })
      }
    }

    void supabase.auth.getUser().then(({ data: { user: authUser } }) => {
      if (authUser) {
        void loadProfile(authUser.id, authUser.email ?? undefined)
      } else if (mounted) {
        setUser(null)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        void loadProfile(session.user.id, session.user.email ?? undefined)
      } else {
        if (mounted) setUser(null)
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  const handleSignOut = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    setUser(null)
    setUserMenuOpen(false)
    router.push('/')
    router.refresh()
  }

  const dashboardHref = user?.role === 'admin' ? '/admin' : user?.role === 'instructor' ? '/painel/dashboard' : '/aluno/dashboard'

  return (
    <header
      className="sticky top-0 z-50 w-full transition-all duration-300"
      style={{
        background: scrolled ? 'rgba(254,252,245,0.97)' : 'rgba(0,53,39,0.4)',
        borderBottom: scrolled ? '1px solid rgba(27,94,32,0.1)' : '1px solid rgba(255,255,255,0.08)',
        boxShadow: scrolled ? '0 2px 20px rgba(27,94,32,0.08)' : 'none',
        backdropFilter: 'blur(12px)',
      }}
    >
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">

          <Link href="/" className="flex items-center">
            <BrandLogo className="h-10 w-auto" priority />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            {[
              { href: '/#como-funciona', label: 'Como funciona' },
              { href: '/instrutores', label: 'Instrutores' },
              { href: '/#seja-instrutor', label: 'Seja instrutor' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm font-semibold transition-colors"
                style={{ color: scrolled ? '#3D5940' : 'rgba(255,255,255,0.85)' }}
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 transition-colors hover:bg-green-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ background: '#1B5E20' }}>
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: '#0D1A0E' }}>{user.name.split(' ')[0]}</span>
                  <ChevronDown className="h-4 w-4" style={{ color: '#5A7A60' }} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full z-50 mt-1 w-48 py-1.5 overflow-hidden"
                    style={{ background: '#FFFFFF', border: '1px solid rgba(27,94,32,0.1)', boxShadow: '0 16px 40px rgba(27,94,32,0.12)' }}>
                    <Link href={dashboardHref} onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-green-50 transition-colors"
                      style={{ color: '#0D1A0E' }}>
                      <LayoutDashboard className="h-4 w-4 text-green-700" />
                      Meu painel
                    </Link>
                    <Link href="/perfil" onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium hover:bg-green-50 transition-colors"
                      style={{ color: '#0D1A0E' }}>
                      <User className="h-4 w-4 text-green-700" />
                      Perfil
                    </Link>
                    <hr className="my-1" style={{ borderColor: 'rgba(27,94,32,0.08)' }} />
                    <button onClick={handleSignOut}
                      className="flex w-full items-center gap-2 px-4 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50 transition-colors">
                      <LogIn className="h-4 w-4" />
                      Sair
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <>
                <Link href="/entrar" className="px-4 py-2 text-sm font-semibold transition-colors"
                  style={{ color: scrolled ? '#3D5940' : 'rgba(255,255,255,0.8)' }}>
                  Entrar
                </Link>
                <Link href="/cadastro"
                  className="rounded-xl px-5 py-2.5 text-sm font-bold transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                  style={{
                    background: scrolled ? '#1B5E20' : '#F9A800',
                    color: scrolled ? '#FFFFFF' : '#003527',
                    boxShadow: scrolled ? '0 2px 12px rgba(27,94,32,0.25)' : 'none',
                  }}>
                  Criar conta
                </Link>
              </>
            )}
          </div>

          <button
            className="rounded-xl p-2 transition-colors md:hidden"
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={mobileOpen}
            style={{ color: scrolled ? '#1B5E20' : '#FFFFFF' }}
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="border-t md:hidden" style={{ borderColor: 'rgba(27,94,32,0.08)', background: '#FFFFFF' }}>
          <nav className="flex flex-col gap-1 px-4 py-3">
            {[
              { href: '/#como-funciona', label: 'Como funciona' },
              { href: '/instrutores', label: 'Instrutores' },
              { href: '/#seja-instrutor', label: 'Seja instrutor' },
            ].map(({ href, label }) => (
              <Link key={href} href={href}
                className="rounded-xl px-3 py-2.5 text-sm font-semibold hover:bg-green-50 transition-colors"
                style={{ color: '#3D5940' }}
                onClick={() => setMobileOpen(false)}>
                {label}
              </Link>
            ))}
            <hr className="my-2" style={{ borderColor: 'rgba(27,94,32,0.08)' }} />
            {user ? (
              <>
                <div className="px-3 py-2">
                  <div className="flex items-center gap-3 rounded-xl px-3 py-2.5" style={{ background: '#E8F5E9' }}>
                    <div className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-bold text-white" style={{ background: '#1B5E20' }}>
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold" style={{ color: '#0D1A0E' }}>{user.name}</p>
                      <p className="text-xs" style={{ color: '#5A7A60' }}>{user.role === 'instructor' ? 'Instrutor' : 'Aluno'}</p>
                    </div>
                  </div>
                </div>
                <Link href={dashboardHref} className="rounded-xl px-3 py-2.5 text-sm font-semibold text-green-700 hover:bg-green-50" onClick={() => setMobileOpen(false)}>Meu painel</Link>
                <button onClick={handleSignOut} className="flex items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-red-500 hover:bg-red-50">
                  <LogIn className="h-4 w-4" />Sair
                </button>
              </>
            ) : (
              <div className="flex flex-col gap-2 pt-1">
                <Link href="/entrar" className="w-full rounded-xl border px-4 py-2.5 text-center text-sm font-semibold hover:bg-green-50 transition-colors"
                  style={{ borderColor: 'rgba(27,94,32,0.15)', color: '#3D5940' }} onClick={() => setMobileOpen(false)}>
                  Entrar
                </Link>
                <Link href="/cadastro" className="w-full rounded-xl px-4 py-2.5 text-center text-sm font-bold text-white"
                  style={{ background: '#1B5E20' }} onClick={() => setMobileOpen(false)}>
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
