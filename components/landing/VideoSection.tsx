'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'
import { ArrowRight } from 'lucide-react'

export default function VideoSection() {
  const [visible, setVisible] = useState(false)
  const ref = useRef<HTMLElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true) },
      { threshold: 0.2 }
    )
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [])

  return (
    <section
      ref={ref}
      className="relative overflow-hidden"
      style={{ minHeight: '480px' }}
    >
      {/* Video */}
      <video
        autoPlay
        muted
        loop
        playsInline
        className="absolute inset-0 w-full h-full object-cover"
        poster="/images/landing/preparacao-exame.jpg"
      >
        <source src="/videos/descobrir.mp4" type="video/mp4" />
      </video>

      {/* Overlay */}
      <div
        className="absolute inset-0"
        style={{ background: 'linear-gradient(to right, rgba(0,40,25,0.85) 0%, rgba(0,40,25,0.5) 60%, rgba(0,40,25,0.2) 100%)' }}
      />

      {/* Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 py-24 flex items-center min-h-[480px]">
        <div
          className="max-w-xl text-white space-y-6 transition-all duration-1000"
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? 'translateY(0)' : 'translateY(40px)',
          }}
        >
          <h2
            className="text-4xl md:text-6xl font-black leading-tight"
            style={{ fontFamily: "'Clash Display', sans-serif" }}
          >
            Descubra o mundo{' '}
            <span style={{ color: '#F9A800' }}>da direção</span>
          </h2>
          <p className="text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.8)' }}>
            Cada aula é uma nova conquista. Com o instrutor certo ao seu lado, você descobre que dirigir é liberdade — não medo.
          </p>
          <Link
            href="/instrutores"
            className="inline-flex items-center gap-2.5 px-8 py-4 font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 group"
            style={{ background: '#F9A800', color: '#003527' }}
          >
            Começar agora
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>
      </div>
    </section>
  )
}
