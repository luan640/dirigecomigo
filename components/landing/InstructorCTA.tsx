'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { PLATFORM_CONFIG } from '@/constants/pricing'
import { formatCurrency } from '@/utils/format'
import { useEffect, useRef, useState } from 'react'

export default function InstructorCTA() {
  const benefits = [
    'Apareça para centenas de alunos em busca de instrutor',
    'Gerencie sua agenda de forma simples e intuitiva',
    'Receba pagamentos com segurança direto no app',
    'Histórico completo de aulas e faturamento',
    'Perfil público com avaliações verificadas',
    'Suporte dedicado para instrutores parceiros',
  ]

  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true)
    }, { threshold: 0.15 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="seja-instrutor"
      ref={ref}
      className="relative py-28 overflow-hidden"
      style={{ background: 'var(--land-surface)' }}
    >
      {/* Background decorations */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(33,166,55,0.4), transparent)' }} />
        <div className="absolute bottom-0 left-0 right-0 h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(246,196,0,0.3), transparent)' }} />
        <div className="absolute right-0 top-0 w-[600px] h-[600px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle at right top, rgba(33,166,55,0.08), transparent 60%)' }} />
        <div className="absolute left-0 bottom-0 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle at left bottom, rgba(33,166,55,0.07), transparent 60%)' }} />
        {/* Subtle dot grid */}
        <div className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(33,166,55,0.18) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
          }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2">

          {/* Left — Text */}
          <div
            className="transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-40px)' }}
          >
            <span className="mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
              style={{ background: 'rgba(33,166,55,0.12)', color: '#21a637', border: '1px solid rgba(33,166,55,0.25)' }}>
              <Sparkles className="h-3.5 w-3.5" />
              Para instrutores
            </span>

            <h2 className="mb-5 text-4xl font-black leading-tight text-white md:text-5xl"
              style={{ fontFamily: "'Syne', sans-serif" }}>
              Expanda seus alunos<br />
              <span className="gradient-text">com o DirigeComigo</span>
            </h2>

            <p className="mb-8 text-lg leading-relaxed" style={{ color: 'var(--land-muted)' }}>
              Cadastre-se como instrutor parceiro e conecte-se com alunos prontos para aprender em Fortaleza.
              Por apenas{' '}
              <strong className="text-white">
                {formatCurrency(PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE)}/mês
              </strong>
              , tenha acesso completo à plataforma.
            </p>

            <ul className="mb-10 space-y-3">
              {benefits.map((benefit, i) => (
                <li key={benefit} className="flex items-start gap-3"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? 'translateX(0)' : 'translateX(-20px)',
                    transition: `all 0.5s ease ${0.1 + i * 0.08}s`,
                  }}>
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-400" />
                  <span className="text-sm" style={{ color: 'var(--land-muted)' }}>{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro?role=instructor"
              className="group inline-flex items-center gap-2.5 rounded-2xl px-8 py-4 font-bold text-black transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, #21a637, #178a2e)',
                boxShadow: '0 0 32px rgba(33,166,55,0.35), 0 8px 24px rgba(33,166,55,0.2)',
              }}
            >
              Cadastrar meu perfil
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          {/* Right — Pricing card */}
          <div
            className="flex justify-center transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(40px)',
              transitionDelay: '0.2s',
            }}
          >
            <div
              className="relative w-full max-w-sm rounded-3xl p-8"
              style={{
                background: 'rgba(2,13,4,0.9)',
                border: '1px solid rgba(33,166,55,0.25)',
                backdropFilter: 'blur(20px)',
                boxShadow: '0 0 60px rgba(33,166,55,0.1), 0 32px 64px rgba(0,0,0,0.4)',
              }}
            >
              {/* Top rainbow bar */}
              <div className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl"
                style={{ background: 'linear-gradient(90deg, #178a2e, #21a637, #f6c400)' }} />

              <div className="mb-6 pt-2 text-center">
                <p className="mb-2 text-sm font-medium" style={{ color: 'var(--land-muted)' }}>Assinatura mensal</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-6xl font-black" style={{ color: '#21a637', fontFamily: "'Syne', sans-serif" }}>
                    R$15
                  </span>
                  <span className="mb-2 text-sm" style={{ color: 'var(--land-muted)' }}>/mês</span>
                </div>
                <p className="mt-1 text-xs" style={{ color: 'var(--land-muted)' }}>Cancele quando quiser</p>
              </div>

              {/* Simulation box */}
              <div className="mb-6 rounded-2xl p-5"
                style={{ background: 'rgba(246,196,0,0.06)', border: '1px solid rgba(246,196,0,0.15)' }}>
                <p className="mb-3 text-sm font-bold text-white">Simulação por aula</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--land-muted)' }}>Valor da aula</span>
                    <span className="font-semibold text-white">R$100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: 'var(--land-muted)' }}>Taxa da plataforma (8%)</span>
                    <span className="font-semibold text-red-400">− R$8</span>
                  </div>
                  <div className="h-px my-2" style={{ background: 'rgba(246,196,0,0.2)' }} />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Valor cobrado</span>
                    <span className="text-lg font-black text-green-400">R$108</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold text-white">Você recebe</span>
                    <span className="text-lg font-black text-green-400">R$100</span>
                  </div>
                </div>
              </div>

              <Link
                href="/cadastro?role=instructor"
                className="block w-full rounded-2xl px-4 py-4 text-center font-bold text-black transition-all duration-300 hover:-translate-y-0.5"
                style={{
                  background: 'linear-gradient(135deg, #21a637, #178a2e)',
                  boxShadow: '0 0 24px rgba(33,166,55,0.35)',
                }}
              >
                Começar agora
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
