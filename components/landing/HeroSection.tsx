'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function HeroSection() {
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 120)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative h-screen flex flex-col justify-end overflow-hidden">

      <style>{`
        @keyframes scrollLine {
          0%   { transform: scaleY(1) translateY(0); opacity: 0.6; }
          50%  { transform: scaleY(0.4) translateY(0); opacity: 1; }
          100% { transform: scaleY(1) translateY(0); opacity: 0.6; }
        }
        .hero-scroll-line { animation: scrollLine 2.2s ease-in-out infinite; }
        .hero-cta-yellow:hover { background: #e09200 !important; }
        .hero-cta-ghost:hover  { background: rgba(255,255,255,0.1) !important; }
      `}</style>

      {/* ── Vídeo de fundo ── */}
      <video
        autoPlay muted loop playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="/images/landing/aula-jovem.jpg"
      >
        <source src="/videos/hero.mp4" type="video/mp4" />
      </video>

      {/* ── Grain cinematográfico ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='0.06'/%3E%3C/svg%3E")`,
          mixBlendMode: 'overlay',
          zIndex: 2,
        }}
      />

      {/* ── Gradiente — pesado na base, leve no topo ── */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'linear-gradient(to top, rgba(1,12,5,1) 0%, rgba(1,12,5,0.82) 30%, rgba(1,12,5,0.3) 65%, rgba(1,12,5,0.05) 100%)',
          zIndex: 3,
        }}
      />

      {/* ── Conteúdo ── */}
      <div className="relative w-full max-w-[1380px] mx-auto px-8 md:px-14 pb-14 md:pb-20" style={{ zIndex: 4 }}>

        {/* Headline tipográfico */}
        <div className="mb-8 overflow-hidden" aria-label="Dirija sem medo">
          <span
            className="block text-white"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: 'clamp(5rem, 17vw, 17rem)',
              lineHeight: 0.83,
              letterSpacing: '-0.04em',
              fontWeight: 700,
              opacity: ready ? 1 : 0,
              transform: ready ? 'translateY(0)' : 'translateY(110%)',
              transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
              transitionDelay: '0.05s',
            }}
          >
            DIRIJA
          </span>
          <span
            className="block"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: 'clamp(2.8rem, 8.5vw, 8.5rem)',
              lineHeight: 0.9,
              letterSpacing: '-0.03em',
              fontStyle: 'italic',
              fontWeight: 700,
              color: '#F9A800',
              paddingLeft: 'clamp(0.5rem, 2.5vw, 3.5rem)',
              opacity: ready ? 1 : 0,
              transform: ready ? 'translateY(0)' : 'translateY(80%)',
              transition: 'opacity 0.9s cubic-bezier(0.16,1,0.3,1), transform 0.9s cubic-bezier(0.16,1,0.3,1)',
              transitionDelay: '0.2s',
            }}
          >
            sem medo.
          </span>
        </div>

        {/* Linha divisória + info + CTAs */}
        <div
          style={{
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: '20px',
            opacity: ready ? 1 : 0,
            transform: ready ? 'translateY(0)' : 'translateY(18px)',
            transition: 'opacity 0.8s ease, transform 0.8s ease',
            transitionDelay: '0.42s',
          }}
        >
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">

            {/* Texto curto */}
            <div>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  color: 'rgba(255,255,255,0.38)',
                  fontSize: '11px',
                  letterSpacing: '0.15em',
                  textTransform: 'uppercase',
                  marginBottom: '4px',
                }}
              >
                Fortaleza · CE
              </p>
              <p
                style={{
                  fontFamily: "'Outfit', sans-serif",
                  color: 'rgba(255,255,255,0.65)',
                  fontSize: '15px',
                  lineHeight: 1.55,
                  maxWidth: '320px',
                }}
              >
                Instrutores verificados. Agendamento online. No seu horário.
              </p>
            </div>

            {/* CTAs */}
            <div className="flex gap-3 flex-shrink-0">
              <Link
                href="/instrutores"
                className="hero-cta-yellow"
                style={{
                  background: '#F9A800',
                  color: '#0a1f06',
                  padding: '13px 30px',
                  borderRadius: '3px',
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  display: 'inline-block',
                  transition: 'background 0.2s ease',
                }}
              >
                Sou Aluno →
              </Link>
              <Link
                href="/cadastro?role=instructor"
                className="hero-cta-ghost"
                style={{
                  border: '1px solid rgba(255,255,255,0.22)',
                  color: 'rgba(255,255,255,0.8)',
                  padding: '13px 30px',
                  borderRadius: '3px',
                  fontFamily: "'Clash Display', sans-serif",
                  fontWeight: 700,
                  fontSize: '14px',
                  letterSpacing: '0.04em',
                  textDecoration: 'none',
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.04)',
                  backdropFilter: 'blur(8px)',
                  transition: 'background 0.2s ease',
                }}
              >
                Sou Instrutor
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── Indicador de scroll ── */}
      <div
        className="absolute bottom-7 right-10 flex flex-col items-center gap-1.5"
        style={{
          zIndex: 4,
          opacity: ready ? 1 : 0,
          transition: 'opacity 1s ease',
          transitionDelay: '1s',
        }}
      >
        <span
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontSize: '9px',
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.3)',
            writingMode: 'vertical-rl',
            marginBottom: '4px',
          }}
        >
          scroll
        </span>
        <div
          className="hero-scroll-line"
          style={{
            width: '1px',
            height: '44px',
            background: 'rgba(255,255,255,0.4)',
            transformOrigin: 'top',
          }}
        />
      </div>

    </section>
  )
}
