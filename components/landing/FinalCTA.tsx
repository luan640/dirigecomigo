import Link from 'next/link'
import { ArrowRight } from 'lucide-react'

export default function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden bg-[linear-gradient(135deg,#091733_0%,#0f2d6b_100%)]">
      {/* Decorative blobs */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-amber-400/15 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight">
            Pronto para começar a dirigir com confiança?
          </h2>

          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Milhares de pessoas já conquistaram sua liberdade ao volante. Agora é a sua vez.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Link
              href="/instrutores"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-8 py-4 text-base font-bold text-[#0f5fd7] shadow-xl transition hover:bg-white/90 hover:-translate-y-0.5"
            >
              Encontrar instrutor agora
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/cadastro?role=instructor"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 bg-white/10 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white/20 hover:-translate-y-0.5"
            >
              Cadastrar como instrutor
            </Link>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-white/60">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-white">500+</span>
              <span className="text-sm">Instrutores</span>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-white">10.000+</span>
              <span className="text-sm">Alunos</span>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-black text-white">4.9</span>
              <span className="text-sm">Avaliação</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
