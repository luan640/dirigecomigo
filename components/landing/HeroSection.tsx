import Link from 'next/link'
import { Search, Car, ArrowRight } from 'lucide-react'

export default function HeroSection() {
  return (
    <section className="relative flex min-h-[94vh] flex-col justify-center overflow-hidden bg-[linear-gradient(160deg,#03122f_0%,#041f4b_52%,#0b3163_100%)]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden select-none" aria-hidden="true">
        <div className="absolute -left-32 -top-24 h-[520px] w-[520px] animate-blob rounded-full bg-[rgba(255,107,0,0.22)] blur-[130px]" />
        <div
          className="absolute -right-32 top-1/3 h-[440px] w-[440px] animate-blob rounded-full bg-[rgba(246,196,0,0.16)] blur-[110px]"
          style={{ animationDelay: '2.5s', animationDuration: '10s' }}
        />
        <div
          className="absolute -bottom-10 left-1/3 h-[380px] w-[380px] animate-blob rounded-full bg-[rgba(23,180,74,0.16)] blur-[100px]"
          style={{ animationDelay: '5s', animationDuration: '13s' }}
        />
        <div
          className="absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-5xl px-4 py-24 text-center sm:px-6 md:py-32 lg:px-8">
        <div className="animate-fade-up mb-10 inline-flex items-center gap-2.5 rounded-full border border-white/[0.08] bg-white/[0.06] px-5 py-2.5 text-sm font-medium text-gray-200 backdrop-blur-md">
          <span className="relative flex h-2 w-2">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[var(--brand-green)] opacity-75" />
            <span className="relative inline-flex h-2 w-2 rounded-full bg-[var(--brand-green)]" />
          </span>
          Instrutores disponíveis agora · Fortaleza e região metropolitana
        </div>

        <h1
          className="animate-fade-up mb-6 text-5xl font-black leading-[1.04] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-[5.5rem]"
          style={{ animationDelay: '80ms' }}
        >
          Aprenda a dirigir
          <br />
          <span className="gradient-text">com confiança</span>
        </h1>

        <p
          className="animate-fade-up mx-auto mb-10 max-w-xl text-base leading-relaxed text-gray-300 sm:text-lg md:text-xl"
          style={{ animationDelay: '160ms' }}
        >
          Conectamos você aos melhores instrutores certificados em Fortaleza.
          Agende em minutos, pague com segurançaa e aprenda no seu ritmo.
        </p>

        <div
          className="animate-fade-up mb-12 flex flex-wrap items-center justify-center gap-4"
          style={{ animationDelay: '240ms' }}
        >
          <Link
            href="/instrutores"
            className="group flex items-center gap-2 rounded-2xl bg-[var(--brand-orange)] px-7 py-4 text-base font-bold text-white shadow-[0_0_40px_rgba(255,107,0,0.35)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff7d1f] hover:shadow-[0_0_60px_rgba(255,107,0,0.5)]"
          >
            <Search className="h-5 w-5" />
            Buscar instrutor
            <ArrowRight className="h-4 w-4 opacity-70 transition-all duration-200 group-hover:translate-x-1 group-hover:opacity-100" />
          </Link>
          <Link
            href="/cadastro?role=instructor"
            className="flex items-center gap-2 rounded-2xl border border-[rgba(246,196,0,0.22)] bg-white/[0.06] px-7 py-4 text-base font-semibold text-white backdrop-blur-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-[rgba(246,196,0,0.45)] hover:bg-white/[0.11]"
          >
            <Car className="h-5 w-5" />
            Sou instrutor
          </Link>
        </div>

        <div
          className="animate-fade-up mb-16 flex flex-wrap items-center justify-center gap-2"
          style={{ animationDelay: '320ms' }}
        >
          {/* <span className="mr-1 text-xs uppercase tracking-widest text-gray-500">Bairros:</span>
          {['Aldeota', 'Meireles', 'Coco', 'Benfica', 'Messejana', 'Fatima'].map(bairro => (
            <Link
              key={bairro}
              href={`/instrutores?neighborhood=${bairro}`}
              className="rounded-lg border border-white/[0.06] bg-white/[0.04] px-3.5 py-1.5 text-sm text-gray-300 transition-colors hover:border-[rgba(246,196,0,0.42)] hover:bg-white/[0.09] hover:text-white"
            >
              {bairro}
            </Link>
          ))} */}
        </div>

        <div
          className="animate-fade-up mx-auto grid max-w-2xl grid-cols-2 gap-3 md:grid-cols-4"
          style={{ animationDelay: '400ms' }}
        >
          {[
            { value: '5+', label: 'Instrutores' },
            { value: '40+', label: 'Aprenderam a dirigir' },
            { value: '98%', label: 'Taxa de aprovação Detran' },
            { value: '50+', label: 'Aulas realizadas' },
          ].map(stat => (
            <div
              key={stat.label}
              className="group cursor-default rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4 transition-all duration-200 hover:border-[rgba(246,196,0,0.28)] hover:bg-white/[0.07]"
            >
              <p className="text-2xl font-black text-white transition-colors group-hover:text-[var(--brand-yellow)]">
                {stat.value}
              </p>
              <p className="mt-0.5 text-xs text-gray-500">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 right-0 h-44 bg-gradient-to-t from-white via-white/60 to-transparent" />
    </section>
  )
}
