import Link from 'next/link'
import { Car, Instagram, Facebook, Linkedin } from 'lucide-react'

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-violet-600 rounded-lg flex items-center justify-center">
                <Car className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold text-white">
                Meu<span className="text-violet-400">Instrutor</span>
              </span>
            </Link>
            <p className="text-sm leading-relaxed mb-4">
              Conectamos alunos a instrutores certificados em Fortaleza e no Ceará. Aprenda a dirigir
              com segurança e confiança.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-violet-600 transition-colors"
                aria-label="Instagram"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-violet-600 transition-colors"
                aria-label="Facebook"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 bg-gray-800 rounded-lg flex items-center justify-center hover:bg-violet-600 transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Para Alunos */}
          <div>
            <h3 className="text-white font-semibold mb-4">Para Alunos</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/instrutores" className="hover:text-white transition-colors">
                  Buscar instrutores
                </Link>
              </li>
              <li>
                <Link href="/#como-funciona" className="hover:text-white transition-colors">
                  Como funciona
                </Link>
              </li>
              <li>
                <Link href="/cadastro" className="hover:text-white transition-colors">
                  Criar conta grátis
                </Link>
              </li>
              <li>
                <Link href="/aluno/dashboard" className="hover:text-white transition-colors">
                  Minhas aulas
                </Link>
              </li>
            </ul>
          </div>

          {/* Para Instrutores */}
          <div>
            <h3 className="text-white font-semibold mb-4">Para Instrutores</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/#seja-instrutor" className="hover:text-white transition-colors">
                  Seja parceiro
                </Link>
              </li>
              <li>
                <Link href="/cadastro?role=instructor" className="hover:text-white transition-colors">
                  Cadastrar-se
                </Link>
              </li>
              <li>
                <Link href="/painel/dashboard" className="hover:text-white transition-colors">
                  Painel do instrutor
                </Link>
              </li>
              <li>
                <Link href="/painel/assinatura" className="hover:text-white transition-colors">
                  Assinatura mensal
                </Link>
              </li>
            </ul>
          </div>

          {/* Suporte */}
          <div>
            <h3 className="text-white font-semibold mb-4">Suporte</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link href="/termos" className="hover:text-white transition-colors">
                  Termos de uso
                </Link>
              </li>
              <li>
                <Link href="/privacidade" className="hover:text-white transition-colors">
                  Política de privacidade
                </Link>
              </li>
              <li>
                <a href="mailto:contato@meuinstrutor.com.br" className="hover:text-white transition-colors">
                  contato@meuinstrutor.com.br
                </a>
              </li>
              <li>
                <a href="https://wa.me/5585999999999" className="hover:text-white transition-colors">
                  WhatsApp (85) 9 9999-9999
                </a>
              </li>
            </ul>
          </div>
        </div>

        <hr className="border-gray-800 my-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sm">
          <p>
            © {new Date().getFullYear()} MeuInstrutor. Todos os direitos reservados. Fortaleza - CE,
            Brasil.
          </p>
          <p className="text-gray-600 text-xs">
            Plataforma em modo demonstração — dados fictícios para fins de apresentação
          </p>
        </div>
      </div>
    </footer>
  )
}
