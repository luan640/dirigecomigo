import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, Star } from 'lucide-react'
import drivingImage from '@/components/img/art-markiv-zAm1sdicGXc-unsplash.jpg'

export default function HeroSection() {
  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden bg-white">
      {/* Background decorative blobs */}
      <div className="absolute inset-0 -z-10 pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
        <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Text side */}
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0f5fd7]/10 border border-[#0f5fd7]/20">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#0f5fd7] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#0f5fd7]" />
              </span>
              <span className="text-sm font-medium text-[#0f5fd7]">Instrutores disponíveis agora em Fortaleza</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-900 leading-tight">
              Aprenda a dirigir com{' '}
              <span className="text-[#0f5fd7]">confiança.</span>
            </h1>

            <p className="text-lg sm:text-xl text-slate-600 max-w-lg leading-relaxed">
              Conectamos você aos melhores instrutores certificados para perder o medo de dirigir ou conquistar sua habilitação com segurança.
            </p>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/instrutores"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#0f5fd7] px-8 py-4 text-base font-bold text-white shadow-lg shadow-[#0f5fd7]/25 transition-all hover:bg-[#1d70ea] hover:shadow-xl hover:-translate-y-0.5"
              >
                Encontrar um instrutor
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link
                href="/cadastro?role=instructor"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-8 py-4 text-base font-bold text-slate-700 transition-all hover:bg-slate-50 hover:-translate-y-0.5"
              >
                Quero ser instrutor
              </Link>
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-6 pt-2">
              <div className="flex -space-x-2">
                {['men/32', 'women/44', 'men/67', 'women/28'].map((path) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={path}
                    src={`https://randomuser.me/api/portraits/${path}.jpg`}
                    alt="Aluno"
                    className="w-10 h-10 rounded-full border-2 border-white object-cover"
                  />
                ))}
              </div>
              <div>
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star key={s} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-sm text-slate-500 mt-0.5">4.9 · mais de 2.000 avaliações</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 pt-2">
              {[
                { value: '500+', label: 'Instrutores' },
                { value: '98%', label: 'Aprovação' },
                { value: '10k+', label: 'Aulas realizadas' },
              ].map((stat) => (
                <div key={stat.label} className="text-center rounded-2xl border border-slate-100 bg-slate-50 p-4">
                  <p className="text-2xl font-black text-[#0f5fd7]">{stat.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{stat.label}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Image side */}
          <div className="relative hidden lg:block">
            <div className="relative aspect-square max-w-lg mx-auto">
              {/* Decorative glow */}
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-[#0f5fd7]/20 via-amber-400/10 to-transparent blur-2xl scale-110" />

              <div className="relative rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src={drivingImage}
                  alt="Instrutor ensinando aluno a dirigir"
                  width={600}
                  height={600}
                  className="w-full h-full object-cover"
                  priority
                />
              </div>

              {/* Floating card — Aula confirmada */}
              <div className="absolute -left-6 top-1/4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">Aula confirmada</p>
                    <p className="text-xs text-slate-500">Amanhã às 14h</p>
                  </div>
                </div>
              </div>

              {/* Floating card — +50 horas */}
              <div className="absolute -right-6 bottom-1/4 bg-white rounded-2xl shadow-xl p-4 border border-slate-100">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                    <svg className="w-5 h-5 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-semibold text-slate-900 text-sm">+50 horas</p>
                    <p className="text-xs text-slate-500">de aulas este mês</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
