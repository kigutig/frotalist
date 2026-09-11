/**
 * Serviço de Cálculo de Rotas e Estimativa de Tempo de Viagem para Caminhões
 * 
 * Utiliza OpenStreetMap (Nominatim + OSRM) com fallback offline para cidades brasileiras.
 * Aplica correções logísticas para veículos pesados (caminhões):
 * - Velocidade média regulamentar de carga (~65 a 75 km/h).
 * - Paradas obrigatórias da Lei do Motorista (30 min a cada 4 horas de direção).
 * - Estimativa aproximada de consumo de diesel.
 */

export interface RouteCalculationResult {
  distanceKm: number
  durationMinutes: number
  durationFormatted: string
  estimatedArrival: Date
  estimatedArrivalFormatted: string
  originFormatted: string
  destinationFormatted: string
  source: 'osrm' | 'fallback'
  restStops: number
  fuelEstimateLiters?: number
  insights: string[]
}

export const FIXED_DEPARTURE_ORIGIN =
  'Rua Soluções do Lar, 291 - GALPÃO 01 - Jardim do Rio Cotia, Cotia - SP, 06716-020'

// Coordenadas das principais cidades e polos logísticos do Brasil para fallback offline
const BRAZILIAN_CITY_COORDS: Record<string, [number, number]> = {
  // Galpão Fixo de Saída da Frota (Cotia - SP)
  'cotia': [-23.6035, -46.9190],
  'jardim do rio cotia': [-23.6035, -46.9190],
  'solucoes do lar': [-23.6035, -46.9190],
  'rua solucoes do lar': [-23.6035, -46.9190],
  'rua solucoes do lar, 291 - galpao 01 - jardim do rio cotia, cotia - sp, 06716-020': [-23.6035, -46.9190],
  'patio central': [-23.6035, -46.9190],
  'sao paulo': [-23.5505, -46.6333],
  'sp': [-23.5505, -46.6333],
  'campinas': [-22.9099, -47.0626],
  'santos': [-23.9608, -46.3336],
  'sao jose dos campos': [-23.2237, -45.9009],
  'sorocaba': [-23.5015, -47.4521],
  'ribeirao preto': [-21.1767, -47.8208],
  'sao jose do rio preto': [-20.8113, -49.3758],
  'bauru': [-22.3147, -49.0606],
  'rio de janeiro': [-22.9068, -43.1729],
  'rj': [-22.9068, -43.1729],
  'duque de caxias': [-22.7856, -43.3117],
  'belo horizonte': [-19.9167, -43.9345],
  'bh': [-19.9167, -43.9345],
  'betim': [-19.9678, -44.1983],
  'contagem': [-19.9321, -44.0539],
  'uberlandia': [-18.9186, -48.2772],
  'curitiba': [-25.4284, -49.2733],
  'pr': [-25.4284, -49.2733],
  'londrina': [-23.3045, -51.1696],
  'maringa': [-23.4210, -51.9331],
  'paranagua': [-25.5205, -48.5095],
  'joinville': [-26.3044, -48.8464],
  'florianopolis': [-27.5954, -48.5480],
  'itajai': [-26.9078, -48.6619],
  'porto alegre': [-30.0346, -51.2177],
  'caxias do sul': [-29.1685, -51.1794],
  'brasilia': [-15.7975, -47.8919],
  'df': [-15.7975, -47.8919],
  'goiania': [-16.6869, -49.2648],
  'anapolis': [-16.3267, -48.9534],
  'cuiaba': [-15.6010, -56.0974],
  'campo grande': [-20.4697, -54.6201],
  'salvador': [-12.9714, -38.5014],
  'feira de santana': [-12.2664, -38.9663],
  'recife': [-8.0476, -34.8770],
  'suape': [-8.3969, -34.9667],
  'fortaleza': [-3.7172, -38.5433],
  'vitoria': [-20.3155, -40.3128],
  'serra': [-20.1286, -40.3078],
}

/**
 * Normaliza o texto de endereço ou cidade para busca de correspondência
 */
