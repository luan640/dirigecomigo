"use client"

import { useEffect, useRef, useState } from "react"
import { Search, Calendar, Car } from "lucide-react"

const steps = [
  {
    number: "01",
    icon: Search,
    title: "Escolha um instrutor",
    description: "Navegue pelos perfis, veja avaliações e encontre o instrutor ideal para você."
  },
  {
    number: "02",
    icon: Calendar,
    title: "Agende sua aula",
    description: "Escolha o melhor dia e horário disponível na agenda do instrutor."
  },
  {
    number: "03",
    icon: Car,
    title: "Comece a dirigir com confiança",
    description: "Realize suas aulas práticas e evolua até alcançar seus objetivos."
  }
]

export function HowItWorks() {
  const [visibleSteps, setVisibleSteps] = useState<number[]>([])
  const sectionRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          steps.forEach((_, index) => {
            setTimeout(() => {
              setVisibleSteps((prev) => [...prev, index])
            }, index * 200)
          })
        }
      },
      { threshold: 0.2 }
    )

    if (sectionRef.current) {
      observer.observe(sectionRef.current)
    }

    return () => observer.disconnect()
  }, [])

  return (
    <section id="como-funciona" className="py-24 bg-muted/30" ref={sectionRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Começar é simples
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Em apenas três passos você está pronto para suas aulas de direção
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => {
            const Icon = step.icon
            const isVisible = visibleSteps.includes(index)

            return (
              <div
                key={index}
                className={`relative transition-all duration-500 ${
                  isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
                }`}
              >
                {/* Connector line */}
                {index < steps.length - 1 && (
                  <div className="hidden md:block absolute top-20 left-1/2 w-full h-0.5 bg-border">
                    <div 
                      className={`h-full bg-primary transition-all duration-700 delay-300 ${
                        isVisible ? "w-full" : "w-0"
                      }`}
                    />
                  </div>
                )}

                <div className="relative bg-card rounded-2xl border border-border p-8 text-center hover:shadow-lg transition-shadow">
                  {/* Step number */}
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-bold">
                    {step.number}
                  </div>

                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6 mt-4">
                    <Icon className="w-8 h-8 text-primary" />
                  </div>

                  <h3 className="text-xl font-semibold text-foreground mb-3">{step.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
