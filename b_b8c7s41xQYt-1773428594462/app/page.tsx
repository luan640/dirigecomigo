import { Header } from "@/components/landing/header"
import { HeroSection } from "@/components/landing/hero-section"
import { InstructorCarousel } from "@/components/landing/instructor-carousel"
import { InstructorMap } from "@/components/landing/instructor-map"
import { BenefitsSection } from "@/components/landing/benefits-section"
import { HowItWorks } from "@/components/landing/how-it-works"
import { InstructorCTA } from "@/components/landing/instructor-cta"
import { FinalCTA } from "@/components/landing/final-cta"
import { Footer } from "@/components/landing/footer"

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <InstructorCarousel />
      <InstructorMap />
      <BenefitsSection />
      <HowItWorks />
      <InstructorCTA />
      <FinalCTA />
      <Footer />
    </main>
  )
}
