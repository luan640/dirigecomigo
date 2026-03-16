'use client'

import { useEffect, useRef, useState } from 'react'
import { ShieldCheck, CalendarCheck, User, Clock } from 'lucide-react'

const benefits = [
  {
    icon: ShieldCheck,
    title: 'Instrutores verificados',
    description:
      'Todos os instrutores passam por verificação de documentos e experiência antes de fazer parte da plataforma.',
  },
  {
    icon: CalendarCheck,
    title: 'Agendamento fácil',
    description:
      'Escolha o melhor horário para você com nosso sistema de agendamento intuitivo e flexível.',
  },
  {
    icon: User,
    title: 'Aulas personalizadas',
    description:
      'Cada aula é adaptada ao seu nível e necessidades específicas para um aprendizado eficiente.',
  },
  {
    icon: Clock,
    title: 'Aprenda no seu ritmo',
    description:
      'Sem pressão. Você define a frequência das aulas e evolui no tempo que for melhor para você.',
  },
]

function BenefitCard({ benefit, index }: { benefit: (typeof benefits)[0]; index: number }) {
  const [isVisible, setIsVisible] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), index * 100)
        }
      },
      { threshold: 0.1 }
    )
    if (cardRef.current) observer.observe(cardRef.current)
    return () => observer.disconnect()
  }, [index])

  const Icon = benefit.icon

  return (
    <div
      ref={cardRef}
      className={`rounded-2xl border border-slate-200 bg-white p-8 transition-all duration-500 hover:shadow-lg hover:-translate-y-1 ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <div className="w-14 h-14 rounded-xl bg-[#eaf2ff] flex items-center justify-center mb-6">
        <Icon className="w-7 h-7 text-[#0f5fd7]" />
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-3">{benefit.title}</h3>
      <p className="text-slate-500 leading-relaxed">{benefit.description}</p>
    </div>
  )
}

export default function BenefitsSection() {
  return (
    <section id="beneficios" className="py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900">
            Por que aprender por aqui?
          </h2>
          <p className="mt-4 text-lg text-slate-600 max-w-2xl mx-auto">
            Oferecemos a melhor experiência para quem quer aprender a dirigir de forma segura e confiante
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
