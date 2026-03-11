import Link from 'next/link'
import Image from 'next/image'
import { MapPin, Car, CheckCircle2 } from 'lucide-react'
import type { InstructorCard as InstructorCardType } from '@/types'
import { normalizePlatformPricingSettings, type PlatformPricingSettings } from '@/lib/platformPricing'
import { formatCurrency, getAvailabilityLabel } from '@/utils/format'

interface InstructorCardProps {
  instructor: InstructorCardType
  compact?: boolean
  platformSettings?: Partial<PlatformPricingSettings> | null
}

export default function InstructorCard({
  instructor,
  compact = false,
  platformSettings,
}: InstructorCardProps) {
  const availability = getAvailabilityLabel(
    instructor.available_today,
    instructor.availability_label === 'available' ? 5 : instructor.availability_label === 'limited' ? 2 : 0
  )
  const normalizedPlatformSettings = normalizePlatformPricingSettings(platformSettings)
  const studentVisiblePrice =
    instructor.price_per_lesson +
    instructor.price_per_lesson * (normalizedPlatformSettings.platform_fee_percent / 100)

  const avatarUrl =
    instructor.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=1D4ED8&color=fff&size=200`

  return (
    <Link href={`/instrutor/${instructor.id}`} className="group block">
      <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
        <div className="relative p-5 pb-0">
          <div className="absolute top-4 right-4">
            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${availability.color}`}>
              {availability.label}
            </span>
          </div>

          <div className="flex items-start gap-4">
            <div className="relative flex-shrink-0">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-gray-100">
                <Image
                  src={avatarUrl}
                  alt={instructor.name}
                  width={64}
                  height={64}
                  className="h-full w-full object-cover"
                />
              </div>
              {instructor.is_verified && (
                <div className="absolute -right-1 -bottom-1 rounded-full bg-violet-600 p-0.5">
                  <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <h3 className="truncate text-base font-bold leading-tight text-gray-900 transition-colors group-hover:text-violet-600">
                {instructor.name}
              </h3>

              <div className="mt-1 text-sm text-gray-500">
                ({instructor.total_lessons} aulas)
              </div>

              <div className="mt-1 flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 flex-shrink-0 text-gray-400" />
                <span className="truncate text-sm text-gray-500">
                  {instructor.neighborhood} - {instructor.city}/{instructor.state}
                </span>
              </div>
            </div>
          </div>
        </div>

        {!compact && (
          <div className="px-5 py-3">
            <p className="line-clamp-2 text-sm text-gray-600">{instructor.bio}</p>
          </div>
        )}

        <div className="flex items-center justify-between border-t border-gray-50 px-5 py-4">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              Cat. {instructor.category} - {instructor.total_lessons} aulas
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-violet-600">
              {formatCurrency(studentVisiblePrice)}
            </span>
            <span className="block text-xs text-gray-400">por aula</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
