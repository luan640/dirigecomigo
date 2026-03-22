'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, Calendar, Car, CheckCircle, Lock, X, Headphones } from 'lucide-react'

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Busque',
    description: 'Pesquise instrutores pelo seu bairro. Veja avaliações, preços e disponibilidade em tempo real no mapa.',
  },
  {
    icon: Calendar,
    number: '02',
    title: 'Agende',
    description: 'Escolha o horário ideal direto no calendário do instrutor. Confirme e pague com total segurança.',
  },
  {
    icon: Car,
    number: '03',
    title: 'Dirija',
    description: 'O instrutor vai até você. Aprenda no seu ritmo e, após a aula, deixe sua avaliação.',
  },
]

const trustBadges = [
  { label: 'Instrutores verificados', sub: 'Documentação conferida', icon: CheckCircle },
  { label: 'Pagamento seguro', sub: 'Criptografia SSL', icon: Lock },
  { label: 'Cancelamento grátis', sub: 'Até 24h antes', icon: X },
  { label: 'Suporte ativo', sub: 'Segunda a sábado', icon: Headphones },
]

export default function HowItWorks() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setVisible(true)
    }, { threshold: 0.15 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      id="como-funciona"
      ref={ref}
      className="relative overflow-hidden py-28"
      style={{ background: '#FEFCF5' }}
    >
      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">

        <div
          className="mb-16 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <p className="text-xs font-bold uppercase tracking-widest mb-5" style={{ color: '#1B5E20' }}>
            Simples e rápido
          </p>
          <h2 className="text-4xl sm:text-5xl font-black mb-4"
            style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}>
            Como funciona
          </h2>
          <p className="text-lg max-w-xl" style={{ color: '#5A7A60' }}>
            Em menos de 5 minutos você encontra um instrutor qualificado e agenda sua primeira aula.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 gap-px md:grid-cols-3 mb-16" style={{ background: 'rgba(27,94,32,0.1)' }}>
          {steps.map((step, i) => {
            const Icon = step.icon
            return (
              <div
                key={step.number}
                className="relative p-8 bg-white transition-all duration-700"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(48px)',
                  transitionDelay: `${i * 120}ms`,
                  transition: 'opacity 0.7s ease, transform 0.7s ease',
                }}
              >
                <span
                  className="absolute top-5 right-6 text-7xl font-black select-none pointer-events-none"
                  style={{ color: '#F9A800', opacity: 0.18, fontFamily: "'Clash Display', sans-serif", lineHeight: 1 }}
                >
                  {step.number}
                </span>

                <p className="text-xs font-bold tracking-widest uppercase mb-6" style={{ color: '#F9A800' }}>
                  Passo {step.number}
                </p>

                <div className="w-11 h-11 flex items-center justify-center mb-5"
                  style={{ background: '#1B5E20' }}>
                  <Icon className="w-5 h-5 text-white" />
                </div>

                <h3 className="text-2xl font-black mb-3"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}>
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5A7A60' }}>
                  {step.description}
                </p>
              </div>
            )
          })}
        </div>

        {/* Trust items — inline list */}
        <div className="grid grid-cols-2 gap-6 md:grid-cols-4 pt-10 border-t" style={{ borderColor: 'rgba(27,94,32,0.12)' }}>
          {trustBadges.map((badge, i) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.label}
                className="flex items-start gap-3"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                  transition: `opacity 0.6s ease ${300 + i * 80}ms, transform 0.6s ease ${300 + i * 80}ms`,
                }}
              >
                <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" style={{ color: '#1B5E20' }} />
                <div>
                  <p className="text-sm font-bold" style={{ color: '#0D1A0E' }}>{badge.label}</p>
                  <p className="mt-0.5 text-xs" style={{ color: '#5A7A60' }}>{badge.sub}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
