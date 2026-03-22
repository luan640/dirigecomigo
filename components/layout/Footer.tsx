import Link from 'next/link'
import { Facebook, Instagram, Linkedin } from 'lucide-react'

import BrandLogo from '@/components/layout/BrandLogo'

export default function Footer() {
  return (
    <footer style={{ background: '#010804', borderTop: '1px solid rgba(33,166,55,0.12)' }} className="text-white/50">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4">
          <div className="md:col-span-1">
            <Link href="/" className="mb-4 inline-flex items-center">
              <BrandLogo className="h-12 w-auto rounded-md" />
            </Link>
            <p className="mb-4 text-sm leading-relaxed">
              Conectamos alunos a instrutores certificados em Fortaleza e no Ceara. Aprenda a dirigir
              com seguranca e confianca.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(33,166,55,0.1)', border: '1px solid rgba(33,166,55,0.15)' }}
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4 text-green-400" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(33,166,55,0.1)', border: '1px solid rgba(33,166,55,0.15)' }}
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4 text-green-400" />
              </a>
              <a
                href="#"
                className="flex h-9 w-9 items-center justify-center rounded-xl transition-all duration-300 hover:-translate-y-0.5"
                style={{ background: 'rgba(33,166,55,0.1)', border: '1px solid rgba(33,166,55,0.15)' }}
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4 text-green-400" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>Para Alunos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/instrutores" className="transition-colors hover:text-green-400">
                  Buscar instrutores
                </Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="transition-colors hover:text-green-400">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="transition-colors hover:text-green-400">
                  Criar conta gratis
                </Link>
              </li>
              <li>
                <Link href="/aluno/dashboard" className="transition-colors hover:text-green-400">
                  Minhas aulas
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>Para Instrutores</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#seja-instrutor" className="transition-colors hover:text-green-400">
                  Seja parceiro
                </Link>
              </li>
              <li>
                <Link href="/cadastro?role=instructor" className="transition-colors hover:text-green-400">
                  Cadastrar-se
                </Link>
              </li>
              <li>
                <Link href="/painel/dashboard" className="transition-colors hover:text-green-400">
                  Painel do instrutor
                </Link>
              </li>
              <li>
                <Link href="/painel/assinatura" className="transition-colors hover:text-green-400">
                  Assinatura mensal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white" style={{ fontFamily: "'Clash Display', sans-serif" }}>Suporte</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/termos" className="transition-colors hover:text-green-400">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="transition-colors hover:text-green-400">
                  Politica de privacidade
                </Link>
              </li>
              <li>
                <a href="mailto:contato@meuinstrutor.com.br" className="transition-colors hover:text-green-400">
                  contato@meuinstrutor.com.br
                </a>
              </li>
              <li>
                <a href="https://wa.me/5585999999999" className="transition-colors hover:text-green-400">
                  WhatsApp (85) 9 9999-9999
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-8" style={{ borderColor: 'rgba(255,255,255,0.06)' }} />

        <div className="flex flex-col items-center justify-between gap-4 text-sm md:flex-row">
          <p>
            Copyright {new Date().getFullYear()} DirecaoFacil. Todos os direitos reservados.
            Fortaleza e região metropolitana.
          </p>
          {/* <p className="text-xs text-gray-600">
            Plataforma em modo demonstracao - dados ficticios para fins de apresentacao
          </p> */}
        </div>
      </div>
    </footer>
  )
}
