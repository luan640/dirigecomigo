'use client'

import dynamic from 'next/dynamic'
import type { InstructorCard } from '@/types'
import type { PlatformPricingSettings } from '@/lib/platformPricing'

const LeafletMap = dynamic(() => import('./LeafletMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full rounded-2xl bg-gray-100 animate-pulse flex items-center justify-center" style={{ height: 480 }}>
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
        <p className="text-sm text-gray-500">Carregando mapa...</p>
      </div>
    </div>
  ),
})

interface InstructorMapProps {
  instructors: InstructorCard[]
  height?: string
  platformSettings?: Partial<PlatformPricingSettings> | null
  focusLocation?: {
    latitude: number
    longitude: number
  } | null
}

export default function InstructorMap({
  instructors,
  height,
  platformSettings,
  focusLocation,
}: InstructorMapProps) {
  return (
    <LeafletMap
      instructors={instructors}
      height={height}
      platformSettings={platformSettings}
      focusLocation={focusLocation}
    />
  )
}
