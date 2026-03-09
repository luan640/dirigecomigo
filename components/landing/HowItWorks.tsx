import { Search, Calendar, Car, CheckCircle, Lock, X, Headphones } from 'lucide-react'

const steps = [
  {
    icon: Search,
    number: '01',
    title: 'Busque',
    description:
      'Pesquise instrutores pelo seu bairro ou cidade. Veja avaliações, preços e disponibilidade em tempo real.',
    gradient: 'from-violet-500/20 to-violet-600/5',
    iconBg: 'bg-violet-100 text-violet-700',
    numColor: 'text-violet-500',
    border: 'hover:border-violet-200',
  },
  {
    icon: Calendar,
    number: '02',
    title: 'Agende',
    description:
      'Escolha o horário ideal direto no calendário do instrutor. Confirme o agendamento e pague com segurança.',
    gradient: 'from-teal-500/20 to-teal-600/5',
    iconBg: 'bg-teal-100 text-teal-700',
    numColor: 'text-teal-500',
    border: 'hover:border-teal-200',
  },
  {
    icon: Car,
    number: '03',
    title: 'Faça sua aula',
    description:
      'O instrutor vai até você. Aprenda a dirigir com confiança. Após a aula, deixe sua avaliação.',
    gradient: 'from-emerald-500/20 to-emerald-600/5',
    iconBg: 'bg-emerald-100 text-emerald-700',
    numColor: 'text-emerald-500',
    border: 'hover:border-emerald-200',
  },
]

const trustBadges = [
  { label: 'Instrutores verificados', sub: 'Documentação conferida', icon: CheckCircle, color: 'text-violet-600', bg: 'bg-violet-50' },
  { label: 'Pagamento seguro', sub: 'Criptografia SSL', icon: Lock, color: 'text-teal-600', bg: 'bg-teal-50' },
  { label: 'Cancelamento grátis', sub: 'Até 24h antes', icon: X, color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { label: 'Suporte ativo', sub: 'Segunda a sábado', icon: Headphones, color: 'text-amber-600', bg: 'bg-amber-50' },
]

export default function HowItWorks() {
  return (
    <section id="como-funciona" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block text-xs font-bold text-violet-600 uppercase tracking-[0.18em] bg-violet-50 border border-violet-100 px-4 py-1.5 rounded-full mb-4">
            Simples e rápido
          </span>
          <h2 className="text-3xl md:text-4xl font-black text-gray-900 mt-2 mb-4">
            Como funciona
          </h2>
          <p className="text-lg text-gray-500 max-w-xl mx-auto leading-relaxed">
            Em menos de 5 minutos você encontra um instrutor qualificado e agenda sua primeira aula.
          </p>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {steps.map((step, i) => (
            <div
              key={step.number}
              className={`relative bg-white rounded-3xl p-8 border border-gray-100 ${step.border} shadow-sm hover:shadow-lg transition-all duration-300 hover:-translate-y-1 group overflow-hidden`}
            >
              {/* Background gradient blob */}
              <div className={`absolute inset-0 bg-gradient-to-br ${step.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-3xl`} />

              {/* Step number */}
              <span className={`relative text-6xl font-black ${step.numColor} opacity-15 absolute top-4 right-6 select-none`}>
                {step.number}
              </span>

              <div className="relative z-10">
                {/* Icon */}
                <div className={`w-14 h-14 rounded-2xl ${step.iconBg} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  <step.icon className="w-7 h-7" />
                </div>

                {/* Connector dot (desktop) */}
                {i < steps.length - 1 && (
                  <div className="hidden md:block absolute top-[3.5rem] -right-3 w-6 h-6 bg-white border-2 border-gray-200 rounded-full z-20 flex items-center justify-center">
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-500 leading-relaxed text-sm">{step.description}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Trust badges */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {trustBadges.map(badge => (
            <div
              key={badge.label}
              className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm text-center hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
            >
              <div className={`w-10 h-10 ${badge.bg} rounded-xl mx-auto mb-3 flex items-center justify-center`}>
                <badge.icon className={`w-5 h-5 ${badge.color}`} />
              </div>
              <p className="text-sm font-bold text-gray-900">{badge.label}</p>
              <p className="text-xs text-gray-400 mt-0.5">{badge.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
