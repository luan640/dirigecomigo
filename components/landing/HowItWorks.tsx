'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Calendar, Car, CheckCircle, Lock, X, Headphones } from 'lucide-react'

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Busque',
    description: 'Pesquise instrutores pelo seu bairro. Veja avaliações, preços e disponibilidade em tempo real no mapa.',
    accent: '#f6c400',
    delay: '0s',
  },
  {
    icon: Calendar,
    number: '02',
    title: 'Agende',
    description: 'Escolha o horário ideal direto no calendário do instrutor. Confirme e pague com total segurança.',
    accent: '#21a637',
    delay: '0.15s',
  },
  {
    icon: Car,
    number: '03',
    title: 'Dirija',
    description: 'O instrutor vai até você. Aprenda no seu ritmo e, após a aula, deixe sua avaliação.',
    accent: '#17b44a',
    delay: '0.3s',
  },
]

const trustBadges = [
  { label: 'Instrutores verificados', sub: 'Documentação conferida', icon: CheckCircle, accent: '#f6c400' },
  { label: 'Pagamento seguro', sub: 'Criptografia SSL', icon: Lock, accent: '#21a637' },
  { label: 'Cancelamento grátis', sub: 'Até 24h antes', icon: X, accent: '#17b44a' },
  { label: 'Suporte ativo', sub: 'Segunda a sábado', icon: Headphones, accent: '#8ccf10' },
]

function StepCard({ step, index }: { step: (typeof steps)[0]; index: number }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setTimeout(() => setVisible(true), index * 150)
    }, { threshold: 0.2 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [index])

  const Icon = step.icon

  return (
    <div
      ref={ref}
      className="group relative rounded-3xl p-8 transition-all duration-700"
      style={{
        background: 'rgba(6,20,10,0.8)',
        border: `1px solid rgba(255,255,255,0.06)`,
        backdropFilter: 'blur(16px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(48px)',
      }}
    >
      {/* Hover glow fill */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 20% 20%, ${step.accent}12 0%, transparent 60%)` }}
      />

      {/* Big number watermark */}
      <span
        className="absolute top-5 right-6 text-7xl font-black select-none pointer-events-none transition-all duration-300 group-hover:opacity-25"
        style={{ color: step.accent, opacity: 0.12, fontFamily: "'Syne', sans-serif", lineHeight: 1 }}
      >
        {step.number}
      </span>

      <div className="relative z-10">
        {/* Icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
          style={{
            background: `${step.accent}18`,
            border: `1px solid ${step.accent}35`,
          }}
        >
          <Icon className="w-7 h-7" style={{ color: step.accent }} />
        </div>

        {/* Step label */}
        <span className="text-xs font-bold tracking-widest uppercase mb-3 block" style={{ color: step.accent }}>
          Passo {step.number}
        </span>

        <h3 className="text-2xl font-black text-white mb-4" style={{ fontFamily: "'Syne', sans-serif" }}>
          {step.title}
        </h3>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--land-muted)' }}>
          {step.description}
        </p>
      </div>

      {/* Bottom accent */}
      <div
        className="absolute bottom-0 left-0 right-0 h-1 rounded-b-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${step.accent}, transparent)` }}
      />
    </div>
  )
}

export default function HowItWorks() {
  const titleRef = useRef<HTMLDivElement>(null)
  const [titleVisible, setTitleVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setTitleVisible(true)
    }, { threshold: 0.2 })
    if (titleRef.current) observer.observe(titleRef.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="como-funciona"
      className="py-28 relative overflow-hidden"
      style={{ background: 'var(--land-surface)' }}
    >
      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(33,166,55,0.35), transparent)' }} />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[700px] h-px"
          style={{ background: 'linear-gradient(90deg, transparent, rgba(33,166,55,0.2), transparent)' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(33,166,55,0.04) 0%, transparent 70%)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div
          ref={titleRef}
          className="mb-16 text-center transition-all duration-700"
          style={{ opacity: titleVisible ? 1 : 0, transform: titleVisible ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <span className="mb-5 inline-block rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(33,166,55,0.1)', color: '#21a637', border: '1px solid rgba(33,166,55,0.25)' }}>
            Simples e rápido
          </span>
          <h2 className="mt-3 mb-4 text-4xl font-black text-white md:text-5xl" style={{ fontFamily: "'Syne', sans-serif" }}>
            Como funciona
          </h2>
          <p className="mx-auto max-w-xl text-lg" style={{ color: 'var(--land-muted)' }}>
            Em menos de 5 minutos você encontra um instrutor qualificado e agenda sua primeira aula.
          </p>
        </div>

        {/* Steps */}
        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <StepCard key={step.number} step={step} index={i} />
          ))}
        </div>

        {/* Connecting line (desktop) */}
        <div className="hidden md:block relative -mt-[calc(50%+48px)] mb-[calc(50%+48px)] pointer-events-none" />

        {/* Trust badges */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {trustBadges.map((badge, i) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.label}
                className="rounded-2xl p-5 text-center transition-all duration-300 group cursor-default"
                style={{
                  background: 'rgba(6,20,10,0.7)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <div
                  className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110"
                  style={{ background: `${badge.accent}15`, border: `1px solid ${badge.accent}30` }}
                >
                  <Icon className="h-5 w-5" style={{ color: badge.accent }} />
                </div>
                <p className="text-sm font-bold text-white">{badge.label}</p>
                <p className="mt-0.5 text-xs" style={{ color: 'var(--land-muted)' }}>{badge.sub}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
