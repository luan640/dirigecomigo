'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight, CheckCircle2 } from 'lucide-react'

const points = [
  'Instrutores com CNH categoria B e acima, todos verificados',
  'Aulas disponíveis 7 dias por semana, inclusive aos fins de semana',
  'Agendamento online em menos de 2 minutos',
  'Avaliações reais de alunos publicadas na plataforma',
]

export default function AboutSection() {
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

  return (
    <section ref={ref} id="sobre" className="py-24" style={{ background: '#FFFFFF' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

          {/* Image */}
          <div
            className="relative rounded-3xl overflow-hidden transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-40px)',
              height: '480px',
            }}
          >
            <Image
              src="/images/landing/cidade-dirigindo.jpg"
              alt="Instrutor ensinando aluno a dirigir em Fortaleza"
              fill
              className="object-cover"
              sizes="(max-width: 1024px) 100vw, 50vw"
            />
            {/* Floating badge */}
            <div
              className="absolute bottom-8 left-8 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl"
              style={{ background: '#FFFFFF' }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#1B5E20' }}
              >
                <CheckCircle2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#5A7A60' }}>
                  Taxa de Aprovação
                </p>
                <p
                  className="text-2xl font-black"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
                >
                  98%
                </p>
              </div>
            </div>
          </div>

          {/* Text */}
          <div
            className="space-y-8 transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(40px)',
              transitionDelay: '0.1s',
            }}
          >
            <div>
              <span
                className="inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-full mb-4"
                style={{ background: 'rgba(27,94,32,0.08)', color: '#1B5E20' }}
              >
                Sobre o DireçãoFácil
              </span>
              <h2
                className="text-4xl md:text-5xl font-black leading-tight mb-6"
                style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
              >
                Aprenda a dirigir{' '}
                <span style={{ color: '#1B5E20' }}>com segurança</span>
              </h2>
              <p className="text-lg leading-relaxed" style={{ color: '#5A7A60' }}>
                O DireçãoFácil conecta estudantes de direção com os melhores instrutores de Fortaleza. Nossa missão é criar motoristas seguros e confiantes — seja você alguém que nunca tocou num volante ou quem quer superar o medo de dirigir.
              </p>
            </div>

            <p className="leading-relaxed" style={{ color: '#5A7A60' }}>
              Entendemos a rotina corrida. Por isso oferecemos horários flexíveis, incluindo aulas à noite e aos fins de semana. Nossos métodos inovadores garantem que cada aluno aprenda no seu ritmo.
            </p>

            <ul className="space-y-3">
              {points.map((point) => (
                <li key={point} className="flex items-start gap-3">
                  <span
                    className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ background: '#1B5E20' }}
                  >
                    <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </span>
                  <span className="text-sm font-medium" style={{ color: '#0D1A0E' }}>{point}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/instrutores"
              className="inline-flex items-center gap-2.5 px-8 py-4 font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 group"
              style={{ background: '#1B5E20', color: '#FFFFFF' }}
            >
              Encontrar meu instrutor
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
