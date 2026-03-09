import Link from 'next/link'
import Image from 'next/image'
import { Star, MapPin, Car, CheckCircle2 } from 'lucide-react'
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
    <Link href={`/instrutor/${instructor.id}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 overflow-hidden">
        {/* Header */}
        <div className="relative p-5 pb-0">
          {/* Availability badge */}
          <div className="absolute top-4 right-4">
            <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${availability.color}`}>
              {availability.label}
            </span>
          </div>

          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0">
              <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100">
                <Image
                  src={avatarUrl}
                  alt={instructor.name}
                  width={64}
                  height={64}
                  className="w-full h-full object-cover"
                />
              </div>
              {instructor.is_verified && (
                <div className="absolute -bottom-1 -right-1 bg-violet-600 rounded-full p-0.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-gray-900 text-base leading-tight group-hover:text-violet-600 transition-colors truncate">
                {instructor.name}
              </h3>

              {/* Rating */}
              <div className="flex items-center gap-1.5 mt-1">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-sm font-semibold text-gray-900">{instructor.rating.toFixed(1)}</span>
                <span className="text-sm text-gray-400">({instructor.review_count} avaliações)</span>
              </div>

              {/* Location */}
              <div className="flex items-center gap-1 mt-1">
                <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                <span className="text-sm text-gray-500 truncate">
                  {instructor.neighborhood} — {instructor.city}/{instructor.state}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        {!compact && (
          <div className="px-5 py-3">
            <p className="text-sm text-gray-600 line-clamp-2">{instructor.bio}</p>
          </div>
        )}

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Car className="w-4 h-4 text-gray-400" />
            <span className="text-xs text-gray-500">
              Cat. {instructor.category} · {instructor.total_lessons} aulas
            </span>
          </div>
          <div className="text-right">
            <span className="text-xl font-bold text-violet-600">
              {formatCurrency(studentVisiblePrice)}
            </span>
            <span className="text-xs text-gray-400 block">por aula</span>
          </div>
        </div>
      </div>
    </Link>
  )
}
