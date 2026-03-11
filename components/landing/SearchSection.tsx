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
    <section className="bg-surface py-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 text-center">
          <h2 className="mb-2 text-2xl font-extrabold text-gray-900 md:text-3xl">
            Busque o instrutor mais próximo
          </h2>
          <p className="text-gray-500">
            Digite CEP, rua ou bairro e encontre instrutores disponíveis agora
          </p>
        </div>

        <div className="relative mx-auto mb-10 max-w-2xl">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <MapPin className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
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
                placeholder="Digite CEP, rua ou bairro"
                className="w-full rounded-xl border border-gray-200 bg-white py-3.5 pl-11 pr-10 text-sm shadow-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-violet-500"
              />
              {query && (
                <button
                  type="button"
                  onClick={resetLocation}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-1 hover:bg-gray-100"
                >
                  <X className="h-4 w-4 text-gray-400" />
                </button>
              )}

              {(loadingSuggestions || suggestions.length > 0) && (
                <div className="absolute left-0 right-0 top-full z-30 mt-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-lg">
                  {loadingSuggestions && (
                    <div className="px-4 py-3 text-sm text-gray-500">Buscando enderecos...</div>
                  )}

                  {!loadingSuggestions &&
                    suggestions.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSelectSuggestion(item)}
                        className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm transition-colors hover:bg-violet-50"
                      >
                        <MapPin className="h-4 w-4 flex-shrink-0 text-gray-400" />
                        <span>
                          <strong>{item.logradouro || item.bairro}</strong>
                          {' - '}
                          {[item.bairro, item.localidade, item.cep ? `CEP ${item.cep}` : ''].filter(Boolean).join(', ')}
                        </span>
                      </button>
                    ))}

                  {!loadingSuggestions && suggestions.length === 0 && query.trim().length >= 3 && (
                    <div className="px-4 py-3 text-sm text-gray-500">Nenhum endereco encontrado.</div>
                  )}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleSearch}
              disabled={Boolean(query.trim()) && (!selectedAddress || !selectedCoordinates)}
              className="flex items-center gap-2 rounded-xl bg-violet-600 px-5 py-3.5 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-violet-700 disabled:cursor-not-allowed disabled:bg-violet-300"
            >
              <Search className="h-5 w-5" />
              Buscar
            </button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200 shadow-lg">
          <InstructorMap instructors={instructors} height="480px" focusLocation={selectedCoordinates} />
        </div>
      </div>
    </section>
  )
}
