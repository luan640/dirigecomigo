import type { InstructorCard } from '@/types'
import { MOCK_INSTRUCTORS } from '@/lib/mock-data'
import { loadPublicInstructors } from '@/lib/publicInstructors'
import {
  DEFAULT_PLATFORM_PRICING_SETTINGS,
  normalizePlatformPricingSettings,
  type PlatformPricingSettings,
} from '@/lib/platformPricing'
import { createClient } from '@/lib/supabase/server'
import InstrutoresContent from './InstrutoresContent'

async function loadInstructors(): Promise<InstructorCard[]> {
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (DEMO_MODE) return MOCK_INSTRUCTORS
  return loadPublicInstructors()
}

async function loadPlatformSettings(): Promise<PlatformPricingSettings> {
  const DEMO_MODE = process.env.NEXT_PUBLIC_DEMO_MODE === 'true'
  if (DEMO_MODE) return DEFAULT_PLATFORM_PRICING_SETTINGS

  try {
    const supabase = await createClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data, error } = await (supabase as any)
      .from('platform_settings')
      .select('platform_fee_percent,pix_fee_percent,card_fee_percent')
      .eq('key', 'default')
      .maybeSingle()

    if (error) return DEFAULT_PLATFORM_PRICING_SETTINGS

    return normalizePlatformPricingSettings(data)
  } catch {
    return DEFAULT_PLATFORM_PRICING_SETTINGS
  }
}

export default async function InstrutoresPage() {
  const [instructors, platformSettings] = await Promise.all([
    loadInstructors(),
    loadPlatformSettings(),
  ])

  return <InstrutoresContent instructors={instructors} platformSettings={platformSettings} />
}
