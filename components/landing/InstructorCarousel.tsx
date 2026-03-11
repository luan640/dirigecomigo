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
  title = 'Instrutores',
}: InstructorCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)

  function scroll(direction: 'left' | 'right') {
    if (!scrollRef.current) return
    const cardWidth = 320
    scrollRef.current.scrollBy({
      left: direction === 'left' ? -cardWidth * 2 : cardWidth * 2,
      behavior: 'smooth',
    })
  }

  return (
    <section className="bg-white py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-gray-900 md:text-3xl">{title}</h2>
            <p className="mt-1 text-gray-500">Instrutores parceiros</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => scroll('left')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-violet-300 hover:bg-gray-50"
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5 text-gray-600" />
            </button>
            <button
              onClick={() => scroll('right')}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-gray-200 transition-colors hover:border-violet-300 hover:bg-gray-50"
              aria-label="Proximo"
            >
              <ChevronRight className="h-5 w-5 text-gray-600" />
            </button>
          </div>
        </div>

        <div
          ref={scrollRef}
          className="flex snap-x gap-4 overflow-x-auto pb-4 scroll-smooth"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {instructors.map((instructor) => (
            <div key={instructor.id} className="w-72 flex-none snap-start">
              <InstructorCardComponent instructor={instructor} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
