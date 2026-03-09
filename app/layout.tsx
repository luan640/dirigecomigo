import type { Metadata } from "next";
import "./globals.css";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: {
    default: "MeuInstrutor — Encontre instrutores de direção em Fortaleza",
    template: "%s | MeuInstrutor",
  },
  description:
    "A maior plataforma de instrutores de direção do Ceará. Encontre o instrutor ideal, agende aulas online e pague com segurança.",
  keywords: [
    "instrutor de direção",
    "autoescola",
    "aulas de direção",
    "Fortaleza",
    "Ceará",
    "CNH",
    "habilitação",
  ],
  openGraph: {
    title: "MeuInstrutor — Encontre instrutores de direção em Fortaleza",
    description: "Conectamos alunos a instrutores certificados em Fortaleza - CE.",
    type: "website",
    locale: "pt_BR",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className="antialiased">
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
