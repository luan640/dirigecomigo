import type { Metadata } from 'next'

import './globals.css'
import { Toaster } from 'sonner'

export const metadata: Metadata = {
  title: {
    default: 'Direcao Facil - Encontre instrutores de direcao em Fortaleza',
    template: '%s | Direcao Facil',
  },
  description:
    'A maior plataforma de instrutores de direcao do Ceara. Encontre o instrutor ideal, agende aulas online e pague com seguranca.',
  keywords: [
    'instrutor de direcao',
    'autoescola',
    'aulas de direcao',
    'Fortaleza',
    'Ceara',
    'CNH',
    'habilitacao',
  ],
  openGraph: {
    title: 'Direcao Facil - Encontre instrutores de direcao em Fortaleza',
    description: 'Conectamos alunos a instrutores certificados em Fortaleza - CE.',
    type: 'website',
    locale: 'pt_BR',
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  )
}
