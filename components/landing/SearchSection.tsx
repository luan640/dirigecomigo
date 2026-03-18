'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { MapPin, Search, X, Navigation } from 'lucide-react'

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

    if (!selectedAddress || !selectedCoordinates) {
      return
    }

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
    setSelectedCoordinates({
      latitude: address.latitude,
      longitude: address.longitude,
    })
  }

  return (
    <section className="py-24 relative overflow-hidden" style={{ background: 'var(--land-bg)' }}>
      {/* Top separator glow */}
      <div className="absolute top-0 left-0 right-0 h-px"
        style={{ background: 'linear-gradient(90deg, transparent, rgba(246,196,0,0.3), transparent)' }} />

      {/* Background glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full"
          style={{ background: 'radial-gradient(circle, rgba(23,180,74,0.04) 0%, transparent 60%)' }} />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-10 text-center">
          <span className="mb-5 inline-flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-bold uppercase tracking-widest"
            style={{ background: 'rgba(23,180,74,0.1)', color: '#17b44a', border: '1px solid rgba(23,180,74,0.25)' }}>
            <Navigation className="w-3.5 h-3.5" />
            Mapa ao vivo
          </span>
          <h2 className="text-4xl sm:text-5xl font-black text-white" style={{ fontFamily: "'Syne', sans-serif" }}>
            Instrutores perto{' '}
            <span style={{ color: '#f6c400' }}>de você</span>
          </h2>
          <p className="mt-4 text-lg max-w-xl mx-auto" style={{ color: 'var(--land-muted)' }}>
            Digite seu bairro ou endereço e encontre instrutores disponíveis agora em Fortaleza
          </p>
        </div>

        {/* Search bar */}
        <div className="relative mx-auto mb-8 max-w-2xl">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-yellow-400" />
              <input
                type="text"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value)
                  setSelectedAddress(null)
                  setSelectedCoordinates(null)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault()
                    handleSearch()
                  }
                }}
                placeholder="Digite bairro, rua ou CEP..."
                className="w-full rounded-2xl py-4 pl-12 pr-10 text-sm text-white placeholder-white/30 outline-none transition-all duration-300"
                style={{
                  background: 'rgba(10,22,40,0.9)',
                  border: '1px solid rgba(246,196,0,0.2)',
                  backdropFilter: 'blur(12px)',
                }}
                onFocus={(e) => { e.currentTarget.style.borderColor = 'rgba(246,196,0,0.5)' }}
                onBlur={(e) => { e.currentTarget.style.borderColor = 'rgba(246,196,0,0.2)' }}
              />
              {query && (
                <button
                  type="button"
                  onClick={resetLocation}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-white/10 transition-colors"
                >
                  <X className="h-4 w-4 text-white/40" />
                </button>
              )}

              {/* Suggestions dropdown */}
              {(loadingSuggestions || suggestions.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-30 mt-2 overflow-hidden rounded-2xl"
                  style={{ background: '#0a1628', border: '1px solid rgba(246,196,0,0.2)', backdropFilter: 'blur(16px)' }}>
                  {loadingSuggestions && (
                    <div className="px-4 py-3 text-sm" style={{ color: 'var(--land-muted)' }}>
                      Buscando endereços...
                    </div>
                  )}
                  {!loadingSuggestions && suggestions.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => handleSelectSuggestion(item)}
                      className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-white/5"
                    >
                      <MapPin className="h-4 w-4 flex-shrink-0 text-yellow-400" />
                      <span className="text-white/80">
                        <strong className="text-white">{item.logradouro || item.bairro}</strong>
                        {' — '}
                        {[item.bairro, item.localidade, item.cep ? `CEP ${item.cep}` : ''].filter(Boolean).join(', ')}
                      </span>
                    </button>
                  ))}
                  {!loadingSuggestions && suggestions.length === 0 && query.trim().length >= 3 && (
                    <div className="px-4 py-3 text-sm" style={{ color: 'var(--land-muted)' }}>
                      Nenhum endereço encontrado.
                    </div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={Boolean(query.trim()) && (!selectedAddress || !selectedCoordinates)}
              className="flex items-center gap-2 rounded-2xl px-6 py-4 text-sm font-bold text-black transition-all duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: 'linear-gradient(135deg, #f6c400, #ff9500)',
                boxShadow: '0 0 24px rgba(246,196,0,0.3)',
              }}
            >
              <Search className="h-5 w-5" />
              Buscar
            </button>
          </div>
        </div>

        {/* Map container */}
        <div
          className="overflow-hidden rounded-3xl"
          style={{
            border: '1px solid rgba(246,196,0,0.15)',
            boxShadow: '0 0 60px rgba(246,196,0,0.08), 0 32px 64px rgba(0,0,0,0.4)',
          }}
        >
          <InstructorMap instructors={instructors} height="520px" focusLocation={selectedCoordinates} />
        </div>

        {/* Map hint */}
        <p className="mt-4 text-center text-xs" style={{ color: 'var(--land-muted)' }}>
          Clique no avatar de um instrutor no mapa para ver seu perfil completo
        </p>
      </div>
    </section>
  )
}
