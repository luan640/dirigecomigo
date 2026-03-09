'use server'

export async function geocodeCepAction(cep: string) {
  const token = String(process.env.CEPABERTO_TOKEN || '').trim()
  const normalizedCep = String(cep || '').replace(/\D/g, '')

  if (!token) {
    throw new Error('CEPABERTO_TOKEN nao configurado.')
  }

  if (!normalizedCep || normalizedCep.length !== 8) {
    throw new Error('CEP invalido para geocodificacao.')
  }

  const response = await fetch(`https://www.cepaberto.com/api/v3/cep?cep=${normalizedCep}`, {
    cache: 'no-store',
    headers: {
      Authorization: `Token token=${token}`,
      'User-Agent': 'DirecaoFacil/1.0',
    },
  })

  if (!response.ok) {
    throw new Error('Falha ao obter coordenadas do endereco.')
  }

  const data = await response.json()
  if (!data?.latitude || !data?.longitude) {
    return null
  }

  return {
    latitude: Number(data.latitude),
    longitude: Number(data.longitude),
  }
}
