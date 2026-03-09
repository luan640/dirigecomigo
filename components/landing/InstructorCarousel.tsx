'use client'

import { useRef } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
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

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return
    const cardWidth = 320 // approximate card width + gap
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -cardWidth * 2 : cardWidth * 2,
      behavior: 'smooth',
    })
  }

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-extrabold text-gray-900">{title}</h2>
            <p className="text-gray-500 mt-1">Instrutores verificados em Fortaleza - CE</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-violet-300 transition-colors"
              aria-label="Anterior"
            >
              <ChevronLeft className="w-5 h-5 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-50 hover:border-violet-300 transition-colors"
              aria-label="Próximo"
            >
              <ChevronRight className="w-5 h-5 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Scrollable cards */}
        <div
          ref={scrollRef}
          className="flex gap-4 overflow-x-auto pb-4 snap-x scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {instructors.map(instructor => (
            <div
              key={instructor.id}
              className="flex-none w-72 snap-start"
            >
              <InstructorCardComponent instructor={instructor} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
