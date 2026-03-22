'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Search, X } from 'lucide-react'

import InstructorMap from '@/components/map/InstructorMap'
import { type AddressSuggestion, searchLocationSuggestionsAction } from '@/lib/location'
import type { InstructorCard } from '@/types'

interface SearchSectionProps {
  instructors: InstructorCard[]
}

export default function SearchSection({ instructors }: SearchSectionProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)
  const [selectedAddress, setSelectedAddress] = useState<AddressSuggestion | null>(null)
  const [selectedCoordinates, setSelectedCoordinates] = useState<{ latitude: number; longitude: number } | null>(null)

  useEffect(() => {
    const trimmed = query.trim()

    if (selectedAddress && trimmed === (selectedAddress.bairro || selectedAddress.logradouro || selectedAddress.localidade)) {
      return
    }

    if (trimmed.length < 3) {
      setSuggestions([])
      setLoadingSuggestions(false)
      return
    }

    let active = true
    setLoadingSuggestions(true)

    const timer = window.setTimeout(async () => {
      try {
        const nextSuggestions = await searchLocationSuggestionsAction(trimmed)
        if (!active) return
        setSuggestions(nextSuggestions)
      } catch {
        if (active) setSuggestions([])
      } finally {
        if (active) setLoadingSuggestions(false)
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [query, selectedAddress])

  function resetLocation() {
    setQuery('')
    setSuggestions([])
    setSelectedAddress(null)
    setSelectedCoordinates(null)
  }

  function handleSearch() {
    if (!query.trim()) {
      router.push('/instrutores')
      return
    }
    if (!selectedAddress || !selectedCoordinates) return

    const params = new URLSearchParams({
      neighborhood: selectedAddress.bairro,
      city: selectedAddress.localidade,
      state: selectedAddress.uf,
      latitude: String(selectedCoordinates.latitude),
      longitude: String(selectedCoordinates.longitude),
    })
    router.push(`/instrutores?${params.toString()}`)
  }

  function handleSelectSuggestion(address: AddressSuggestion) {
    setQuery(address.bairro || address.logradouro || address.localidade)
    setSuggestions([])
    setSelectedAddress(address)
    setSelectedCoordinates({ latitude: address.latitude, longitude: address.longitude })
  }

  // Show first 3 instructors with known location in the left panel
  const featuredInstructors = instructors
    .filter((i) => i.latitude && i.longitude)
    .slice(0, 3)

  return (
    <section className="py-24" style={{ background: '#FEFCF5' }}>
      <div className="max-w-7xl mx-auto px-6">

        {/* Header */}
        <div className="mb-12 text-center">
          <p className="text-sm font-bold uppercase tracking-widest mb-3" style={{ color: '#1B5E20' }}>
            Mapa ao vivo
          </p>
          <h2
            className="text-4xl md:text-5xl font-black"
            style={{ fontFamily: "'Clash Display', sans-serif", color: '#0D1A0E' }}
          >
            Encontre perto{' '}
            <span style={{ color: '#1B5E20' }}>de você</span>
          </h2>
        </div>

        {/* Card: left panel + map */}
        <div
          className="grid grid-cols-1 lg:grid-cols-3 rounded-[2rem] overflow-hidden shadow-2xl"
          style={{ border: '1px solid rgba(27,94,32,0.1)' }}
        >
          {/* Left panel */}
          <div
            className="p-10 text-white flex flex-col"
            style={{ background: '#1B5E20' }}
          >
            <h3
              className="text-2xl font-black mb-2"
              style={{ fontFamily: "'Clash Display', sans-serif" }}
            >
              Busque por bairro
            </h3>
            <p className="mb-7 leading-relaxed text-sm" style={{ color: 'rgba(255,255,255,0.6)' }}>
              Encontre instrutores certificados perto da sua casa ou trabalho.
            </p>

            {/* Search input */}
            <div className="relative mb-6">
              <Search
                className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4"
                style={{ color: 'rgba(255,255,255,0.45)' }}
              />
              <input
                type="text"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value)
                  setSelectedAddress(null)
                  setSelectedCoordinates(null)
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') { e.preventDefault(); handleSearch() }
                }}
                placeholder="Bairro ou endereço..."
                className="w-full py-3.5 pl-11 pr-10 text-sm text-white placeholder-white/40 outline-none rounded-xl"
                style={{
                  background: 'rgba(255,255,255,0.1)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}
              />
              {query && (
                <button type="button" onClick={resetLocation} className="absolute right-3 top-1/2 -translate-y-1/2 p-1">
                  <X className="w-4 h-4 text-white/50" />
                </button>
              )}

              {/* Suggestions */}
              {(loadingSuggestions || suggestions.length > 0) && (
                <div
                  className="absolute left-0 right-0 top-full mt-1 z-30 rounded-xl overflow-hidden"
                  style={{ background: '#0D3620', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  {loadingSuggestions ? (
                    <div className="px-4 py-3 text-sm text-white/60">Buscando...</div>
                  ) : (
                    suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-white/80 hover:bg-white/10 transition-colors"
                      >
                        <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: '#F9A800' }} />
                        <span>
                          <strong className="text-white">{item.logradouro || item.bairro}</strong>
                          {' — '}{item.localidade}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Featured instructors list */}
            <div className="flex-1 space-y-3 mb-7">
              {featuredInstructors.length > 0 ? (
                featuredInstructors.map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: '#F9A800' }} />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{inst.name}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {inst.neighborhood}, {inst.city} · ⭐ {inst.rating?.toFixed(1) ?? '5.0'}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                instructors.slice(0, 3).map((inst) => (
                  <div
                    key={inst.id}
                    className="flex items-center gap-3 p-3.5 rounded-xl"
                    style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <MapPin className="w-5 h-5 flex-shrink-0" style={{ color: '#F9A800' }} />
                    <div className="min-w-0">
                      <p className="font-bold text-sm truncate">{inst.name}</p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.5)' }}>
                        {inst.neighborhood}, {inst.city} · ⭐ {inst.rating?.toFixed(1) ?? '5.0'}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={Boolean(query.trim()) && (!selectedAddress || !selectedCoordinates)}
              className="w-full py-3.5 font-bold rounded-xl transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed hover:-translate-y-0.5"
              style={{ background: '#F9A800', color: '#003527' }}
            >
              Buscar instrutores
            </button>
          </div>

          {/* Map: 2/3 width */}
          <div className="lg:col-span-2 h-[480px] lg:h-auto" style={{ minHeight: 480 }}>
            <InstructorMap instructors={instructors} height="520px" focusLocation={selectedCoordinates} />
          </div>
        </div>

        <p className="mt-4 text-center text-xs" style={{ color: '#5A7A60' }}>
          Clique no avatar de um instrutor no mapa para ver seu perfil completo
        </p>
      </div>
    </section>
  )
}
