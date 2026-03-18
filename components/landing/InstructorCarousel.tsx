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

  const allInstructors = instructors.length > 0 ? [...instructors, ...instructors] : []

  useEffect(() => {
    const scrollElement = scrollRef.current
    if (!scrollElement || allInstructors.length === 0) return

    let animationId: number
    let scrollPosition = 0
    const scrollSpeed = 0.5

    const scroll = () => {
      if (!isPaused && scrollElement) {
        scrollPosition += scrollSpeed
        const half = scrollElement.scrollWidth / 2
        if (scrollPosition >= half) scrollPosition = 0
        scrollElement.scrollLeft = scrollPosition
      }
      animationId = requestAnimationFrame(scroll)
    }

    animationId = requestAnimationFrame(scroll)
    return () => cancelAnimationFrame(animationId)
  }, [isPaused, allInstructors.length])

  if (instructors.length === 0) return null

  return (
    <section
      id="instrutores"
      className="py-24 relative overflow-hidden"
      style={{ background: 'var(--land-surface)' }}
    >
      {/* Top border glow */}
      <div className="absolute top-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(33,166,55,0.3), transparent)' }} />
      <div className="absolute bottom-0 left-0 right-0 h-px pointer-events-none"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(33,166,55,0.2), transparent)' }} />

      {/* Left/right carousel fade */}
      <div className="absolute left-0 top-32 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, var(--land-surface), transparent)' }} />
      <div className="absolute right-0 top-32 bottom-0 w-20 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, var(--land-surface), transparent)' }} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-12 relative z-10">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <span className="mb-3 inline-block text-xs font-bold uppercase tracking-widest px-4 py-1.5 rounded-full"
              style={{ background: 'rgba(33,166,55,0.1)', color: '#21a637', border: '1px solid rgba(33,166,55,0.25)' }}>
              Já na plataforma
            </span>
            <h2
              className="text-3xl sm:text-4xl font-black text-white"
              style={{ fontFamily: "'Syne', sans-serif" }}
            >
              {title}
            </h2>
            <p className="mt-2 text-base" style={{ color: 'var(--land-muted)' }}>
              Conheça alguns dos nossos instrutores mais bem avaliados
            </p>
          </div>
          <Link
            href="/instrutores"
            className="inline-flex items-center gap-2 rounded-2xl px-6 py-3 text-sm font-bold text-black transition-all duration-300 hover:-translate-y-0.5 flex-shrink-0"
            style={{
              background: 'linear-gradient(135deg, #f6c400, #e6b800)',
              boxShadow: '0 0 20px rgba(246,196,0,0.3)',
            }}
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
