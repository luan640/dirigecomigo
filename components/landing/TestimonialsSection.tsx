'use client'

import { useEffect, useRef, useState } from 'react'

const featured = {
  text: 'Eu tinha pânico só de sentar no banco do motorista. Com os instrutores do DireçãoFácil, hoje eu viajo sozinha com meus filhos. Mudou completamente minha vida!',
  name: 'Rafaela Sousa',
  city: 'Aldeota, Fortaleza',
  role: 'Superou o medo de dirigir',
  initials: 'RS',
  color: '#1B5E20',
}

const others = [
  {
    text: 'Passei na prova do DETRAN na primeira tentativa! O instrutor me treinou exatamente no percurso do exame. Recomendo demais!',
    name: 'Lucas Mendonça',
    city: 'Messejana, Fortaleza',
    role: 'Habilitado na 1ª tentativa',
    initials: 'LM',
    color: '#2E7D32',
  },
  {
    text: 'Depois de anos com a carteira na gaveta, finalmente aprendi a dirigir de verdade. Hoje dirijo todo dia.',
    name: 'Carla Viana',
    city: 'Parangaba, Fortaleza',
    role: 'Voltou a dirigir com confiança',
    initials: 'CV',
    color: '#43A047',
  },
  {
    text: 'Excelente plataforma! Agendei fácil, o instrutor foi super pontual e profissional. Em 6 aulas já estava confiante.',
    name: 'Marcos Gomes',
    city: 'Papicu, Fortaleza',
    role: 'Primeiro carro, primeira habilitação',
    initials: 'MG',
    color: '#1B5E20',
  },
]

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

      {/* Testimonials */}
      <div className="max-w-7xl mx-auto px-6 py-24">

        {/* Title */}
        <div
          className="text-center max-w-2xl mx-auto mb-20 transition-all duration-700"
          style={{ opacity: visible ? 1 : 0, transform: visible ? 'translateY(0)' : 'translateY(30px)' }}
        >
          <h2
            className="text-4xl md:text-5xl font-black mb-4"
            style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
          >
            Histórias que inspiram{' '}
            <span style={{ color: '#1B5E20' }}>confiança</span>
          </h2>
          <p style={{ color: '#5A7A60' }}>Veja como ajudamos pessoas reais a conquistarem a estrada.</p>
        </div>

        {/* Two-column layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">

          {/* Left: Featured large quote */}
          <div
            className="relative transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(-40px)',
            }}
          >
            <div
              className="absolute -top-8 -left-4 text-[8rem] font-black select-none leading-none"
              style={{ color: 'rgba(27,94,32,0.08)', fontFamily: "'Clash Display', sans-serif" }}
            >
              &ldquo;
            </div>
            <div className="relative z-10 space-y-8">
              <p
                className="text-2xl md:text-3xl leading-relaxed font-medium italic"
                style={{ color: '#0D1A0E' }}
              >
                &ldquo;{featured.text}&rdquo;
              </p>
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-base font-bold text-white flex-shrink-0"
                  style={{ background: featured.color }}
                >
                  {featured.initials}
                </div>
                <div>
                  <p className="font-bold" style={{ color: '#0D1A0E' }}>{featured.name}</p>
                  <p className="text-sm" style={{ color: '#5A7A60' }}>{featured.city} · {featured.role}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Grid of 3 smaller testimonial cards */}
          <div
            className="grid grid-cols-1 sm:grid-cols-2 gap-4 transition-all duration-700"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? 'translateX(0)' : 'translateX(40px)',
              transitionDelay: '0.15s',
            }}
          >
            {others.map((t, i) => (
              <div
                key={t.name}
                className={`p-6 rounded-2xl flex flex-col gap-3 ${i === 2 ? 'sm:col-span-2' : ''}`}
                style={{
                  background: '#F0FAF2',
                  border: '1px solid rgba(27,94,32,0.1)',
                  transition: `opacity 0.6s ease ${0.2 + i * 0.1}s, transform 0.6s ease ${0.2 + i * 0.1}s`,
                  opacity: visible ? 1 : 0,
                  transform: visible ? 'translateY(0)' : 'translateY(20px)',
                }}
              >
                <div className="flex gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <svg key={s} className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="#F9A800">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  ))}
                </div>
                <p className="text-sm leading-relaxed italic flex-1" style={{ color: '#5A7A60' }}>
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'rgba(27,94,32,0.1)' }}>
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                    style={{ background: t.color }}
                  >
                    {t.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate" style={{ color: '#0D1A0E' }}>{t.name}</p>
                    <p className="text-xs truncate" style={{ color: '#5A7A60' }}>{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
