'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, CalendarCheck, User, Clock } from 'lucide-react'

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Instrutores verificados',
    description: 'Todos passam por checagem rigorosa de documentação e experiência antes de ingressar na plataforma.',
    accent: '#f6c400',
    bg: 'rgba(246,196,0,0.1)',
    border: 'rgba(246,196,0,0.2)',
  },
  {
    icon: CalendarCheck,
    title: 'Agendamento fácil',
    description: 'Escolha o melhor horário com nosso sistema intuitivo. Confirme e pague em segundos, tudo online.',
    accent: '#21a637',
    bg: 'rgba(33,166,55,0.1)',
    border: 'rgba(33,166,55,0.2)',
  },
  {
    icon: User,
    title: 'Aulas personalizadas',
    description: 'Cada aula é adaptada ao seu nível. Do zero ao avançado, com foco nas suas necessidades.',
    accent: '#17b44a',
    bg: 'rgba(23,180,74,0.1)',
    border: 'rgba(23,180,74,0.2)',
  },
  {
    icon: Clock,
    title: 'No seu ritmo',
    description: 'Sem pressão. Defina a frequência das aulas e evolua conforme o seu tempo e dedicação.',
    accent: '#8ccf10',
    bg: 'rgba(140,207,16,0.1)',
    border: 'rgba(140,207,16,0.2)',
  },
]

function BenefitCard({ benefit, index }: { benefit: (typeof benefits)[0]; index: number }) {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) setTimeout(() => setVisible(true), index * 120)
    }, { threshold: 0.15 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [index])

  const Icon = benefit.icon

  return (
    <div
      ref={ref}
      className="group relative rounded-3xl p-8 transition-all duration-500 cursor-default"
      style={{
        background: 'rgba(6,20,10,0.7)',
        border: `1px solid ${visible ? benefit.border : 'rgba(255,255,255,0.05)'}`,
        backdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(32px)',
        transition: 'opacity 0.6s ease, transform 0.6s ease, border-color 0.4s ease, box-shadow 0.4s ease',
      }}
    >
      {/* Hover glow */}
      <div
        className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
        style={{ background: `radial-gradient(circle at 30% 30%, ${benefit.accent}10, transparent 70%)` }}
      />

      <div
        className="w-14 h-14 rounded-2xl flex items-center justify-center mb-6 transition-transform duration-300 group-hover:scale-110"
        style={{ background: benefit.bg, border: `1px solid ${benefit.border}` }}
      >
        <Icon className="w-7 h-7" style={{ color: benefit.accent }} />
      </div>

      <h3 className="text-xl font-bold text-white mb-3" style={{ fontFamily: "'Syne', sans-serif" }}>
        {benefit.title}
      </h3>
      <p className="text-sm leading-relaxed" style={{ color: 'var(--land-muted)' }}>
        {benefit.description}
      </p>

      {/* Bottom accent line */}
      <div
        className="absolute bottom-0 left-8 right-8 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-500"
        style={{ background: `linear-gradient(90deg, transparent, ${benefit.accent}, transparent)` }}
      />
    </div>
  )
}

export default function BenefitsSection() {
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
    <section id="beneficios" className="py-28" style={{ background: 'var(--land-bg)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div
          ref={titleRef}
          className="text-center mb-16 transition-all duration-700"
          style={{ opacity: titleVisible ? 1 : 0, transform: titleVisible ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <span className="inline-block px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5"
            style={{ background: 'rgba(33,166,55,0.1)', color: '#21a637', border: '1px solid rgba(33,166,55,0.25)' }}>
            Por que a gente?
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Tudo que você precisa<br />
            <span style={{ color: '#21a637' }}>para aprender a dirigir</span>
          </h2>
          <p className="mt-5 text-lg max-w-2xl mx-auto" style={{ color: 'var(--land-muted)' }}>
            A melhor experiência para quem quer dirigir com segurança e conquistar sua CNH em Fortaleza.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {benefits.map((benefit, index) => (
            <BenefitCard key={index} benefit={benefit} index={index} />
          ))}
        </div>
      </div>
    </section>
  )
}