function normalizeText(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

/**
 * Formata minutos em formato legível (ex: "2h 35min" ou "45min")
 */
export function formatDurationMinutes(totalMinutes: number): string {
  const rounded = Math.round(totalMinutes)
  const hours = Math.floor(rounded / 60)
  const minutes = rounded % 60

  if (hours === 0) {
    return `${minutes}min`
  }
  if (minutes === 0) {
    return `${hours}h`
  }
  return `${hours}h ${minutes}min`
}

/**
 * Formata data/hora de chegada prevista
 */
export function formatEstimatedArrival(arrivalDate: Date): string {
  return arrivalDate.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Calcula a distância haversine entre duas coordenadas em km
 */
function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371 // Raio da Terra em km
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

/**
 * Busca coordenadas conhecidas no dicionário local
 */
function findLocalCoords(query: string): [number, number] | null {
  const normalized = normalizeText(query)
  if (!normalized) return null

  // Busca exata
  if (BRAZILIAN_CITY_COORDS[normalized]) {
    return BRAZILIAN_CITY_COORDS[normalized]
  }

  // Busca parcial (ex: "Shopping Campinas" encontra "campinas")
  for (const [city, coords] of Object.entries(BRAZILIAN_CITY_COORDS)) {
    if (normalized.includes(city) || city.includes(normalized)) {
      return coords
    }
  }

  return null
}

/**
 * Geocodifica um endereço via Nominatim (OpenStreetMap) com timeout seguro
 */
async function geocodeNominatim(query: string): Promise<[number, number] | null> {
  // Tenta localmente primeiro para velocidade instantânea
  const local = findLocalCoords(query)
  if (local) return local

  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3500)

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
      query + ', Brasil'
    )}&limit=1`

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'pt-BR,pt;q=0.9',
        'User-Agent': 'FrotalistLogistics/1.0',
      },
    })
    clearTimeout(timeout)

    if (!res.ok) return null
    const data = await res.json()
    if (Array.isArray(data) && data.length > 0 && data[0].lat && data[0].lon) {
      return [parseFloat(data[0].lat), parseFloat(data[0].lon)]
    }
  } catch {
    // Ignora erro de rede e recorre ao fallback
  }

  return null
}

/**
 * Calcula rota real via OSRM (Open Source Routing Machine)
 */
async function fetchOsrmRoute(
  startCoords: [number, number],
  endCoords: [number, number]
): Promise<{ distanceKm: number; carMinutes: number } | null> {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 4000)

    // OSRM espera coordenadas no formato lon,lat
    const url = `https://router.project-osrm.org/route/v1/driving/${startCoords[1]},${startCoords[0]};${endCoords[1]},${endCoords[0]}?overview=false`

    const res = await fetch(url, { signal: controller.signal })
    clearTimeout(timeout)

    if (!res.ok) return null
    const data = await res.json()

    if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
      const route = data.routes[0]
      const distanceKm = Math.round(route.distance / 1000)
      const carMinutes = Math.round(route.duration / 60)
      return { distanceKm, carMinutes }
    }
  } catch {
    // Ignora erro de rede e recorre ao fallback
  }

  return null
}

/**
 * Calcula a distância rodoviária e estimativa de tempo para caminhões
 * 
 * @param origin Local de saída (ex: "Pátio Central — São Paulo" ou "São Paulo")
 * @param destination Destino da viagem (ex: "Campinas", "Santos", "Av. Paulista 1000")
 * @param departureTime Data/hora de saída (default: agora)
 * @param averageKmPerLiter Consumo médio de diesel para caminhão (default: 3.5 km/L)
 */
