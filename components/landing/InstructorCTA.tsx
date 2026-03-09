import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { PLATFORM_CONFIG } from '@/constants/pricing'
import { formatCurrency } from '@/utils/format'

export default function InstructorCTA() {
  const benefits = [
    'Apareça para centenas de alunos em busca de instrutor',
    'Gerencie sua agenda de forma simples e intuitiva',
    'Receba pagamentos com segurança direto no app',
    'Histórico completo de aulas e faturamento',
    'Perfil público com avaliações verificadas',
    'Suporte dedicado para instrutores parceiros',
  ]

  return (
    <section id="seja-instrutor" className="py-24 bg-[#09090B] relative overflow-hidden">
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-violet-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-teal-500/10 rounded-full blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-center">
          {/* Left */}
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-violet-400 uppercase tracking-[0.18em] bg-violet-500/10 border border-violet-500/20 px-4 py-1.5 rounded-full mb-5">
              <Sparkles className="w-3.5 h-3.5" />
              Para instrutores
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-white mb-5 leading-tight">
              Expanda seus alunos com o{' '}
              <span className="gradient-text">Direcao Facil</span>
            </h2>
            <p className="text-gray-400 text-lg leading-relaxed mb-8">
              Cadastre-se como instrutor parceiro e conecte-se com alunos prontos para aprender a
              dirigir em Fortaleza. Por apenas{' '}
              <strong className="text-white">{formatCurrency(PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE)}/mês</strong>,
              tenha acesso completo à plataforma.
            </p>

            <ul className="space-y-3 mb-8">
              {benefits.map(benefit => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-400 text-sm">{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro?role=instructor"
              className="group inline-flex items-center gap-2 px-7 py-4 bg-violet-600 hover:bg-violet-500 text-white font-bold rounded-2xl transition-all duration-200 shadow-[0_0_40px_rgba(124,58,237,0.35)] hover:shadow-[0_0_60px_rgba(124,58,237,0.55)] hover:-translate-y-0.5"
            >
              Cadastrar meu perfil
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Right — pricing card */}
          <div className="flex justify-center">
            <div className="bg-white text-gray-900 rounded-3xl p-8 max-w-sm w-full shadow-2xl relative overflow-hidden">
              {/* Card top accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-violet-500 via-teal-400 to-emerald-400 rounded-t-3xl" />

              <div className="text-center mb-6 pt-2">
                <p className="text-sm font-medium text-gray-500 mb-2">Assinatura mensal</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-black text-violet-600">R$15</span>
                  <span className="text-gray-400 mb-1.5">/mês</span>
                </div>
                <p className="text-xs text-gray-400 mt-2">Cancele quando quiser</p>
              </div>

              <div className="bg-violet-50 rounded-2xl p-4 mb-6">
                <p className="text-sm font-bold text-violet-900 mb-2">Simulação por aula</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valor da aula</span>
                  <span className="font-semibold">R$100</span>
                </div>
                <div className="flex items-center justify-between text-sm mt-1.5">
                  <span className="text-gray-600">Taxa da plataforma (8%)</span>
                  <span className="text-red-500 font-semibold">- R$8</span>
                </div>
                <div className="border-t border-violet-200 mt-2.5 pt-2.5 flex items-center justify-between">
                  <span className="text-sm font-bold text-gray-900">Você recebe</span>
                  <span className="font-black text-emerald-600 text-lg">R$92</span>
                </div>
              </div>

              <Link
                href="/cadastro?role=instructor"
                className="block w-full text-center px-4 py-3.5 bg-violet-600 hover:bg-violet-700 text-white font-bold rounded-xl transition-colors"
              >
                Começar agora
              </Link>

              <p className="text-center text-xs text-gray-400 mt-3">
                Sem taxa de cadastro · 7 dias grátis para testar
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
