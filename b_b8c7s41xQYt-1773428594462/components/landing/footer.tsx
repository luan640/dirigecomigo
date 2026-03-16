import Link from "next/link"
import { Facebook, Instagram, Twitter, Youtube } from "lucide-react"

const footerLinks = {
  plataforma: [
    { label: "Sobre nós", href: "#" },
    { label: "Como funciona", href: "#como-funciona" },
    { label: "Preços", href: "#" },
    { label: "FAQ", href: "#" }
  ],
  paraAlunos: [
    { label: "Encontrar instrutor", href: "#" },
    { label: "Como agendar", href: "#" },
    { label: "Perder medo de dirigir", href: "#" },
    { label: "Tirar habilitação", href: "#" }
  ],
  paraInstrutores: [
    { label: "Cadastrar-se", href: "#" },
    { label: "Como funciona", href: "#" },
    { label: "Benefícios", href: "#" },
    { label: "Termos de uso", href: "#" }
  ],
  contato: [
    { label: "Suporte", href: "#" },
    { label: "Fale conosco", href: "#" },
    { label: "Parcerias", href: "#" },
    { label: "Imprensa", href: "#" }
  ]
}

const socialLinks = [
  { icon: Facebook, href: "#", label: "Facebook" },
  { icon: Instagram, href: "#", label: "Instagram" },
  { icon: Twitter, href: "#", label: "Twitter" },
  { icon: Youtube, href: "#", label: "Youtube" }
]

export function Footer() {
  return (
    <footer className="bg-foreground text-background pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-background/10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">D</span>
              </div>
              <span className="font-bold text-xl text-background">Dirija Fácil</span>
            </Link>
            <p className="text-background/60 text-sm leading-relaxed">
              Conectando alunos aos melhores instrutores de direção do Brasil.
            </p>
          </div>

          {/* Platform */}
          <div>
            <h3 className="font-semibold text-background mb-4">Plataforma</h3>
            <ul className="space-y-3">
              {footerLinks.plataforma.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-background/60 hover:text-background transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Students */}
          <div>
            <h3 className="font-semibold text-background mb-4">Para alunos</h3>
            <ul className="space-y-3">
              {footerLinks.paraAlunos.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-background/60 hover:text-background transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Instructors */}
          <div>
            <h3 className="font-semibold text-background mb-4">Para instrutores</h3>
            <ul className="space-y-3">
              {footerLinks.paraInstrutores.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-background/60 hover:text-background transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-semibold text-background mb-4">Contato</h3>
            <ul className="space-y-3">
              {footerLinks.contato.map((link) => (
                <li key={link.label}>
                  <Link href={link.href} className="text-background/60 hover:text-background transition-colors text-sm">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8">
          <p className="text-background/60 text-sm">
            © 2026 Dirija Fácil. Todos os direitos reservados.
          </p>

          <div className="flex items-center gap-4">
            {socialLinks.map((social) => {
              const Icon = social.icon
              return (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                  aria-label={social.label}
                >
                  <Icon className="w-5 h-5 text-background/80" />
                </Link>
              )
            })}
          </div>
        </div>
      </div>
    </footer>
  )
}
