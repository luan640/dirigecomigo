import Link from 'next/link'
import { ArrowRight, CheckCircle2, Sparkles } from 'lucide-react'
import { PLATFORM_CONFIG } from '@/constants/pricing'
import { formatCurrency } from '@/utils/format'

export default function InstructorCTA() {
  const benefits = [
    'Apareca para centenas de alunos em busca de instrutor',
    'Gerencie sua agenda de forma simples e intuitiva',
    'Receba pagamentos com seguranca direto no app',
    'Historico completo de aulas e faturamento',
    'Perfil publico com avaliacoes verificadas',
    'Suporte dedicado para instrutores parceiros',
  ]

  return (
    <section
      id="seja-instrutor"
      className="relative overflow-hidden bg-[linear-gradient(160deg,#03122f_0%,#041f4b_52%,#0b3163_100%)] py-24"
    >
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-[rgba(255,107,0,0.12)] blur-[120px]" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-[rgba(23,180,74,0.12)] blur-[100px]" />
        <div
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-2">
          <div>
            <span className="mb-5 inline-flex items-center gap-1.5 rounded-full border border-[rgba(246,196,0,0.2)] bg-[rgba(246,196,0,0.1)] px-4 py-1.5 text-xs font-bold uppercase tracking-[0.18em] text-[var(--brand-yellow)]">
              <Sparkles className="h-3.5 w-3.5" />
              Para instrutores
            </span>
            <h2 className="mb-5 text-3xl font-black leading-tight text-white md:text-4xl">
              Expanda seus alunos com o <span className="gradient-text">DirecaoFacil</span>
            </h2>
            <p className="mb-8 text-lg leading-relaxed text-gray-300">
              Cadastre-se como instrutor parceiro e conecte-se com alunos prontos para aprender a
              dirigir em Fortaleza. Por apenas{' '}
              <strong className="text-white">
                {formatCurrency(PLATFORM_CONFIG.INSTRUCTOR_SUBSCRIPTION_PRICE)}/mes
              </strong>
              , tenha acesso completo a plataforma.
            </p>

            <ul className="mb-8 space-y-3">
              {benefits.map(benefit => (
                <li key={benefit} className="flex items-start gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-[var(--brand-green)]" />
                  <span className="text-sm text-gray-300">{benefit}</span>
                </li>
              ))}
            </ul>

            <Link
              href="/cadastro?role=instructor"
              className="group inline-flex items-center gap-2 rounded-2xl bg-[var(--brand-orange)] px-7 py-4 font-bold text-white shadow-[0_0_40px_rgba(255,107,0,0.32)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-[#ff7d1f] hover:shadow-[0_0_60px_rgba(255,107,0,0.5)]"
            >
              Cadastrar meu perfil
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
          </div>

          <div className="flex justify-center">
            <div className="relative w-full max-w-sm overflow-hidden rounded-3xl bg-white p-8 text-gray-900 shadow-2xl">
              <div className="absolute left-0 right-0 top-0 h-1 rounded-t-3xl bg-gradient-to-r from-[var(--brand-orange)] via-[var(--brand-yellow)] to-[var(--brand-green)]" />

              <div className="mb-6 pt-2 text-center">
                <p className="mb-2 text-sm font-medium text-gray-500">Assinatura mensal</p>
                <div className="flex items-end justify-center gap-1">
                  <span className="text-5xl font-black text-[var(--brand-orange)]">R$15</span>
                  <span className="mb-1.5 text-gray-400">/mes</span>
                </div>
                <p className="mt-2 text-xs text-gray-400">Cancele quando quiser</p>
              </div>

              <div className="mb-6 rounded-2xl bg-[#fff7db] p-4">
                <p className="mb-2 text-sm font-bold text-[var(--brand-navy)]">Simulacao por aula</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Valor da aula</span>
                  <span className="font-semibold">R$100</span>
                </div>
                <div className="mt-1.5 flex items-center justify-between text-sm">
                  <span className="text-gray-600">Taxa da plataforma (8%)</span>
                  <span className="font-semibold text-red-500">- R$8</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between border-t border-[#f3df8b] pt-2.5">
                  <span className="text-sm font-bold text-gray-900">Voce recebe</span>
                  <span className="text-lg font-black text-[var(--brand-green)]">R$92</span>
                </div>
              </div>

              <Link
                href="/cadastro?role=instructor"
                className="block w-full rounded-xl bg-[var(--brand-orange)] px-4 py-3.5 text-center font-bold text-white transition-colors hover:bg-[#e45f00]"
              >
                Comecar agora
              </Link>

              <p className="mt-3 text-center text-xs text-gray-400">
                Sem taxa de cadastro · 7 dias gratis para testar
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
