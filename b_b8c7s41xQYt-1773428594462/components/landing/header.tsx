"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Menu, X } from "lucide-react"
import Link from "next/link"

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">D</span>
            </div>
            <span className="font-bold text-xl text-foreground">Dirija Fácil</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Como funciona
            </Link>
            <Link href="#instrutores" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Instrutores
            </Link>
            <Link href="#beneficios" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Benefícios
            </Link>
            <Link href="#para-instrutores" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Para instrutores
            </Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Button variant="ghost" size="sm">
              Entrar
            </Button>
            <Button size="sm">
              Cadastrar
            </Button>
          </div>

          <button
            className="md:hidden p-2"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMenuOpen && (
        <div className="md:hidden bg-background border-b border-border">
          <nav className="flex flex-col px-4 py-4 gap-4">
            <Link href="#como-funciona" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Como funciona
            </Link>
            <Link href="#instrutores" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Instrutores
            </Link>
            <Link href="#beneficios" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Benefícios
            </Link>
            <Link href="#para-instrutores" className="text-muted-foreground hover:text-foreground transition-colors text-sm font-medium">
              Para instrutores
            </Link>
            <div className="flex flex-col gap-2 pt-4 border-t border-border">
              <Button variant="ghost" size="sm" className="justify-start">
                Entrar
              </Button>
              <Button size="sm">
                Cadastrar
              </Button>
            </div>
          </nav>
        </div>
      )}
    </header>
  )
}
