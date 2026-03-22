'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { Brain, ClipboardCheck, Clock, ShieldCheck, ArrowRight } from 'lucide-react'

export default function BenefitsSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.1 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  const baseCard: React.CSSProperties = {
    transition: 'opacity 0.7s ease, transform 0.7s ease',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(40px)',
  }

  return (
    <section ref={ref} id="beneficios" className="py-24" style={{ background: '#FEFCF5' }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div
          className="mb-16"
          style={{ ...baseCard }}
        >
          <h2
            className="text-4xl md:text-5xl font-black max-w-2xl leading-tight"
            style={{ fontFamily: "'Clash Display', sans-serif", color: '#1B5E20' }}
          >
            Transformamos ansiedade em{' '}
            <span style={{ color: '#0D1A0E' }}>confiança absoluta.</span>
          </h2>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* Large card: Perder o medo */}
          <div
            className="md:col-span-8 rounded-[2rem] p-10 flex flex-col md:flex-row gap-10 items-center overflow-hidden relative group"
            style={{
              ...baseCard,
              background: '#F0FAF2',
              border: '1px solid rgba(27,94,32,0.1)',
            }}
          >
            <div className="space-y-5 z-10 md:w-1/2 flex-shrink-0">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: '#1B5E20' }}
              >
                <Brain className="w-7 h-7 text-white" />
              </div>
              <h3
                className="text-2xl md:text-3xl font-black"
                style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
              >
                Perder o medo de dirigir
              </h3>
              <p className="leading-relaxed" style={{ color: '#5A7A60' }}>
                Nossa abordagem focada no aluno garante que você se sinta seguro antes mesmo de ligar o motor — com paciência, método e empatia.
              </p>
              <ul className="space-y-2">
                {['Aulas no seu ritmo, sem pressão', 'Instrutores certificados e pacientes'].map((item) => (
                  <li key={item} className="flex items-center gap-2.5 text-sm font-semibold" style={{ color: '#0D1A0E' }}>
                    <span
                      className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
                      style={{ background: '#1B5E20' }}
                    >
                      <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/instrutores?foco=medo"
                className="inline-flex items-center gap-2 font-bold text-sm group/link transition-colors"
                style={{ color: '#1B5E20' }}
              >
                Encontrar instrutor
                <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
              </Link>
            </div>
            <div className="md:w-1/2 relative self-stretch min-h-[200px] md:min-h-0 w-full rounded-2xl overflow-hidden">
              <Image
                src="/images/hero-car.jpg"
                alt="Aula de direção com instrutor"
                fill
                className="object-cover transition-transform duration-700 group-hover:scale-105"
                sizes="(max-width: 768px) 100vw, 45vw"
              />
            </div>
          </div>

          {/* Small card: Preparação para prova */}
          <div
            className="md:col-span-4 rounded-[2rem] p-10 flex flex-col justify-between overflow-hidden relative"
            style={{
              ...baseCard,
              background: '#1B5E20',
              transitionDelay: '0.1s',
            }}
          >
            <div className="space-y-5 relative z-10">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: '#F9A800' }}
              >
                <ClipboardCheck className="w-7 h-7" style={{ color: '#003527' }} />
              </div>
              <h3
                className="text-2xl md:text-3xl font-black text-white leading-tight"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                Preparação para o exame
              </h3>
              <p style={{ color: 'rgba(255,255,255,0.65)' }}>
                Simulados reais e técnicas específicas para você passar na primeira tentativa, sem nervosismo.
              </p>
            </div>
            <Link
              href="/instrutores?foco=exame"
              className="mt-8 inline-flex items-center gap-2 font-bold text-sm group/link"
              style={{ color: '#F9A800' }}
            >
              Quero me preparar
              <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
            </Link>
            <div
              className="absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl"
              style={{ background: 'rgba(249,168,0,0.15)' }}
            />
          </div>

          {/* Row 2 left: Horários sob medida */}
          <div
            className="md:col-span-5 bg-white rounded-[2rem] p-10"
            style={{
              ...baseCard,
              border: '1px solid rgba(27,94,32,0.1)',
              transitionDelay: '0.2s',
            }}
          >
            <div className="space-y-5">
              <div className="flex items-center justify-between">
                <Clock className="w-9 h-9" style={{ color: '#F9A800' }} />
                <span
                  className="px-3 py-1 text-xs font-bold rounded-full"
                  style={{ background: 'rgba(249,168,0,0.12)', color: '#B87800' }}
                >
                  FLEXIBILIDADE
                </span>
              </div>
              <h3
                className="text-xl font-black"
                style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
              >
                Horários sob medida
              </h3>
              <p style={{ color: '#5A7A60' }}>
                Agende sua aula no horário que melhor se adapta à sua rotina, incluindo finais de semana.
              </p>
            </div>
          </div>

          {/* Row 2 right: Instrutores verificados */}
          <div
            className="md:col-span-7 rounded-[2rem] p-10 flex items-center justify-between overflow-hidden group"
            style={{
              ...baseCard,
              background: '#F0FAF2',
              border: '1px solid rgba(27,94,32,0.1)',
              transitionDelay: '0.3s',
            }}
          >
            <div className="space-y-4 md:w-3/5">
              <ShieldCheck className="w-9 h-9" style={{ color: '#1B5E20' }} />
              <h3
                className="text-xl font-black"
                style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
              >
                Instrutores verificados
              </h3>
              <p style={{ color: '#5A7A60' }}>
                Todos os instrutores têm documentação conferida e avaliações verificadas por alunos reais.
              </p>
            </div>
            <div
              className="hidden md:flex w-28 h-28 items-center justify-center rounded-2xl flex-shrink-0 transition-transform duration-500 group-hover:rotate-0"
              style={{ background: '#1B5E20', transform: 'rotate(-6deg)' }}
            >
              <span
                className="text-4xl font-black text-white"
                style={{ fontFamily: "'Clash Display', sans-serif" }}
              >
                180+
              </span>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
