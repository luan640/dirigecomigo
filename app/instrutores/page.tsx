import type { InstructorCard } from '@/types'
import { MOCK_INSTRUCTORS } from '@/lib/mock-data'
import { loadPublicInstructors } from '@/lib/publicInstructors'
import InstrutoresContent from './InstrutoresContent'

async function loadInstructors(): Promise<InstructorCard[]> {
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (DEMO_MODE) return MOCK_INSTRUCTORS
  return loadPublicInstructors()
}

export default async function InstrutoresPage() {
  const instructors = await loadInstructors()
  return <InstrutoresContent instructors={instructors} />
}
