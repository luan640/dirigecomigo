'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

const stats = [
  { value: '500+', label: 'Instrutores' },
  { value: '10.000+', label: 'Alunos' },
  { value: '4.9', label: 'Avaliação' },
]

export default function FinalCTA() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true)
    }, { threshold: 0.2 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className="relative py-32 overflow-hidden"
      style={{ background: 'var(--land-bg)' }}
    >
      {/* Animated background */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Radiating rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="absolute rounded-full border"
              style={{
                width: `${i * 280}px`,
                height: `${i * 280}px`,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                borderColor: `rgba(246,196,0,${0.06 - i * 0.015})`,
                animation: `spinSlow ${20 + i * 10}s linear infinite ${i % 2 === 0 ? 'reverse' : ''}`,
              }}
            />
          ))}
        </div>

        {/* Glow center */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(33,166,55,0.07) 0%, transparent 60%)' }} />

        {/* Diagonal gradient wash */}
        <div className="absolute inset-0"
          style={{ background: 'linear-gradient(135deg, rgba(33,166,55,0.04) 0%, transparent 50%, rgba(246,196,0,0.03) 100%)' }} />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-5 py-2 rounded-full mb-8 transition-all duration-700"
          style={{
            background: 'rgba(246,196,0,0.1)',
            border: '1px solid rgba(246,196,0,0.3)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
          }}
        >
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-yellow-400 opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-yellow-400" />
          </span>
          <span className="text-sm font-semibold text-yellow-400">Disponível em Fortaleza agora</span>
        </div>

        {/* Headline */}
        <h2
          className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-none mb-6 transition-all duration-700"
          style={{
            fontFamily: "'Syne', sans-serif",
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(30px)',
            transitionDelay: '0.1s',
          }}
        >
          Pronto para{' '}
          <span
            className="block mt-1"
            style={{
              WebkitTextStroke: '2px #f6c400',
              color: 'transparent',
            }}
          >
            dirigir de vez?
          </span>
        </h2>

        <p
          className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed mb-12 transition-all duration-700"
          style={{
            color: 'var(--land-muted)',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '0.2s',
          }}
        >
          Milhares de pessoas já conquistaram sua liberdade ao volante em Fortaleza.
          Agora é a sua vez. Encontre seu instrutor ideal em minutos.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row gap-4 justify-center mb-16 transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '0.3s',
          }}
        >
          <Link
            href="/instrutores"
            className="group inline-flex items-center justify-center gap-2.5 rounded-2xl px-10 py-5 text-base font-bold text-black transition-all duration-300 hover:-translate-y-1"
            style={{
              background: 'linear-gradient(135deg, #f6c400, #e6b800)',
              boxShadow: '0 0 40px rgba(246,196,0,0.4), 0 16px 32px rgba(246,196,0,0.15)',
            }}
          >
            Encontrar instrutor agora
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
          <Link
            href="/cadastro?role=instructor"
            className="inline-flex items-center justify-center gap-2 rounded-2xl border px-10 py-5 text-base font-bold text-white transition-all duration-300 hover:bg-white/5 hover:-translate-y-1"
            style={{ borderColor: 'rgba(255,255,255,0.15)' }}
          >
            Cadastrar como instrutor
          </Link>
        </div>

        {/* Stats */}
        <div
          className="flex items-center justify-center gap-12 transition-all duration-700"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(20px)',
            transitionDelay: '0.4s',
          }}
        >
          {stats.map((stat, i) => (
            <div key={stat.label} className="flex flex-col items-center">
              {i > 0 && (
                <div className="absolute h-10 w-px -ml-12 mt-3"
                  style={{ background: 'rgba(255,255,255,0.1)' }} />
              )}
              <span
                className="text-3xl font-black"
                style={{ color: '#f6c400', fontFamily: "'Syne', sans-serif" }}
              >
                {stat.value}
              </span>
              <span className="text-sm mt-1" style={{ color: 'var(--land-muted)' }}>{stat.label}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
