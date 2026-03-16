"use client"

import { Button } from "@/components/ui/button"
import { ArrowRight, CheckCircle } from "lucide-react"
import Image from "next/image"

const benefits = [
  "Receba novos alunos todos os dias",
  "Gerencie sua agenda online",
  "Receba pagamentos com segurança",
  "Aumente sua visibilidade"
]

export function InstructorCTA() {
  return (
    <section id="para-instrutores" className="py-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/10 to-transparent rounded-3xl blur-2xl" />
            <div className="relative rounded-3xl overflow-hidden shadow-2xl">
              <Image
                src="/images/instructor-teaching.jpg"
                alt="Instrutor ensinando aluno"
                width={600}
                height={500}
                className="w-full h-auto object-cover"
              />
            </div>

            {/* Stats card */}
            <div className="absolute -bottom-6 -right-6 bg-card rounded-2xl shadow-xl p-6 border border-border">
              <div className="text-center">
                <p className="text-3xl font-bold text-primary">+2.000</p>
                <p className="text-sm text-muted-foreground">instrutores ativos</p>
              </div>
            </div>
          </div>

          <div className="space-y-8 order-1 lg:order-2">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/20 border border-accent/30">
              <span className="text-sm font-medium text-accent-foreground">Para instrutores</span>
            </div>

            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-foreground leading-tight text-balance">
              É instrutor? Encontre novos alunos todos os dias.
            </h2>

            <p className="text-lg text-muted-foreground leading-relaxed">
              Junte-se à maior plataforma de conexão entre instrutores e alunos do Brasil. 
              Expanda seu alcance, gerencie sua agenda e aumente seus ganhos.
            </p>

            <ul className="space-y-4">
              {benefits.map((benefit, index) => (
                <li key={index} className="flex items-center gap-3">
                  <CheckCircle className="w-5 h-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{benefit}</span>
                </li>
              ))}
            </ul>

            <Button size="lg" className="gap-2 text-base px-8 py-6 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all">
              Cadastrar como instrutor
              <ArrowRight className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  )
}
