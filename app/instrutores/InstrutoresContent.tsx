'use client'

import { useMemo, useState } from 'react'
import { Search, SlidersHorizontal, Map, Grid3X3, MapPin, X } from 'lucide-react'

import type { InstructorCard, InstructorSearchFilters } from '@/types'
import type { PlatformPricingSettings } from '@/lib/platformPricing'
import InstructorCardComponent from '@/components/instructors/InstructorCard'
import { SearchFilters } from '@/components/instructors/SearchFilters'
import InstructorMap from '@/components/map/InstructorMap'
import Navbar from '@/components/layout/Navbar'
import Footer from '@/components/layout/Footer'
import { cn } from '@/lib/utils'

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number) {
  const toRad = (value: number) => value * Math.PI / 180
  const earthRadiusKm = 6371
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return earthRadiusKm * c
}

function applyFilters(
  instructors: InstructorCard[],
  filters: InstructorSearchFilters,
  query: string,
) {
  const normalized = query.trim().toLowerCase()
  let results = [...instructors]

  if (normalized) {
    results = results.filter(instructor =>
      instructor.name.toLowerCase().includes(normalized) ||
      instructor.neighborhood.toLowerCase().includes(normalized) ||
      instructor.city.toLowerCase().includes(normalized),
    )
  }

  if (filters.neighborhood) {
    results = results.filter(instructor =>
      instructor.neighborhood.toLowerCase().includes(filters.neighborhood!.toLowerCase()),
    )
  }

  if (filters.city) {
    results = results.filter(instructor =>
      instructor.city.toLowerCase().includes(filters.city!.toLowerCase()),
    )
  }

  if (filters.state) {
    results = results.filter(instructor =>
      instructor.state.toLowerCase() === filters.state!.toLowerCase(),
    )
  }

  if (filters.min_price !== undefined) {
    results = results.filter(instructor => instructor.price_per_lesson >= filters.min_price!)
  }

  if (filters.max_price !== undefined) {
    results = results.filter(instructor => instructor.price_per_lesson <= filters.max_price!)
  }

  if (filters.available_today) {
    results = results.filter(instructor => instructor.available_today)
  }

  if (filters.category) {
    const selectedCategory = filters.category
    results = results.filter(instructor => {
      if (instructor.category === selectedCategory) return true

      const categories = instructor.categories?.length ? instructor.categories : []
      if (categories.includes(selectedCategory)) return true

      if (selectedCategory === 'AB') {
        return categories.includes('A') && categories.includes('B')
      }

      return false
    })
  }

  if (typeof filters.latitude === 'number' && typeof filters.longitude === 'number') {
    results = results
      .filter(instructor => typeof instructor.latitude === 'number' && typeof instructor.longitude === 'number')
      .sort((a, b) => {
        const distanceA = haversineKm(filters.latitude!, filters.longitude!, a.latitude!, a.longitude!)
        const distanceB = haversineKm(filters.latitude!, filters.longitude!, b.latitude!, b.longitude!)
        return distanceA - distanceB
      })
  }

  return results
}

export default function InstrutoresContent({
  instructors,
  platformSettings,
}: {
  instructors: InstructorCard[]
  platformSettings: PlatformPricingSettings
}) {
  const [query, setQuery] = useState('')
  const [filters, setFilters] = useState<InstructorSearchFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'map'>('grid')

  const filtered = useMemo(
    () => applyFilters(instructors, filters, query),
    [filters, instructors, query],
  )
  const activeFilterCount = Object.values(filters).filter(Boolean).length + (query ? 1 : 0)

  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-gray-50">
        <div className="sticky top-16 z-30 border-b border-gray-100 bg-white shadow-sm">
          <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <form
                onSubmit={event => event.preventDefault()}
                className="relative flex-1"
              >
                <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Buscar por bairro, cidade ou instrutor..."
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                {query && (
                  <button
                    type="button"
                    onClick={() => setQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2"
                  >
                    <X className="h-4 w-4 text-gray-400" />
                  </button>
                )}
              </form>

              <button
                type="button"
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors lg:hidden',
                  showFilters || activeFilterCount > 0
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-700 hover:border-gray-300',
                )}
              >
                <SlidersHorizontal className="h-4 w-4" />
                Filtros
                {activeFilterCount > 0 && (
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-blue-700 text-xs text-white">
                    {activeFilterCount}
                  </span>
                )}
              </button>

              <div className="flex overflow-hidden rounded-xl border border-gray-200">
                <button
                  type="button"
                  onClick={() => setViewMode('grid')}
                  className={cn(
                    'px-3 py-2.5 transition-colors',
                    viewMode === 'grid' ? 'bg-blue-700 text-white' : 'text-gray-500 hover:bg-gray-50',
                  )}
                >
                  <Grid3X3 className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode('map')}
                  className={cn(
                    'px-3 py-2.5 transition-colors',
                    viewMode === 'map' ? 'bg-blue-700 text-white' : 'text-gray-500 hover:bg-gray-50',
                  )}
                >
                  <Map className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex gap-6">
            <aside className="hidden w-72 flex-shrink-0 lg:block">
              <div className="sticky top-36 rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                <SearchFilters filters={filters} onChange={setFilters} />
              </div>
            </aside>

            <div className="min-w-0 flex-1">
              <div className="mb-4 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  <span className="font-semibold text-gray-900">{filtered.length}</span>{' '}
                  instrutor{filtered.length !== 1 ? 'es' : ''} encontrado{filtered.length !== 1 ? 's' : ''}
                  {query && ` para "${query}"`}
                </p>
              </div>

              {filtered.length === 0 ? (
                <div className="py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                    <Search className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="mb-2 text-lg font-semibold text-gray-900">
                    Nenhum instrutor encontrado
                  </h3>
                  <p className="mb-4 text-sm text-gray-500">
                    Tente ajustar os filtros ou buscar em outro bairro.
                  </p>
                  <button
                    type="button"
                    onClick={() => {
                      setFilters({})
                      setQuery('')
                    }}
                    className="text-sm font-semibold text-blue-700 hover:underline"
                  >
                    Limpar todos os filtros
                  </button>
                </div>
              ) : viewMode === 'grid' ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {filtered.map(instructor => (
                    <InstructorCardComponent
                      key={instructor.id}
                      instructor={instructor}
                      platformSettings={platformSettings}
                    />
                  ))}
                </div>
              ) : (
                <div className="overflow-hidden rounded-2xl border border-gray-200 shadow">
                  <InstructorMap
                    instructors={filtered}
                    platformSettings={platformSettings}
                    height="600px"
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="fixed inset-0 z-50 flex lg:hidden">
            <div className="flex-1 bg-black/40" onClick={() => setShowFilters(false)} />
            <div className="h-full w-80 overflow-y-auto bg-white p-5 shadow-xl">
              <SearchFilters
                filters={filters}
                onChange={setFilters}
                onClose={() => setShowFilters(false)}
              />
            </div>
          </div>
        )}
      </main>
      <Footer />
    </>
  )
}
