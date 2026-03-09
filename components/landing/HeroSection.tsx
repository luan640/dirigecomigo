import Link from 'next/link'
import { Search, Car, ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative min-h-[94vh] flex flex-col justify-center overflow-hidden bg-[#09090B]">
      {/* Animated gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none select-none" aria-hidden="true">
        <div className="absolute -top-24 -left-32 w-[520px] h-[520px] rounded-full bg-violet-600/25 blur-[130px] animate-blob" />
        <div
          className="absolute top-1/3 -right-32 w-[440px] h-[440px] rounded-full bg-teal-500/20 blur-[110px] animate-blob"
          style={{ animationDelay: '2.5s', animationDuration: '10s' }}
        />
        <div
          className="absolute -bottom-10 left-1/3 w-[380px] h-[380px] rounded-full bg-emerald-500/15 blur-[100px] animate-blob"
          style={{ animationDelay: '5s', animationDuration: '13s' }}
        />
        {/* Dot grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-32 text-center">
        {/* Live badge */}
        <div className="inline-flex items-center gap-2.5 bg-white/[0.06] border border-white/[0.08] backdrop-blur-md text-sm font-medium px-5 py-2.5 rounded-full mb-10 text-gray-300 animate-fade-up">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          Instrutores disponíveis agora · Fortaleza - CE
        </div>

        {/* Heading */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-black text-white mb-6 leading-[1.04] tracking-tight animate-fade-up"
          style={{ animationDelay: '80ms' }}
        >
          Aprenda a dirigir<br />
          <span className="gradient-text">com confiança</span>
        </h1>

        <p
          className="text-base sm:text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up"
          style={{ animationDelay: '160ms' }}
        >
          Conectamos você aos melhores instrutores certificados em Fortaleza.
          Agende em minutos, pague com segurança e aprenda no seu ritmo.
        </p>

        {/* CTAs */}
        <div
          className="flex flex-wrap items-center justify-center gap-4 mb-12 animate-fade-up"
          style={{ animationDelay: '240ms' }}
        >
          <Link
            href="/instrutores"
            className="group flex items-center gap-2 px-7 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl text-base transition-all duration-200 shadow-[0_0_40px_rgba(124,58,237,0.45)] hover:shadow-[0_0_60px_rgba(124,58,237,0.65)] hover:-translate-y-0.5"
          >
            <Search className="w-5 h-5" />
            Buscar instrutor
            <ArrowRight className="w-4 h-4 opacity-70 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-200" />
          </Link>
          <Link
            href="/cadastro?role=instructor"
            className="flex items-center gap-2 px-7 py-4 bg-white/[0.06] hover:bg-white/[0.11] text-white font-semibold rounded-2xl text-base transition-all duration-200 border border-white/[0.10] hover:border-white/[0.22] hover:-translate-y-0.5 backdrop-blur-sm"
          >
            <Car className="w-5 h-5" />
            Sou instrutor
          </Link>
        </div>

        {/* Neighborhood quick-links */}
        <div
          className="flex flex-wrap items-center justify-center gap-2 mb-16 animate-fade-up"
          style={{ animationDelay: '320ms' }}
        >
          <span className="text-gray-600 text-xs uppercase tracking-widest mr-1">Bairros:</span>
          {['Aldeota', 'Meireles', 'Cocó', 'Benfica', 'Messejana', 'Fátima'].map(bairro => (
            <Link
              key={bairro}
              href={`/instrutores?neighborhood=${bairro}`}
              className="px-3.5 py-1.5 bg-white/[0.04] hover:bg-white/[0.09] text-sm text-gray-400 hover:text-white rounded-lg transition-colors border border-white/[0.06] hover:border-violet-500/40"
            >
              {bairro}
            </Link>
          ))}
        </div>

        {/* Stats row */}
        <div
          className="grid grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto animate-fade-up"
          style={{ animationDelay: '400ms' }}
        >
          {[
            { value: '500+', label: 'Instrutores' },
            { value: '4.8★', label: 'Avaliação média' },
            { value: '98%', label: 'Taxa de aprovação' },
            { value: '10k+', label: 'Aulas realizadas' },
          ].map(stat => (
            <div
              key={stat.label}
              className="bg-white/[0.04] border border-white/[0.06] rounded-2xl p-4 group hover:bg-white/[0.07] hover:border-violet-500/30 transition-all duration-200 cursor-default"
            >
              <p className="text-2xl font-black text-white group-hover:text-violet-300 transition-colors">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-0.5">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom fade to white sections */}
      <div className="absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-white via-white/60 to-transparent pointer-events-none" />
    </section>
  )
}

