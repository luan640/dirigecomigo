import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/landing/HeroSection'
import InstructorCarousel from '@/components/landing/InstructorCarousel'
import SearchSection from '@/components/landing/SearchSection'
import HowItWorks from '@/components/landing/HowItWorks'
import InstructorCTA from '@/components/landing/InstructorCTA'
import { MOCK_INSTRUCTORS } from '@/lib/mock-data'
import { loadPublicInstructors } from '@/lib/publicInstructors'
import type { InstructorCard } from '@/types'
import AuthCodeHandler from './AuthCodeHandler'

async function loadHomeInstructors(): Promise<InstructorCard[]> {
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (DEMO_MODE) return MOCK_INSTRUCTORS
  return loadPublicInstructors()
}

export default async function HomePage() {
  const instructors = await loadHomeInstructors()
  const featuredInstructors = instructors.filter(i => i.is_verified).slice(0, 8)

  return (
    <>
      <AuthCodeHandler />
      <Navbar />
      <main>
        <HeroSection />
        <InstructorCarousel instructors={featuredInstructors} />
        <HowItWorks />
        <SearchSection instructors={instructors} />
        <InstructorCTA />
      </main>
      <Footer />
    </>
  )
}
