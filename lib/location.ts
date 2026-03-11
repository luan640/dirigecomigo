'use server'

export type AddressSuggestion = {
  id: string
  cep: string
  logradouro: string
  bairro: string
  localidade: string
  uf: string
  latitude: number
  longitude: number
  display_name: string
}

type NominatimAddress = Record<string, string | undefined>
type NominatimResult = {
  place_id?: number | string
  lat?: string
  lon?: string
  display_name?: string
  address?: NominatimAddress
}

function buildRoadLabel(address: NominatimAddress) {
  const street =
    address.road ||
    address.pedestrian ||
    address.footway ||
    address.cycleway ||
    address.path ||
    address.highway

  const number = address.house_number
  return [street, number].filter(Boolean).join(', ')
}

function mapAddressResult(item: NominatimResult): AddressSuggestion | null {
  const address = item.address || {}
  const latitude = Number(item.lat)
  const longitude = Number(item.lon)

  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
    return null
  }

  const bairro =
    address.suburb ||
    address.neighbourhood ||
    address.quarter ||
    address.city_district ||
    address.hamlet ||
    ''

  const localidade =
    address.city ||
    address.town ||
    address.village ||
    address.municipality ||
    address.county ||
    ''

  const isoState = String(address['ISO3166-2-lvl4'] || '').trim()
  const uf = isoState.startsWith('BR-') ? isoState.slice(3) : String(address.state || '').trim()

  if (!bairro && !localidade) {
    return null
  }

  return {
    id: String(item.place_id || `${latitude}-${longitude}`),
    cep: String(address.postcode || '').trim(),
    logradouro: buildRoadLabel(address),
    bairro: bairro.trim(),
    localidade: localidade.trim(),
    uf,
    latitude,
    longitude,
    display_name: String(item.display_name || '').trim(),
  }
}

function dedupeSuggestions(items: AddressSuggestion[]) {
  const seen = new Set<string>()

  return items.filter((item) => {
    const key = [item.logradouro, item.bairro, item.localidade, item.uf, item.cep].join('|').toLowerCase()
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

export async function searchLocationSuggestionsAction(query: string) {
  const normalizedQuery = String(query || '').trim()

  if (normalizedQuery.length < 3) {
    return []
  }

  const url = new URL('https://nominatim.openstreetmap.org/search')
  url.searchParams.set('format', 'json')
  url.searchParams.set('q', normalizedQuery)
  url.searchParams.set('countrycodes', 'br')
  url.searchParams.set('addressdetails', '1')
  url.searchParams.set('limit', '15')

  const response = await fetch(url.toString(), {
    cache: 'no-store',
    headers: {
      'Accept-Language': 'pt-BR,pt;q=0.9',
      'User-Agent': 'MeuInstrutor/1.0',
    },
  })

  if (!response.ok) {
    throw new Error('Falha ao buscar endereços.')
  }

  const data = await response.json()
  const results = Array.isArray(data) ? data : []

  return dedupeSuggestions(
    results
      .map((item) => mapAddressResult(item as NominatimResult))
      .filter((item): item is AddressSuggestion => Boolean(item))
      .slice(0, 10),
  )
}

export async function geocodeCepAction(query: string) {
  const normalizedQuery = String(query || '').trim()

  if (!normalizedQuery) {
    throw new Error('Endereco invalido para geocodificacao.')
  }

  const matches = await searchLocationSuggestionsAction(normalizedQuery)
  const firstMatch = matches[0]

  if (!firstMatch) {
    return null
  }

  return {
    latitude: firstMatch.latitude,
    longitude: firstMatch.longitude,
  }
}
