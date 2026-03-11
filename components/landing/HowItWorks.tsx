import { Search, Calendar, Car, CheckCircle, Lock, X, Headphones } from 'lucide-react'

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Busque',
    description:
      'Pesquise instrutores pelo seu bairro ou cidade. Veja avaliacoes, precos e disponibilidade em tempo real.',
    gradient: 'from-[rgba(255,107,0,0.18)] to-transparent',
    iconBg: 'bg-[#fff1e8] text-[#d95c00]',
    numColor: 'text-[#ff6b00]',
    border: 'hover:border-[#ffd7c2]',
  },
  {
    icon: Calendar,
    number: '02',
    title: 'Agende',
    description:
      'Escolha o horário ideal direto no calendario do instrutor. Confirme o agendamento e pague com seguranca.',
    gradient: 'from-[rgba(246,196,0,0.18)] to-transparent',
    iconBg: 'bg-[#fff6cc] text-[#8a6a00]',
    numColor: 'text-[#dca400]',
    border: 'hover:border-[#f8e08f]',
  },
  {
    icon: Car,
    number: '03',
    title: 'Faca sua aula',
    description:
      'O instrutor vai ate voce. Aprenda a dirigir com confiança. Após a aula, deixe sua avaliação.',
    gradient: 'from-[rgba(23,180,74,0.18)] to-transparent',
    iconBg: 'bg-[#e8f8ee] text-[#12853a]',
    numColor: 'text-[#17b44a]',
    border: 'hover:border-[#b9ebc9]',
  },
]

const trustBadges = [
  {
    label: 'Instrutores verificados',
    sub: 'Documentacao conferida',
    icon: CheckCircle,
    color: 'text-[#d95c00]',
    bg: 'bg-[#fff1e8]',
  },
  {
    label: 'Pagamento seguro',
    sub: 'Criptografia SSL',
    icon: Lock,
    color: 'text-[#8a6a00]',
    bg: 'bg-[#fff6cc]',
  },
  {
    label: 'Cancelamento grátis',
    sub: 'Ate 24h antes',
    icon: X,
    color: 'text-emerald-600',
    bg: 'bg-emerald-50',
  },
  {
    label: 'Suporte ativo',
    sub: 'Segunda a sábado',
    icon: Headphones,
    color: 'text-amber-600',
    bg: 'bg-amber-50',
  },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="bg-[#f4f8fc] py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-16 text-center">
          <span className="mb-4 inline-block rounded-full border border-[#ffe0bd] bg-[#fff1e8] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[#d95c00]">
            Simples e rápido
          </span>
          <h2 className="mt-2 mb-4 text-3xl font-black text-gray-900 md:text-4xl">
            Como funciona
          </h2>
          <p className="mx-auto max-w-xl text-lg leading-relaxed text-gray-500">
            Em menos de 5 minutos vocâ encontra um instrutor qualificado e agenda sua primeira aula.
          </p>
        </div>

        <div className="mb-16 grid grid-cols-1 gap-6 md:grid-cols-3">
          {steps.map((step) => (
            <div
              key={step.number}
              className={`group relative overflow-hidden rounded-3xl border border-gray-100 bg-white p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${step.border}`}
            >
              <div
                className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${step.gradient} opacity-0 transition-opacity duration-300 group-hover:opacity-100`}
              />

              <span
                className={`absolute top-4 right-6 select-none text-6xl font-black opacity-15 ${step.numColor}`}
              >
                {step.number}
              </span>

              <div className="relative z-10">
                <div
                  className={`mb-6 flex h-14 w-14 items-center justify-center rounded-2xl transition-transform duration-300 group-hover:scale-110 ${step.iconBg}`}
                >
                  <step.icon className="h-7 w-7" />
                </div>

                {/* {i < steps.length - 1 && (
                  <div className="absolute top-[3.5rem] -right-3 z-20 hidden h-6 w-6 items-center justify-center rounded-full border-2 border-gray-200 bg-white md:flex">
                    <div className="h-2 w-2 rounded-full bg-gray-300" />
                  </div>
                )} */}

                <h3 className="mb-3 text-xl font-bold text-gray-900">{step.title}</h3>
                <p className="text-sm leading-relaxed text-gray-500">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {trustBadges.map(badge => (
            <div
              key={badge.label}
              className="rounded-2xl border border-gray-100 bg-white p-5 text-center shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className={`mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-xl ${badge.bg}`}>
                <badge.icon className={`h-5 w-5 ${badge.color}`} />
              </div>
              <p className="text-sm font-bold text-gray-900">{badge.label}</p>
              <p className="mt-0.5 text-xs text-gray-400">{badge.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
