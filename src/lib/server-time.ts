/**
 * Serviço de Sincronização de Data e Hora Oficial via Internet
 * 
 * Evita fraudes e erros de relógio desconfigurado no aparelho do motorista.
 * Obtém a hora atômica da nuvem (Supabase / Cloudflare) e mantém o offset
 * em milissegundos para cálculo preciso contínuo no fuso de Brasília (UTC-3).
 */

const TIME_OFFSET_STORAGE = 'frotalist_network_time_offset_ms'

// Offset em milissegundos: (hora_servidor_internet - hora_dispositivo_local)
let cachedOffsetMs: number = (() => {
  try {
    const saved = localStorage.getItem(TIME_OFFSET_STORAGE)
    if (saved) {
      const parsed = parseInt(saved, 10)
      if (!isNaN(parsed)) return parsed
    }
  } catch {
    // LocalStorage indisponível em SSR ou testes
  }
  return 0
})()

let isSynchronized = false

export interface InternetTimeResult {
  date: Date
  source: 'supabase' | 'cloudflare' | 'cached' | 'device'
  offsetMs: number
  isNetworkVerified: boolean
}

/**
 * Busca a data e hora oficial diretamente de servidores na Internet.
 * 1º Tenta o cabeçalho 'Date' do Supabase (servidor do banco de dados com relógio NTP).
 * 2º Tenta o timestamp do trace do Cloudflare (CDN global com hora atômica).
 * 3º Fallback para offset previamente sincronizado em cache.
 */
export async function fetchInternetDate(): Promise<InternetTimeResult> {
  const deviceStart = Date.now()

  // 1. Tenta Supabase REST (cabeçalho HTTP Date)
  try {
    const supabaseUrl =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || ''
    const supabaseAnonKey =
      (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || ''

    if (supabaseUrl) {
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 4000)

      const headers: Record<string, string> = {}
      if (supabaseAnonKey) {
        headers['apikey'] = supabaseAnonKey
      }

      const res = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'GET',
        headers,
        signal: controller.signal,
      })
      clearTimeout(timeoutId)

      const dateHeader = res.headers.get('date')
      if (dateHeader) {
        const serverTime = new Date(dateHeader).getTime()
        if (!isNaN(serverTime) && serverTime > 0) {
          const deviceEnd = Date.now()
          // Compensa metade da latência estimada da requisição
          const latencyEstimate = Math.round((deviceEnd - deviceStart) / 2)
          const adjustedServerTime = serverTime + latencyEstimate
          const offset = adjustedServerTime - deviceEnd

          setCachedOffset(offset)
          isSynchronized = true

          return {
            date: new Date(adjustedServerTime),
            source: 'supabase',
            offsetMs: offset,
            isNetworkVerified: true,
          }
        }
      }
    }
  } catch (err) {
    // Supabase falhou ou sem conexão, tenta fallback
  }

  // 2. Tenta Cloudflare Trace (ts em segundos epoch)
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3500)

    const res = await fetch('https://www.cloudflare.com/cdn-cgi/trace', {
      signal: controller.signal,
    })
    clearTimeout(timeoutId)

    const text = await res.text()
    const match = text.match(/ts=(\d+\.?\d*)/)
    if (match) {
      const serverSeconds = parseFloat(match[1])
      if (!isNaN(serverSeconds) && serverSeconds > 0) {
        const serverTime = Math.round(serverSeconds * 1000)
        const offset = serverTime - Date.now()

        setCachedOffset(offset)
        isSynchronized = true

        return {
          date: new Date(serverTime),
          source: 'cloudflare',
          offsetMs: offset,
          isNetworkVerified: true,
        }
      }
    }
  } catch {
    // Cloudflare indisponível
  }

  // 3. Fallback: usa offset sincronizado anteriormente
  if (isSynchronized || cachedOffsetMs !== 0) {
    return {
      date: new Date(Date.now() + cachedOffsetMs),
      source: 'cached',
      offsetMs: cachedOffsetMs,
      isNetworkVerified: true,
    }
  }

  // 4. Último fallback: relógio do aparelho
  return {
    date: new Date(),
    source: 'device',
    offsetMs: 0,
    isNetworkVerified: false,
  }
}

function setCachedOffset(offset: number) {
  cachedOffsetMs = offset
  try {
    localStorage.setItem(TIME_OFFSET_STORAGE, String(offset))
  } catch {
    // Silencia erros de storage
  }
}

/**
 * Retorna a data e hora oficial atual corrigida pelo offset de rede.
 * Funciona instantaneamente em milissegundos sem travar a interface.
 */
export function getNetworkDate(): Date {
  return new Date(Date.now() + cachedOffsetMs)
}

/**
 * Formata a data para a string esperada pelo input datetime-local (YYYY-MM-DDTHH:mm)
 * garantindo a conversão correta para o Horário de Brasília (America/Sao_Paulo).
 */
export function formatToSaoPauloDatetimeInput(date: Date = getNetworkDate()): string {
  try {
    // Formata usando a API nativa Intl com timezone de São Paulo
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Sao_Paulo',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })

    const parts = formatter.formatToParts(date)
    const map: Record<string, string> = {}
    for (const p of parts) {
      map[p.type] = p.value
    }

    const yyyy = map.year
    const mm = map.month
    const dd = map.day
    const hh = map.hour
    const min = map.minute

    if (yyyy && mm && dd && hh && min) {
      return `${yyyy}-${mm}-${dd}T${hh}:${min}`
    }
  } catch {
    // Fallback manual caso Intl falhe
  }

  // Fallback seguro
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

/**
 * Formata data e hora para exibição humana em pt-BR (ex: "11/09/2026 às 08:55").
 */
export function formatNetworkDateTime(date: Date = getNetworkDate()): string {
  return new Intl.DateTimeFormat('pt-BR', {
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date).replace(',', ' às')
}
