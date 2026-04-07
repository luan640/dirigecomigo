'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

const services = [
  {
    title: 'Aula para Jovens',
    description: 'Programa completo com teoria e prática ao volante, pensado para quem vai tirar a primeira habilitação.',
    image: '/images/landing/aula-jovem.jpg',
    cta: 'Agendar aula',
    href: '/instrutores',
    accent: '#F9A800',
  },
  {
    title: 'Aula para Adultos',
    description: 'Aulas adaptadas para adultos que estão aprendendo a dirigir ou precisam retomar a prática com confiança.',
    image: '/images/landing/aula-adulto.jpg',
    cta: 'Ver instrutores',
    href: '/instrutores',
    accent: '#43A047',
  },
  {
    title: 'Preparação para o Exame',
    description: 'Simulados reais, treino no percurso do DETRAN e dicas para você passar na primeira tentativa.',
    image: '/images/landing/preparacao-exame.jpg',
    cta: 'Quero me preparar',
    href: '/instrutores',
    accent: '#F9A800',
  },
  {
    title: 'Direção Urbana Avançada',
    description: 'Para quem já tem habilitação mas quer ganhar mais segurança no trânsito intenso de Fortaleza.',
    image: '/images/landing/aula-online.jpg',
    cta: 'Saber mais',
    href: '/instrutores',
    accent: '#43A047',
  },
]

export default function ServicesSection() {
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
    <section ref={ref} id="servicos" className="py-24" style={{ background: '#FEFCF5' }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div
          className="text-center max-w-2xl mx-auto mb-16 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <span
            className="inline-block px-3 py-1 text-xs font-bold tracking-widest uppercase rounded-full mb-4"
            style={{ background: 'rgba(27,94,32,0.08)', color: '#1B5E20' }}
          >
            Nossos Serviços
          </span>
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
          >
            Tudo que você precisa{' '}
            <span style={{ color: '#1B5E20' }}>para dirigir</span>
          </h2>
          <p style={{ color: '#5A7A60' }}>
            Do iniciante ao motorista que quer se aperfeiçoar — temos o instrutor certo para você.
          </p>
        </div>

        {/* 4-column grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {services.map((service, i) => (
            <div
              key={service.title}
              className="group rounded-2xl overflow-hidden flex flex-col transition-all duration-700"
              style={{
                background: '#FFFFFF',
                border: '1px solid rgba(27,94,32,0.1)',
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                opacity: visible ? 1 : 0,
                transform: visible ? 'translateY(0)' : 'translateY(40px)',
                transitionDelay: `${i * 80}ms`,
              }}
            >
              {/* Image */}
              <div className="relative h-52 overflow-hidden">
                <Image
                  src={service.image}
                  alt={service.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                />
                <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,30,15,0.5), transparent)' }} />
              </div>

              {/* Content */}
              <div className="flex flex-col flex-1 p-6 gap-3">
                <h3
                  className="text-lg font-black leading-tight"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
                >
                  {service.title}
                </h3>
                <p className="text-sm leading-relaxed flex-1" style={{ color: '#5A7A60' }}>
                  {service.description}
                </p>
                <Link
                  href={service.href}
                  className="inline-flex items-center gap-2 text-sm font-bold transition-all group/link mt-2"
                  style={{ color: '#1B5E20' }}
                >
                  {service.cta}
                  <ArrowRight className="w-4 h-4 transition-transform group-hover/link:translate-x-1" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
