'use client'

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { InstructorCard } from '@/types'
import InstructorCardComponent from '@/components/instructors/InstructorCard'

interface InstructorCarouselProps {
  instructors: InstructorCard[]
  title?: string
}

export default function InstructorCarousel({
  instructors,
  title = 'Instrutores em destaque',
}: InstructorCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [isPaused, setIsPaused] = useState(false)

  // Duplicate for infinite scroll effect
  const allInstructors = instructors.length > 0 ? [...instructors, ...instructors] : []

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement || allInstructors.length === 0) return

    let animationId: number
    let scrollPosition = 0
    const scrollSpeed = 0.4

    const scroll = () => {
      if (!isPaused && scrollElement) {
        scrollPosition += scrollSpeed
        const half = scrollElement.scrollWidth / 2
        if (scrollPosition >= half) {
          scrollPosition = 0
        }
        scrollElement.scrollLeft = scrollPosition
      }
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(animationId)
  }, [isPaused, allInstructors.length])

  if (instructors.length === 0) return null

  return (
    <section id="instrutores" className="py-24 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900">{title}</h2>
            <p className="mt-2 text-lg text-slate-600 max-w-2xl">
              Conheça alguns dos nossos instrutores mais bem avaliados
            </p>
          </div>
          <Link
            href="/instrutores"
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f5fd7] px-6 py-3 text-sm font-bold text-white transition hover:bg-[#1d70ea] flex-shrink-0"
          >
            Ver todos
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      <div
        ref={scrollRef}
        className="flex gap-5 overflow-hidden px-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        {allInstructors.map((instructor, index) => (
          <div key={`${instructor.id}-${index}`} className="w-72 flex-none">
            <InstructorCardComponent instructor={instructor} />
          </div>
        ))}
      </div>
    </section>
  )
}
