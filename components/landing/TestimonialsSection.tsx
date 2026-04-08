'use client'

import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

const stats = [
  { value: '2.400+', label: 'Alunos atendidos' },
  { value: '180+', label: 'Instrutores ativos' },
  { value: '4.9★', label: 'Avaliação média' },
  { value: '98%', label: 'Taxa de aprovação' },
]

export default function TestimonialsSection() {
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
    <section ref={ref} id="depoimentos" className="relative overflow-hidden" style={{ background: '#FFFFFF' }}>

      {/* Stats band */}
      <div style={{ background: '#1B5E20' }}>
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-white/10">
            {stats.map((stat, i) => (
              <div
                key={stat.label}
                className="text-center py-8 px-4 transition-all duration-700"
                style={{
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                  transitionDelay: `${i * 80}ms`,
                }}
              >
                <p
                  className="text-4xl sm:text-5xl font-black mb-1 text-white"
                  style={{ fontFamily: "'Clash Display', sans-serif" }}
                >
                  {stat.value}
                </p>
                <p className="text-sm font-medium text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* DETRAN News Card */}
      <div className="max-w-7xl mx-auto px-6 py-24">
        <div
          className="text-center max-w-2xl mx-auto mb-14 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <span
            className="inline-block text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-4"
            style={{ background: '#F0FAF2', color: '#1B5E20' }}
          >
            Destaque oficial
          </span>
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
          >
            O Ceará na vanguarda da{' '}
            <span style={{ color: '#1B5E20' }}>habilitação</span>
          </h2>
          <p style={{ color: '#5A7A60' }}>O DETRAN-CE lidera a modernização do processo de habilitação no Brasil.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-6xl mx-auto">

          {/* Card 1 — DETRAN-CE */}
          <div
            className="rounded-3xl overflow-hidden flex flex-col transition-all duration-700"
            style={{
              border: '1px solid rgba(27,94,32,0.12)',
              boxShadow: '0 8px 40px rgba(27,94,32,0.08)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(40px)',
              transitionDelay: '0.15s',
            }}
          >
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <Image
                src="/detran-cnh-brasil.jpg"
                alt="Primeiros habilitados pelo programa CNH do Brasil no Ceará"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,26,14,0.6) 0%, transparent 50%)' }} />
              <div className="absolute bottom-4 left-5 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: '#1B5E20', color: '#fff' }}>
                  DETRAN-CE
                </span>
                <span className="text-xs text-white/70">20 jan. 2026</span>
              </div>
            </div>
            <div className="p-7 flex flex-col flex-1" style={{ background: '#F9FDF9' }}>
              <h3 className="text-lg font-black mb-3 leading-snug" style={{ color: '#0D1A0E', fontFamily: "'Clash Display', sans-serif" }}>
                Detran-CE habilita primeiros candidatos do programa CNH do Brasil em menos de 30 dias
              </h3>
              <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: '#5A7A60' }}>
                Robert Souza (19) e Samic Ioody (18) foram aprovados no exame prático com aulas teóricas gratuitas pelo app federal e apenas 2 horas de prática obrigatória.
              </p>
              <a
                href="https://www.detran.ce.gov.br/detran-ce-habilita-primeiros-candidatos-que-aderiram-ao-programa-cnh-do-brasil/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: '#1B5E20' }}
              >
                Leia no site oficial
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

          {/* Card 2 — Diário do Nordeste */}
          <div
            className="rounded-3xl overflow-hidden flex flex-col transition-all duration-700"
            style={{
              border: '1px solid rgba(27,94,32,0.12)',
              boxShadow: '0 8px 40px rgba(27,94,32,0.08)',
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateY(0)' : 'translateY(40px)',
              transitionDelay: '0.25s',
            }}
          >
            <div className="relative w-full" style={{ aspectRatio: '16/9' }}>
              <Image
                src="/diario-nordeste-cnh.webp"
                alt="Governo Federal cobra Detran-CE sobre regras da CNH do Brasil"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(13,26,14,0.6) 0%, transparent 50%)' }} />
              <div className="absolute bottom-4 left-5 flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full" style={{ background: '#0D1A0E', color: '#fff' }}>
                  Diário do Nordeste
                </span>
                <span className="text-xs text-white/70">16 jan. 2026</span>
              </div>
            </div>
            <div className="p-7 flex flex-col flex-1" style={{ background: '#F9FDF9' }}>
              <h3 className="text-lg font-black mb-3 leading-snug" style={{ color: '#0D1A0E', fontFamily: "'Clash Display', sans-serif" }}>
                Governo Federal cobra Detran-CE sobre regras da CNH do Brasil e órgão responde
              </h3>
              <p className="text-sm leading-relaxed mb-5 flex-1" style={{ color: '#5A7A60' }}>
                A Senatran notificou o Detran-CE com prazo de 48h para implementar o programa. O órgão ajustou os exames médico e psicológico para R$&nbsp;90 cada, cumprindo o limite da MP nº&nbsp;1.327/2025.
              </p>
              <a
                href="https://diariodonordeste.verdesmares.com.br/ceara/governo-federal-cobra-detran-ce-sobre-regras-da-cnh-do-brasil-e-orgao-responde-veja-novidades-1.3733459"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold"
                style={{ color: '#1B5E20' }}
              >
                Leia no Diário do Nordeste
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
              </a>
            </div>
          </div>

        </div>
      </div>
    </section>
  )
}
