'use client'

import Link from 'next/link'
import { ArrowRight, MapPin, Star, Shield, Clock } from 'lucide-react'
import { useEffect, useState } from 'react'

const STATS = [
  { value: '500+', label: 'Instrutores' },
  { value: '98%', label: 'Aprovação' },
  { value: '10k+', label: 'Aulas feitas' },
]

interface FloatingDot {
  top: string
  left?: string
  right?: string
  delay: string
  size: number
}

const floatingDots: FloatingDot[] = [
  { top: '22%', left: '12%', delay: '0s', size: 10 },
  { top: '55%', left: '8%', delay: '0.6s', size: 8 },
  { top: '30%', right: '15%', delay: '1.2s', size: 12 },
  { top: '70%', right: '10%', delay: '0.3s', size: 7 },
  { top: '80%', left: '30%', delay: '0.9s', size: 9 },
  { top: '15%', left: '40%', delay: '1.5s', size: 6 },
]

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden" style={{ background: 'var(--land-bg)' }}>

      {/* Animated road grid background */}
      <div className="absolute inset-0 hero-grid-bg animate-road-grid opacity-60 pointer-events-none" />

      {/* Radial glow centers */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(33,166,55,0.09) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(246,196,0,0.06) 0%, transparent 70%)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(33,166,55,0.04) 0%, transparent 60%)' }} />
      </div>

      {/* Floating city dots */}
      {floatingDots.map((dot, i) => (
        <div
          key={i}
          className="absolute pointer-events-none"
          style={{ top: dot.top, left: dot.left, right: dot.right }}
        >
          <div
            className="rounded-full bg-yellow-400 animate-dot-pulse"
            style={{
              width: dot.size,
              height: dot.size,
              animationDelay: dot.delay,
              boxShadow: '0 0 12px rgba(246,196,0,0.6)',
              opacity: 0.6,
            }}
          />
        </div>
      ))}

      {/* Diagonal accent stripe */}
      <div
        className="absolute right-0 top-0 w-1/2 h-full pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, transparent 40%, rgba(246,196,0,0.025) 100%)',
          clipPath: 'polygon(30% 0, 100% 0, 100% 100%, 0% 100%)',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">

          {/* ── Text Side ── */}
          <div className={`space-y-8 ${mounted ? 'animate-slide-left' : 'opacity-0'}`}>

            {/* Location badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border"
              style={{ borderColor: 'rgba(246,196,0,0.3)', background: 'rgba(246,196,0,0.08)' }}>
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
              </span>
              <MapPin className="w-3.5 h-3.5 text-yellow-400" />
              <span className="text-sm font-semibold text-yellow-400 tracking-wide">
                Fortaleza — CE e região
              </span>
            </div>

            {/* Hero heading */}
            <div className="space-y-2">
              <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black leading-none tracking-tight"
                style={{ fontFamily: "'Syne', sans-serif" }}>
                <span className="block text-white">Dirija</span>
                <span
                  className="block text-outline-yellow"
                  style={{ WebkitTextStroke: '2px #f6c400', color: 'transparent', lineHeight: 1.05 }}
                >
                  sem medo.
                </span>
                <span className="block" style={{ color: 'var(--brand-orange)' }}>
                  Conquiste
                </span>
                <span className="block text-white">sua CNH.</span>
              </h1>
            </div>

            <p className="text-lg text-green-100/70 max-w-lg leading-relaxed" style={{ fontFamily: "'Outfit', sans-serif" }}>
              Conectamos você aos melhores instrutores certificados de Fortaleza.
              Agende online, aprenda no seu ritmo e tire sua habilitação com confiança.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/instrutores"
                className="group inline-flex items-center justify-center gap-2.5 rounded-2xl px-8 py-4 text-base font-bold text-black transition-all duration-300"
                style={{
                  background: 'linear-gradient(135deg, #f6c400, #e6b800)',
                  boxShadow: '0 0 32px rgba(246,196,0,0.35), 0 8px 24px rgba(246,196,0,0.2)',
                }}
              >
                Encontrar instrutor
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/cadastro?role=instructor"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border px-8 py-4 text-base font-bold text-white transition-all duration-300 hover:bg-white/5"
                style={{ borderColor: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)' }}
              >
                Quero ser instrutor
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-2">
                {['men/32', 'women/44', 'men/67', 'women/28'].map((path) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={path}
                    src={`https://randomuser.me/api/portraits/${path}.jpg`}
                    alt="Aluno"
                    className="w-10 h-10 rounded-full border-2 object-cover"
                    style={{ borderColor: 'var(--land-bg)' }}
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-sm mt-0.5" style={{ color: 'var(--land-muted)' }}>
                  4.9 · mais de 2.000 avaliações
                </p>
              </div>
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {STATS.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl p-4 text-center land-card transition-all duration-300"
                >
                  <p className="text-2xl font-black text-yellow-400" style={{ fontFamily: "'Syne', sans-serif" }}>
                    {stat.value}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--land-muted)' }}>{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Visual Side ── */}
          <div className={`relative hidden lg:flex items-center justify-center ${mounted ? 'animate-slide-right' : 'opacity-0'}`}
            style={{ animationDelay: '0.2s' }}>

            {/* Central glowing circle */}
            <div className="relative w-[440px] h-[440px]">

              {/* Outer rings */}
              <div className="absolute inset-0 rounded-full border opacity-20 animate-spin-slow"
                style={{ borderColor: 'rgba(33,166,55,0.5)', animationDuration: '20s' }} />
              <div className="absolute inset-8 rounded-full border opacity-15"
                style={{ borderColor: 'rgba(246,196,0,0.35)', animation: 'spinSlow 28s linear infinite reverse' }} />

              {/* Inner background */}
              <div className="absolute inset-16 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(33,166,55,0.15) 0%, rgba(2,13,4,0.8) 70%)',
                  border: '2px solid rgba(33,166,55,0.2)',
                }} />

              {/* Big steering wheel icon */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-40 h-40 animate-glow-pulse" viewBox="0 0 100 100" fill="none">
                  <circle cx="50" cy="50" r="44" stroke="rgba(33,166,55,0.6)" strokeWidth="3" />
                  <circle cx="50" cy="50" r="10" fill="rgba(33,166,55,0.9)" />
                  <line x1="50" y1="40" x2="50" y2="6" stroke="rgba(33,166,55,0.7)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="50" y1="60" x2="50" y2="94" stroke="rgba(33,166,55,0.7)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="40" y1="50" x2="6" y2="50" stroke="rgba(33,166,55,0.7)" strokeWidth="2.5" strokeLinecap="round" />
                  <line x1="60" y1="50" x2="94" y2="50" stroke="rgba(33,166,55,0.7)" strokeWidth="2.5" strokeLinecap="round" />
                  <path d="M20 20 Q50 30 80 20" stroke="rgba(246,196,0,0.5)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                  <path d="M20 80 Q50 70 80 80" stroke="rgba(246,196,0,0.5)" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                </svg>
              </div>

              {/* Floating instructor pins on the circle */}
              {[
                { angle: 30,  label: 'Carlos', rating: 4.9, color: '#f6c400' },
                { angle: 145, label: 'Ana',    rating: 5.0, color: '#17b44a' },
                { angle: 250, label: 'Paulo',  rating: 4.8, color: '#21a637' },
              ].map(({ angle, label, rating, color }) => {
                const rad = (angle * Math.PI) / 180
                const x = 50 + 46 * Math.cos(rad)
                const y = 50 + 46 * Math.sin(rad)
                return (
                  <div
                    key={label}
                    className="absolute flex items-center gap-1.5 animate-float"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: 'translate(-50%, -50%)',
                      animationDelay: `${angle / 360}s`,
                    }}
                  >
                    <div className="w-10 h-10 rounded-full border-2 overflow-hidden flex-shrink-0"
                      style={{ borderColor: color, boxShadow: `0 0 16px ${color}66` }}>
                      <div className="w-full h-full flex items-center justify-center text-xs font-bold text-white"
                        style={{ background: `${color}33` }}>
                        {label[0]}
                      </div>
                    </div>
                    <div className="rounded-lg px-2 py-1 land-card hidden xl:block">
                      <p className="text-xs font-bold text-white">{label}</p>
                      <p className="text-xs" style={{ color }}>{rating} ★</p>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Floating badge — Aula confirmada */}
            <div className="absolute top-8 -left-4 rounded-2xl p-4 land-card animate-float"
              style={{ animationDelay: '0.5s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(33,166,55,0.2)', border: '1px solid rgba(33,166,55,0.4)' }}>
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">Aula confirmada</p>
                  <p className="text-xs" style={{ color: 'var(--land-muted)' }}>Amanhã às 14h</p>
                </div>
              </div>
            </div>

            {/* Floating badge — Próxima aula */}
            <div className="absolute bottom-8 -right-4 rounded-2xl p-4 land-card animate-float"
              style={{ animationDelay: '1.2s' }}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(246,196,0,0.15)', border: '1px solid rgba(246,196,0,0.3)' }}>
                  <Clock className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <p className="font-semibold text-white text-sm">+50 horas</p>
                  <p className="text-xs" style={{ color: 'var(--land-muted)' }}>de aulas este mês</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom fade */}
      <div className="absolute bottom-0 left-0 right-0 h-24 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, transparent, var(--land-bg))' }} />
    </section>
  )
}
