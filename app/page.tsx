import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/landing/HeroSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import InstructorCarousel from '@/components/landing/InstructorCarousel'
import SearchSection from '@/components/landing/SearchSection'
import TestimonialsSection from '@/components/landing/TestimonialsSection'
import FinalCTA from '@/components/landing/FinalCTA'
import AuthCodeHandler from './AuthCodeHandler'
import { loadPublicInstructors } from '@/lib/publicInstructors'
import type { InstructorCard } from '@/types'

async function loadHomeInstructors(): Promise<InstructorCard[]> {
  return loadPublicInstructors()
}

export default async function HomePage() {
  const instructors = await loadHomeInstructors()
  const list = instructors

  return (
    <>
      <AuthCodeHandler />
      <Navbar />
      <main className="overflow-hidden">
        <HeroSection />
        <BenefitsSection />
        <InstructorCarousel instructors={list} />
        <SearchSection instructors={list} />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
