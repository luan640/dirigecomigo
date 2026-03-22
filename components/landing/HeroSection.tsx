'use client'

import Link from 'next/link'
import Image from 'next/image'
import { ArrowRight, ShieldCheck } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function HeroSection() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => { setMounted(true) }, [])

  return (
    <section className="relative min-h-screen flex items-center pt-16 overflow-hidden">
      {/* Dark green overlay + hero image */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(0,53,39,0.94) 0%, rgba(0,53,39,0.7) 55%, rgba(0,53,39,0.35) 100%), url('/images/hero-car.jpg')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 items-center py-20">

        {/* Left: Text */}
        <div
          className="text-white space-y-8"
          style={mounted ? { animation: 'fadeUp 0.8s cubic-bezier(0.22,1,0.36,1) both' } : { opacity: 0 }}
        >
          <div
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full"
            style={{ background: 'rgba(249,168,0,0.15)', border: '1px solid rgba(249,168,0,0.3)' }}
          >
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            <span className="text-xs font-bold tracking-widest uppercase" style={{ color: '#F9A800' }}>
              Fortaleza — CE e região
            </span>
          </div>

          <h1
            className="font-black leading-[0.95] tracking-tight"
            style={{
              fontFamily: "'Clash Display', sans-serif",
              fontSize: 'clamp(2.8rem, 6vw, 5.2rem)',
            }}
          >
            Sua jornada para a{' '}
            <span style={{ color: '#F9A800' }}>liberdade</span>{' '}
            começa aqui.
          </h1>

          <p
            className="text-xl leading-relaxed max-w-lg"
            style={{ color: 'rgba(255,255,255,0.8)', fontFamily: "'Outfit', sans-serif" }}
          >
            Conectamos você a instrutores certificados e pacientes. Supere o medo, passe no exame e dirija com confiança.
          </p>

          <div className="flex flex-wrap gap-4 pt-2">
            <Link
              href="/instrutores"
              className="inline-flex items-center gap-2.5 px-8 py-4 font-bold rounded-xl transition-all duration-300 hover:-translate-y-0.5 group"
              style={{ background: '#F9A800', color: '#003527' }}
            >
              Sou Aluno
              <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link
              href="/cadastro?role=instructor"
              className="inline-flex items-center gap-2.5 px-8 py-4 font-bold rounded-xl text-white transition-all duration-300 hover:bg-white/20"
              style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.2)',
              }}
            >
              Sou Instrutor
            </Link>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map((s) => (
                <svg key={s} className="w-4 h-4" viewBox="0 0 20 20" fill="#F9A800">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </div>
            <span className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
              4.9 · +2.400 alunos · 180+ instrutores
            </span>
          </div>
        </div>

        {/* Right: Glass card with image + approval badge */}
        <div
          className="hidden lg:flex justify-center items-center"
          style={mounted ? { animation: 'slideInRight 0.8s cubic-bezier(0.22,1,0.36,1) 0.2s both' } : { opacity: 0 }}
        >
          <div
            className="relative p-6 rounded-3xl"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(16px)',
              border: '1px solid rgba(255,255,255,0.12)',
              transform: 'rotate(2deg)',
              transition: 'transform 0.5s ease',
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.transform = 'rotate(0deg)' }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.transform = 'rotate(2deg)' }}
          >
            <div className="relative w-[400px] h-[280px] rounded-2xl overflow-hidden shadow-2xl">
              <Image
                src="/images/hero-car.jpg"
                alt="Aula de direção com instrutor certificado"
                fill
                priority
                className="object-cover"
                sizes="400px"
              />
            </div>

            {/* Taxa de Aprovação badge */}
            <div
              className="absolute -bottom-6 -left-6 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-2xl"
              style={{ background: '#FFFFFF' }}
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: '#F9A800' }}
              >
                <ShieldCheck className="w-5 h-5 text-white" />
              </div>
              <div>
                <p
                  className="text-xs font-bold uppercase tracking-widest"
                  style={{ color: 'rgba(0,53,39,0.5)' }}
                >
                  Taxa de Aprovação
                </p>
                <p
                  className="text-2xl font-black"
                  style={{ fontFamily: "'Clash Display', sans-serif", color: '#003527' }}
                >
                  98%
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Asymmetric bottom clip into next section */}
      <div className="absolute bottom-0 left-0 right-0" style={{ lineHeight: 0 }}>
        <svg
          viewBox="0 0 1440 80"
          preserveAspectRatio="none"
          style={{ width: '100%', height: '80px', display: 'block' }}
        >
          <polygon points="0,80 1440,0 1440,80" fill="#FEFCF5" />
        </svg>
      </div>
    </section>
  )
}