export async function calculateRouteDistanceAndETA(
  origin: string = FIXED_DEPARTURE_ORIGIN,
  destination: string = '',
  departureTime: Date = new Date(),
  averageKmPerLiter = 3.5
): Promise<RouteCalculationResult> {
  const cleanOrigin = (origin || '').trim() || FIXED_DEPARTURE_ORIGIN
  const cleanDest = (destination || '').trim()

  if (!cleanDest) {
    throw new Error('Informe o destino para calcular a distância e o tempo estimado.')
  }

  // 1. Obter coordenadas de origem e destino
  let originCoords = await geocodeNominatim(cleanOrigin)
  if (!originCoords) {
    // Se não encontrou no Nominatim, busca nos hubs locais ou usa Galpão Cotia
    originCoords = findLocalCoords(cleanOrigin) || [-23.6035, -46.9190] // Cotia - Galpão 01
  }

  let destCoords = await geocodeNominatim(cleanDest)
  if (!destCoords) {
    // Se não encontrou, tenta fallback aproximado
    destCoords = findLocalCoords(cleanDest)
  }

  let distanceKm = 0
  let truckDurationMinutes = 0
  let source: 'osrm' | 'fallback' = 'fallback'

  // 2. Tenta calcular rota rodoviária real via OSRM
  if (destCoords) {
    const osrmResult = await fetchOsrmRoute(originCoords, destCoords)
    if (osrmResult && osrmResult.distanceKm > 0) {
      distanceKm = osrmResult.distanceKm
      source = 'osrm'

      // Ajuste para caminhão pesado:
      // OSRM calcula tempo para automóveis leves (~100-110 km/h em autoestradas).
      // Caminhões são limitados por lei e peso a ~70-80 km/h (+25% no tempo base).
      truckDurationMinutes = Math.round(osrmResult.carMinutes * 1.25)
    }
  }

  // 3. Fallback inteligente caso OSRM/Nominatim não respondam
  if (distanceKm === 0) {
    source = 'fallback'
    if (destCoords) {
      const directDistance = haversineDistance(
        originCoords[0],
        originCoords[1],
        destCoords[0],
        destCoords[1]
      )
      // Fator de sinuosidade rodoviária média brasileira (1.30x em relação à linha reta)
      distanceKm = Math.max(15, Math.round(directDistance * 1.3))
    } else {
      // Estimativa heurística padrão para entregas urbanas/regionais
      distanceKm = 45
    }

    // Velocidade média operacional de caminhão: 65 km/h
    truckDurationMinutes = Math.round((distanceKm / 65) * 60)
  }

  // 4. Inclusão de tempo de tráfego urbano e pedágios (~12 min a cada 100 km)
  const trafficAndTollBuffer = Math.round((distanceKm / 100) * 12)
  truckDurationMinutes += trafficAndTollBuffer

  // 5. Paradas obrigatórias (Lei do Descanso do Motorista nº 13.103):
  // 30 minutos de descanso a cada 4 horas de direção contínua
  const rawDrivingHours = truckDurationMinutes / 60
  const restStops = Math.floor(rawDrivingHours / 4)
  if (restStops > 0) {
    truckDurationMinutes += restStops * 30 // Adiciona 30 min por parada obrigatória
  }

  // Mínimo de 15 minutos para qualquer viagem
  truckDurationMinutes = Math.max(15, truckDurationMinutes)

  // 6. Previsão de Chegada
  const estimatedArrival = new Date(departureTime.getTime() + truckDurationMinutes * 60 * 1000)

  // 7. Estimativa de Combustível
  const fuelEstimateLiters = Math.round((distanceKm / averageKmPerLiter) * 10) / 10

  // 8. Dicas e Insights Logísticos
  const insights: string[] = []
  insights.push(`Velocidade média calculada: ~70 km/h (perfil caminhão pesado)`)

  if (restStops > 0) {
    insights.push(
      `Lei do Motorista: ${restStops} parada(s) obrigatória(s) de 30 min inclusa(s) na estimativa`
    )
  }

  if (distanceKm > 200) {
    insights.push(`Prever paradas em postos com ponto de apoio para carga pesada`)
  } else {
    insights.push(`Trecho de curta/média distância`)
  }

  return {
    distanceKm,
    durationMinutes: truckDurationMinutes,
    durationFormatted: formatDurationMinutes(truckDurationMinutes),
    estimatedArrival,
    estimatedArrivalFormatted: formatEstimatedArrival(estimatedArrival),
    originFormatted: cleanOrigin,
    destinationFormatted: cleanDest,
    source,
    restStops,
    fuelEstimateLiters,
    insights,
  }
}
