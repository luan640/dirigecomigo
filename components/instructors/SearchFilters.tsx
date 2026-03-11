'use client'

import { useEffect, useState } from 'react'
import { X } from 'lucide-react'

import { searchLocationSuggestionsAction, type AddressSuggestion } from '@/lib/location'
import { cn } from '@/lib/utils'
import type { InstructorSearchFilters } from '@/types'

interface SearchFiltersProps {
  filters: InstructorSearchFilters
  onChange: (filters: InstructorSearchFilters) => void
  onClose?: () => void
}

export function SearchFilters({ filters, onChange, onClose }: SearchFiltersProps) {
  const [neighborhoodQuery, setNeighborhoodQuery] = useState(filters.neighborhood || '')
  const [showNeighborhoodSuggestions, setShowNeighborhoodSuggestions] = useState(false)
  const [remoteSuggestions, setRemoteSuggestions] = useState<AddressSuggestion[]>([])
  const [loadingSuggestions, setLoadingSuggestions] = useState(false)

  function update(key: keyof InstructorSearchFilters, value: unknown) {
    onChange({ ...filters, [key]: value || undefined })
  }

  useEffect(() => {
    setNeighborhoodQuery(filters.neighborhood || '')
  }, [filters.neighborhood])

  useEffect(() => {
    const query = neighborhoodQuery.trim()
    if (!showNeighborhoodSuggestions || query.length < 3) {
      setRemoteSuggestions([])
      setLoadingSuggestions(false)
      return
    }

    let active = true
    setLoadingSuggestions(true)

    const timer = window.setTimeout(async () => {
      try {
        const suggestions = await searchLocationSuggestionsAction(query)
        if (!active) return
        setRemoteSuggestions(suggestions)
      } catch {
        if (active) setRemoteSuggestions([])
      } finally {
        if (active) setLoadingSuggestions(false)
      }
    }, 300)

    return () => {
      active = false
      window.clearTimeout(timer)
    }
  }, [neighborhoodQuery, showNeighborhoodSuggestions])

  return (
    <div className="space-y-5">
      {onClose && (
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-900">Filtros</h2>
          <button onClick={onClose} className="rounded-lg p-1 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>
      )}

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Qual sua rua?</label>
        <div className="relative">
          <input
            value={neighborhoodQuery}
            onChange={(event) => {
              const value = event.target.value
              setNeighborhoodQuery(value)
              setShowNeighborhoodSuggestions(true)
            }}
            onFocus={() => setShowNeighborhoodSuggestions(true)}
            onBlur={() => {
              window.setTimeout(() => setShowNeighborhoodSuggestions(false), 120)
            }}
            placeholder="Busque por CEP, rua, bairro ou localidade"
            className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
          />

          {showNeighborhoodSuggestions && (loadingSuggestions || remoteSuggestions.length > 0) && (
            <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
              {loadingSuggestions && (
                <div className="px-4 py-3 text-sm text-gray-500">Buscando enderecos...</div>
              )}

              {!loadingSuggestions &&
                remoteSuggestions.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onMouseDown={(event) => {
                      event.preventDefault()
                      setNeighborhoodQuery(item.bairro || item.logradouro || item.localidade)
                      setShowNeighborhoodSuggestions(false)
                      onChange({
                        ...filters,
                        neighborhood: item.bairro || undefined,
                        city: item.localidade || undefined,
                        state: item.uf || undefined,
                        latitude: item.latitude,
                        longitude: item.longitude,
                      })
                    }}
                    className="block w-full px-4 py-3 text-left text-sm text-gray-700 hover:bg-violet-50"
                  >
                    <span className="block font-medium text-gray-900">{item.logradouro || item.bairro}</span>
                    <span className="block text-xs text-gray-500">
                      {[item.bairro, item.localidade, item.cep ? `CEP ${item.cep}` : ''].filter(Boolean).join(' · ')}
                    </span>
                  </button>
                ))}

              {!loadingSuggestions && remoteSuggestions.length === 0 && neighborhoodQuery.trim().length >= 3 && (
                <div className="px-4 py-3 text-sm text-gray-500">Nenhum endereco encontrado.</div>
              )}
            </div>
          )}
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Faixa de preco</label>
        <div className="flex gap-2">
          <div className="flex-1">
            <input
              type="number"
              placeholder="Min R$"
              value={filters.min_price || ''}
              onChange={(e) => update('min_price', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
          <div className="flex-1">
            <input
              type="number"
              placeholder="Max R$"
              value={filters.max_price || ''}
              onChange={(e) => update('max_price', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Disponibilidade</label>
        <label className="flex cursor-pointer items-center gap-3">
          <div
            onClick={() => update('available_today', !filters.available_today)}
            className={cn(
              'flex h-6 w-11 items-center rounded-full px-0.5 transition-colors',
              filters.available_today ? 'bg-violet-600' : 'bg-gray-200',
            )}
          >
            <div
              className={cn(
                'h-5 w-5 rounded-full bg-white shadow transition-transform',
                filters.available_today ? 'translate-x-5' : 'translate-x-0',
              )}
            />
          </div>
          <span className="text-sm text-gray-700">Disponivel hoje</span>
        </label>
      </div>

      <div>
        <label className="mb-2 block text-sm font-semibold text-gray-700">Categoria CNH</label>
        <div className="flex flex-wrap gap-2">
          {['A', 'B', 'AB', 'C'].map((cat) => (
            <button
              key={cat}
              onClick={() => update('category', filters.category === cat ? undefined : cat)}
              className={cn(
                'rounded-xl border px-4 py-1.5 text-sm font-medium transition-colors',
                filters.category === cat
                  ? 'border-violet-600 bg-violet-50 text-violet-700'
                  : 'border-gray-200 text-gray-600 hover:border-gray-300',
              )}
            >
              Cat. {cat}
            </button>
          ))}
        </div>
      </div>

      <button
        onClick={() => {
          setNeighborhoodQuery('')
          onChange({})
        }}
        className="w-full rounded-xl border border-red-200 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50"
      >
        Limpar filtros
      </button>
    </div>
  )
}
