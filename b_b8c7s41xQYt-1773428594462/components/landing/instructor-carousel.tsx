"use client"

import { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Star, MapPin, Award } from "lucide-react"
import Image from "next/image"

const instructors = [
  {
    id: 1,
    name: "Carlos Silva",
    image: "/images/instructor-1.jpg",
    rating: 4.9,
    reviews: 127,
    city: "São Paulo, SP",
    specialty: "Habilitação"
  },
  {
    id: 2,
    name: "Ana Rodrigues",
    image: "/images/instructor-2.jpg",
    rating: 5.0,
    reviews: 98,
    city: "Rio de Janeiro, RJ",
    specialty: "Perder medo de dirigir"
  },
  {
    id: 3,
    name: "Roberto Santos",
    image: "/images/instructor-3.jpg",
    rating: 4.8,
    reviews: 156,
    city: "Belo Horizonte, MG",
    specialty: "Direção defensiva"
  },
  {
    id: 4,
    name: "Mariana Costa",
    image: "/images/instructor-4.jpg",
    rating: 4.9,
    reviews: 89,
    city: "Curitiba, PR",
    specialty: "Habilitação"
  },
  {
    id: 5,
    name: "Fernando Lima",
    image: "/images/instructor-5.jpg",
    rating: 4.7,
    reviews: 203,
    city: "Porto Alegre, RS",
    specialty: "Perder medo de dirigir"
  },
  {
    id: 6,
    name: "Patrícia Oliveira",
    image: "/images/instructor-6.jpg",
    rating: 5.0,
    reviews: 76,
    city: "Salvador, BA",
    specialty: "Direção defensiva"
  }
]

function InstructorCard({ instructor }: { instructor: typeof instructors[0] }) {
  return (
    <div className="flex-shrink-0 w-[300px] bg-card rounded-2xl border border-border p-5 shadow-sm hover:shadow-lg transition-all duration-300 group">
      <div className="relative mb-4">
        <div className="aspect-square rounded-xl overflow-hidden">
          <Image
            src={instructor.image}
            alt={instructor.name}
            width={260}
            height={260}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
        <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm rounded-full px-3 py-1 flex items-center gap-1">
          <Star className="w-4 h-4 text-accent fill-accent" />
          <span className="text-sm font-semibold text-foreground">{instructor.rating}</span>
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <h3 className="font-semibold text-lg text-foreground">{instructor.name}</h3>
          <div className="flex items-center gap-1 text-muted-foreground text-sm">
            <MapPin className="w-4 h-4" />
            <span>{instructor.city}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
            <Award className="w-3 h-3" />
            {instructor.specialty}
          </div>
        </div>

        <div className="flex items-center justify-between pt-2">
          <span className="text-sm text-muted-foreground">{instructor.reviews} avaliações</span>
          <Button size="sm" variant="outline" className="hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors">
            Ver perfil
          </Button>
        </div>
      </div>
    </div>
  )
}

export function InstructorCarousel() {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement) return

    let animationId: number
    let scrollPosition = 0
    const scrollSpeed = 0.5

    const scroll = () => {
      if (!isPaused && scrollElement) {
        scrollPosition += scrollSpeed
        if (scrollPosition >= scrollElement.scrollWidth / 2) {
          scrollPosition = 0
        }
        scrollElement.scrollLeft = scrollPosition
      }
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)

    return () => {
      cancelAnimationFrame(animationId)
    }
  }, [isPaused])

  const allInstructors = [...instructors, ...instructors]

  return (
    <section id="instrutores" className="py-24 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="text-center space-y-4">
          <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
            Instrutores em destaque
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Conheça alguns dos nossos instrutores mais bem avaliados, prontos para te ajudar
          </p>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-6 overflow-hidden px-4"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {allInstructors.map((instructor, index) => (
          <InstructorCard key={`${instructor.id}-${index}`} instructor={instructor} />
        ))}
      </div>
    </section>
  )
}
