import Link from 'next/link'
import { Facebook, Instagram, Linkedin } from 'lucide-react'

import BrandLogo from '@/components/layout/BrandLogo'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
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
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 transition-colors hover:bg-violet-600"
                aria-label="Instagram"
              >
                <Instagram className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 transition-colors hover:bg-violet-600"
                aria-label="Facebook"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href="#"
                className="flex h-8 w-8 items-center justify-center rounded-lg bg-gray-800 transition-colors hover:bg-violet-600"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Para Alunos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/instrutores" className="transition-colors hover:text-white">
                  Buscar instrutores
                </Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="transition-colors hover:text-white">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="transition-colors hover:text-white">
                  Criar conta gratis
                </Link>
              </li>
              <li>
                <Link href="/aluno/dashboard" className="transition-colors hover:text-white">
                  Minhas aulas
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Para Instrutores</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#seja-instrutor" className="transition-colors hover:text-white">
                  Seja parceiro
                </Link>
              </li>
              <li>
                <Link href="/cadastro?role=instructor" className="transition-colors hover:text-white">
                  Cadastrar-se
                </Link>
              </li>
              <li>
                <Link href="/painel/dashboard" className="transition-colors hover:text-white">
                  Painel do instrutor
                </Link>
              </li>
              <li>
                <Link href="/painel/assinatura" className="transition-colors hover:text-white">
                  Assinatura mensal
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="mb-4 font-semibold text-white">Suporte</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/termos" className="transition-colors hover:text-white">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="transition-colors hover:text-white">
                  Politica de privacidade
                </Link>
              </li>
              <li>
                <a href="mailto:contato@meuinstrutor.com.br" className="transition-colors hover:text-white">
                  contato@meuinstrutor.com.br
                </a>
              </li>
              <li>
                <a href="https://wa.me/5585999999999" className="transition-colors hover:text-white">
                  WhatsApp (85) 9 9999-9999
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="my-8 border-gray-800" />

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
