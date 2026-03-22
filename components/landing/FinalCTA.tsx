'use client'

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'

export default function FinalCTA() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section className="py-24" style={{ background: '#FEFCF5' }}>
      <div className="max-w-7xl mx-auto px-6">
        <div
          ref={ref}
          className="relative rounded-[3rem] p-12 md:p-24 text-center text-white overflow-hidden transition-all duration-700"
          style={{
            background: '#1B5E20',
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          {/* Dot pattern overlay */}
          <div className="absolute inset-0 hero-dots opacity-15 pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto space-y-8">
            {/* Label */}
            <p className="text-xs font-bold uppercase tracking-widest" style={{ color: '#F9A800' }}>
              Disponível em Fortaleza agora
            </p>

            {/* Headline */}
            <h2
              className="font-black text-white"
              style={{
                fontFamily: "'Clash Display', sans-serif",
                fontSize: 'clamp(2.5rem, 6vw, 5rem)',
                lineHeight: 1.05,
                letterSpacing: '-0.02em',
              }}
            >
              Pronto para dar o<br />
              <span style={{ color: '#F9A800' }}>primeiro passo?</span>
            </h2>

            <p
              className="text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed"
              style={{ color: 'rgba(255,255,255,0.7)', fontFamily: "'Outfit', sans-serif" }}
            >
              Milhares de alunos já conquistaram a CNH conosco. Seja você o próximo.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link
                href="/instrutores"
                className="group inline-flex items-center justify-center gap-2.5 px-12 py-5 font-black text-lg rounded-2xl transition-all duration-300 hover:scale-105"
                style={{ background: '#F9A800', color: '#1B5E20' }}
              >
                Sou Aluno
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/cadastro?role=instructor"
                className="group inline-flex items-center justify-center gap-2.5 px-12 py-5 font-bold text-lg rounded-2xl text-white transition-all duration-300 hover:bg-white/15"
                style={{ border: '2px solid rgba(255,255,255,0.3)' }}
              >
                Sou Instrutor
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>

            {/* Trust badges */}
            <div
              className="pt-12 flex flex-wrap justify-center gap-10"
              style={{ opacity: 0.55 }}
            >
              {['DETRAN Certificado', 'Pagamento Seguro', 'Instrutores Verificados'].map((badge) => (
                <div key={badge} className="text-xs font-bold tracking-widest uppercase text-white">
                  {badge}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
