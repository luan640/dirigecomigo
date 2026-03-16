"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight } from "lucide-react"

export function FinalCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-primary/80" />
      
      {/* Decorative elements */}
      <div className="absolute inset-0">
        <div className="absolute top-0 left-0 w-96 h-96 bg-white/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center space-y-8">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-tight text-balance">
            Pronto para começar a dirigir com confiança?
          </h2>
          
          <p className="text-lg sm:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed">
            Milhares de pessoas já conquistaram sua liberdade ao volante. Agora é a sua vez.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button 
              size="lg" 
              variant="secondary"
              className="gap-2 text-base px-8 py-6 bg-white text-primary hover:bg-white/90 shadow-xl"
            >
              Encontrar instrutor agora
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>

          <div className="flex items-center justify-center gap-8 pt-8 text-white/70">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">500+</span>
              <span className="text-sm">Instrutores</span>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">10.000+</span>
              <span className="text-sm">Alunos</span>
            </div>
            <div className="w-px h-10 bg-white/20" />
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-white">4.9</span>
              <span className="text-sm">Avaliação</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
