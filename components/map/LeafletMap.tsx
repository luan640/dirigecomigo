'use client'

import { useEffect } from 'react'
import { Circle, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet'
import type { InstructorCard } from '@/types'
import { formatCurrency } from '@/utils/format'
import L from 'leaflet'
import { MapPin } from 'lucide-react'
import { FORTALEZA_CENTER, FORTALEZA_DEFAULT_ZOOM } from '@/constants/locations'

interface LeafletMapProps {
  instructors: InstructorCard[]
  height?: string
  focusLocation?: {
    latitude: number
    longitude: number
  } | null
}

function getAvatarUrl(instructor: InstructorCard) {
  return (
    instructor.avatar_url ||
    `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=1D4ED8&color=fff&size=96`
  )
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

function createCustomIcon(instructor: InstructorCard) {
  const avatarUrl = escapeHtml(getAvatarUrl(instructor))
  const name = escapeHtml(instructor.name)
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 64" width="52" height="64">
      <defs>
        <clipPath id="avatar-clip-${instructor.id}">
          <circle cx="26" cy="24" r="18" />
        </clipPath>
      </defs>
      <path d="M26 62c9-12 16-18 16-30 0-10.493-6.82-26-16-26S10 21.507 10 32c0 12 7 18 16 30Z" fill="#1D4ED8" />
      <circle cx="26" cy="24" r="20" fill="white" />
      <image href="${avatarUrl}" x="8" y="6" width="36" height="36" preserveAspectRatio="xMidYMid slice" clip-path="url(#avatar-clip-${instructor.id})" />
      <circle cx="26" cy="24" r="18" fill="transparent" stroke="white" stroke-width="2" />
      <title>${name}</title>
    </svg>
  `
  return L.divIcon({
    html: svg,
    className: '',
    iconSize: [52, 64],
    iconAnchor: [26, 62],
    popupAnchor: [0, -56],
  })
}

function MapFocusController({ focusLocation }: { focusLocation?: { latitude: number; longitude: number } | null }) {
  const map = useMap()

  useEffect(() => {
    if (!focusLocation) return

    map.flyTo([focusLocation.latitude, focusLocation.longitude], 14, {
      animate: true,
      duration: 1.2,
    })
  }, [focusLocation, map])

  return null
}

export default function LeafletMap({ instructors, height = '480px', focusLocation }: LeafletMapProps) {
  // Fix Leaflet default icon path issue with Next.js/webpack
  useEffect(() => {
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
      iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
      shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    })
  }, [])

  const instructorsWithCoords = instructors.filter(
    i => i.latitude !== null && i.longitude !== null
  )

  return (
    <MapContainer
      center={[FORTALEZA_CENTER.lat, FORTALEZA_CENTER.lng]}
      zoom={FORTALEZA_DEFAULT_ZOOM}
      style={{ height, width: '100%' }}
      className="rounded-2xl"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <MapFocusController focusLocation={focusLocation} />

      {focusLocation && (
        <Circle
          center={[focusLocation.latitude, focusLocation.longitude]}
          radius={5000}
          pathOptions={{
            color: '#7c3aed',
            weight: 2,
            fillColor: '#a78bfa',
            fillOpacity: 0.14,
          }}
        >
          <Popup>
            <div className="text-sm font-medium text-gray-700">Raio de busca de ate 5 km</div>
          </Popup>
        </Circle>
      )}

      {instructorsWithCoords.map(instructor => (
        <Marker
          key={instructor.id}
          position={[instructor.latitude!, instructor.longitude!]}
          icon={createCustomIcon(instructor)}
        >
          <Popup minWidth={220} maxWidth={260}>
            <div className="p-1">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src={
                    instructor.avatar_url ||
                    `https://ui-avatars.com/api/?name=${encodeURIComponent(instructor.name)}&background=1D4ED8&color=fff&size=60`
                  }
                  alt={instructor.name}
                  className="w-12 h-12 rounded-xl object-cover flex-shrink-0"
                />
                 <div className="min-w-0">
                   <p className="font-bold text-gray-900 text-sm leading-tight">{instructor.name}</p>
                   <p className="mt-0.5 text-xs text-gray-500">{instructor.category}</p>
                 </div>
               </div>

              <div className="flex items-center gap-1 text-xs text-gray-500 mb-2">
                <MapPin className="w-3 h-3" />
                {instructor.neighborhood} — {instructor.city}/{instructor.state}
              </div>

              <div className="flex items-center justify-between mb-3">
                <span className="text-lg font-bold text-blue-700">
                  {formatCurrency(instructor.price_per_lesson)}
                </span>
                <span className="text-xs text-gray-400">por aula</span>
              </div>

              <a
                href={`/instrutor/${instructor.id}`}
                className="block w-full rounded-lg bg-blue-700 px-3 py-2 text-center text-xs font-semibold !text-black visited:!text-black hover:bg-blue-800"
              >
                Ver horários disponíveis
              </a>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  )
}
