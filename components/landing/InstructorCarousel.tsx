'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight } from 'lucide-react'
import type { InstructorCard } from '@/types'
import InstructorCardComponent from '@/components/instructors/InstructorCard'

interface InstructorCarouselProps {
  instructors: InstructorCard[]
  title?: string
}

export default function InstructorCarousel({
  instructors,
  title = 'Nossa equipe de especialistas',
}: InstructorCarouselProps) {
  const [paused, setPaused] = useState(false)

  if (instructors.length === 0) return null

  // Duplicate for seamless infinite loop (marqueeLeft keyframe goes -50%)
  const doubled = [...instructors, ...instructors]

  // ~6s per card, minimum 20s
  const duration = Math.max(20, instructors.length * 6)

  return (
    <section
      id="instrutores"
      className="py-24 relative overflow-hidden"
      style={{ background: '#FFFFFF' }}
    >
      {/* Fade edges */}
      <div
        className="absolute left-0 top-36 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to right, #FFFFFF, transparent)' }}
      />
      <div
        className="absolute right-0 top-36 bottom-0 w-24 z-10 pointer-events-none"
        style={{ background: 'linear-gradient(to left, #FFFFFF, transparent)' }}
      />

      <div className="max-w-7xl mx-auto px-6 mb-12">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
          <div>
            <p
              className="mb-2 text-sm font-bold uppercase tracking-widest"
              style={{ color: '#1B5E20' }}
            >
              Excelência no ensino
            </p>
            <h2
              className="text-3xl sm:text-4xl font-black"
              style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
            >
              {title}
            </h2>
          </div>
          <Link
            href="/instrutores"
            className="inline-flex items-center gap-2 font-bold text-sm group flex-shrink-0"
            style={{ color: '#1B5E20' }}
          >
            Ver todos os instrutores
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>

      {/* Infinite scroll strip */}
      <div className="overflow-hidden">
        <div
          className="flex gap-5 px-4"
          style={{
            width: 'max-content',
            animation: `marqueeLeft ${duration}s linear infinite`,
            animationPlayState: paused ? 'paused' : 'running',
            willChange: 'transform',
          }}
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
        >
          {doubled.map((instructor, index) => (
            <div key={`${instructor.id}-${index}`} className="w-72 flex-none">
              <InstructorCardComponent instructor={instructor} />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
