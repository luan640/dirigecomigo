import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import HeroSection from '@/components/landing/HeroSection'
import AboutSection from '@/components/landing/AboutSection'
import ServicesSection from '@/components/landing/ServicesSection'
import BenefitsSection from '@/components/landing/BenefitsSection'
import InstructorCarousel from '@/components/landing/InstructorCarousel'
import SearchSection from '@/components/landing/SearchSection'
import VideoSection from '@/components/landing/VideoSection'
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

  return (
    <>
      <AuthCodeHandler />
      <Navbar />
      <main className="overflow-hidden">
        <HeroSection />
        <BenefitsSection />
        <AboutSection />
        <ServicesSection />
        <InstructorCarousel instructors={instructors} />
        <VideoSection />
        <SearchSection instructors={instructors} />
        <TestimonialsSection />
        <FinalCTA />
      </main>
      <Footer />
    </>
  )
}
