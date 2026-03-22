'use client'

import Link from 'next/link'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
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
      style={{ background: '#F9A800' }}
    >
      {/* Dot pattern */}
      <div className="absolute inset-0 hero-dots opacity-30 pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">

          {/* Left — Text */}
          <div
            className="transition-all duration-700"
            style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateX(0)' : 'translateX(-40px)' }}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-6" style={{ color: '#1B5E20' }}>
              Para instrutores
            </p>

            <h2 className="mb-5 text-4xl font-black leading-tight md:text-5xl"
              style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}>
              Expanda seus alunos<br />
              <span style={{ color: '#1B5E20' }}>com o Direção Fácil</span>
            </h2>

            <p className="mb-8 text-lg leading-relaxed" style={{ color: 'rgba(13,26,14,0.7)' }}>
              Cadastre-se como instrutor parceiro e conecte-se com alunos prontos para aprender em Fortaleza.
              Por apenas{' '}
              <strong style={{ color: '#1B5E20' }}>
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
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0" style={{ color: '#1B5E20' }} />
                  <span className="text-sm font-medium" style={{ color: 'rgba(13,26,14,0.75)' }}>{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro?role=instructor"
              className="group inline-flex items-center gap-2.5 px-8 py-4 font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-xl"
              style={{ background: '#1B5E20', borderRadius: '6px' }}
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
              className="relative w-full max-w-sm p-8 bg-white"
              style={{
                border: '1px solid rgba(27,94,32,0.15)',
                boxShadow: '0 8px 48px rgba(27,94,32,0.15)',
              }}
            >
              {/* Top accent bar */}
              <div className="absolute left-0 right-0 top-0 h-1"
                style={{ background: '#1B5E20' }} />

              <div className="mb-6 pt-3 text-center">
                <p className="mb-2 text-sm font-medium" style={{ color: '#5A7A60' }}>Assinatura mensal</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-6xl font-black" style={{ color: '#1B5E20', fontFamily: "'Clash Display', sans-serif" }}>
                    R$15
                  </span>
                  <span className="mb-2 text-sm" style={{ color: '#5A7A60' }}>/mês</span>
                </div>
                <p className="mt-1 text-xs" style={{ color: '#5A7A60' }}>Cancele quando quiser</p>
              </div>

              {/* Simulation box */}
              <div className="mb-6 p-5" style={{ background: '#E8F5E9', border: '1px solid rgba(27,94,32,0.12)' }}>
                <p className="mb-3 text-sm font-bold" style={{ color: '#0D1A0E' }}>Simulação por aula</p>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#5A7A60' }}>Valor da aula</span>
                    <span className="font-semibold" style={{ color: '#0D1A0E' }}>R$100</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span style={{ color: '#5A7A60' }}>Taxa da plataforma (8%)</span>
                    <span className="font-semibold text-red-500">− R$8</span>
                  </div>
                  <div className="h-px my-2" style={{ background: 'rgba(27,94,32,0.15)' }} />
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: '#0D1A0E' }}>Valor cobrado</span>
                    <span className="text-lg font-black" style={{ color: '#1B5E20' }}>R$108</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-bold" style={{ color: '#0D1A0E' }}>Você recebe</span>
                    <span className="text-lg font-black" style={{ color: '#1B5E20' }}>R$100</span>
                  </div>
                </div>
              </div>

              <Link
                href="/cadastro?role=instructor"
                className="block w-full px-4 py-4 text-center font-bold text-white transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg"
                style={{ background: '#1B5E20', borderRadius: '6px' }}
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
