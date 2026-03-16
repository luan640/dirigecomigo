import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/landing/HeroSection'
import InstructorCarousel from '@/components/landing/InstructorCarousel'
import SearchSection from '@/components/landing/SearchSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import HowItWorks from '@/components/landing/HowItWorks'
import InstructorCTA from '@/components/landing/InstructorCTA'
import FinalCTA from '@/components/landing/FinalCTA'
import AuthCodeHandler from './AuthCodeHandler'
import { loadPublicInstructors } from '@/lib/publicInstructors'
import { MOCK_INSTRUCTORS } from '@/lib/mock-data'
import type { InstructorCard } from '@/types'

async function loadHomeInstructors(): Promise<InstructorCard[]> {
  const demoMode = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (demoMode) return MOCK_INSTRUCTORS
  return loadPublicInstructors()
}

export default async function HomePage() {
  const instructors = await loadHomeInstructors()
  const list = instructors.length ? instructors : MOCK_INSTRUCTORS

  return (
    <>
      <AuthCodeHandler />
      <Navbar />
      <main className="overflow-hidden bg-white">
        <HeroSection />
        <InstructorCarousel instructors={list} />
        <SearchSection instructors={list} />
        <BenefitsSection />
        <HowItWorks />
        <InstructorCTA />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
