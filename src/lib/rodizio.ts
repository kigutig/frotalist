/**
 * Utilitário de Cálculo e Monitoramento do Rodízio Municipal de Veículos e Caminhões (CET-SP / ZMRC)
 * 
 * Regras do Rodízio Municipal de São Paulo / Região Metropolitana:
 * - Segunda-feira: Placas com finais 1 e 2
 * - Terça-feira:   Placas com finais 3 e 4
 * - Quarta-feira:  Placas com finais 5 e 6
 * - Quinta-feira:  Placas com finais 7 e 8
 * - Sexta-feira:   Placas com finais 9 e 0
 * - Sábado, Domingo e Feriados: Não há rodízio.
 * 
 * Horários:
 * - Automóveis / Veículos leves: 07h00 às 10h00 e 17h00 às 20h00
 * - Caminhões (ZMRC - Zona de Máxima Restrição de Circulação): 05h00 às 21h00 em dias úteis
 */

export interface RodizioDayInfo {
  dayOfWeek: number // 0 = Domingo, 1 = Segunda, ..., 6 = Sábado
  dayName: string
  isWeekend: boolean
  restrictedDigits: number[]
  restrictedDigitsText: string
  truckHoursText: string
  generalHoursText: string
}

export interface TruckRodizioStatus {
  plate: string
  lastDigit: number | null
  rodizioDayNumber: number | null // 1 a 5 (Seg a Sex)
  rodizioDayName: string
  isRodizioToday: boolean
  isTruckRestrictedNow: boolean
  isGeneralRestrictedNow: boolean
  warningTitle?: string
  warningMessage?: string
  hoursText: string
}

const DAY_NAMES = [
  'Domingo',
  'Segunda-feira',
  'Terça-feira',
  'Quarta-feira',
  'Quinta-feira',
  'Sexta-feira',
  'Sábado',
]

// Mapeamento: dia da semana (1=Segunda ... 5=Sexta) -> dígitos restritos
const DAY_TO_DIGITS: Record<number, number[]> = {
  1: [1, 2], // Segunda
  2: [3, 4], // Terça
  3: [5, 6], // Quarta
  4: [7, 8], // Quinta
  5: [9, 0], // Sexta
}

// Mapeamento: dígito final -> dia da semana
const DIGIT_TO_DAY: Record<number, { dayNumber: number; dayName: string; pair: [number, number] }> = {
  1: { dayNumber: 1, dayName: 'Segunda-feira', pair: [1, 2] },
  2: { dayNumber: 1, dayName: 'Segunda-feira', pair: [1, 2] },
  3: { dayNumber: 2, dayName: 'Terça-feira', pair: [3, 4] },
  4: { dayNumber: 2, dayName: 'Terça-feira', pair: [3, 4] },
  5: { dayNumber: 3, dayName: 'Quarta-feira', pair: [5, 6] },
  6: { dayNumber: 3, dayName: 'Quarta-feira', pair: [5, 6] },
  7: { dayNumber: 4, dayName: 'Quinta-feira', pair: [7, 8] },
  8: { dayNumber: 4, dayName: 'Quinta-feira', pair: [7, 8] },
  9: { dayNumber: 5, dayName: 'Sexta-feira', pair: [9, 0] },
  0: { dayNumber: 5, dayName: 'Sexta-feira', pair: [9, 0] },
}

/**
 * Extrai o último dígito numérico da placa do veículo.
 * Compatível com modelo tradicional (ABC-1234 -> 4) e modelo Mercosul (ABC1D23 -> 3).
 */
export function getPlateLastDigit(plate: string): number | null {
  if (!plate || typeof plate !== 'string') return null
  const cleaned = plate.trim()
  if (!cleaned) return null

  // Busca o último caractere numérico na string da placa
  const matches = cleaned.match(/\d/g)
  if (!matches || matches.length === 0) return null

  const lastChar = matches[matches.length - 1]
  const digit = parseInt(lastChar, 10)
  return isNaN(digit) ? null : digit
}

/**
 * Retorna as regras de rodízio para o dia atual ou uma data informada.
 */
export function getTodayRodizioInfo(date: Date = new Date()): RodizioDayInfo {
  const dayOfWeek = date.getDay()
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6
  const restrictedDigits = isWeekend ? [] : (DAY_TO_DIGITS[dayOfWeek] || [])

  const restrictedDigitsText = restrictedDigits.length > 0
    ? `Finais ${restrictedDigits.join(' e ')}`
    : 'Sem restrição (Fim de semana)'

  return {
    dayOfWeek,
    dayName: DAY_NAMES[dayOfWeek],
    isWeekend,
    restrictedDigits,
    restrictedDigitsText,
    truckHoursText: '05h00 às 21h00 (ZMRC / Caminhões)',
    generalHoursText: '07h00 às 10h00 e 17h00 às 20h00',
  }
}

/**
 * Verifica se um horário específico está dentro da restrição de caminhões (ZMRC: 05h às 21h nos dias úteis).
 */
export function isWithinTruckRodizioHours(date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) return false // Fim de semana não tem rodízio

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const totalMinutes = hours * 60 + minutes

  // 05:00 = 300 min; 21:00 = 1260 min
  return totalMinutes >= 300 && totalMinutes < 1260
}

/**
 * Verifica se um horário específico está dentro do horário geral de automóveis (07-10h ou 17-20h nos dias úteis).
 */
export function isWithinGeneralRodizioHours(date: Date = new Date()): boolean {
  const dayOfWeek = date.getDay()
  if (dayOfWeek === 0 || dayOfWeek === 6) return false

  const hours = date.getHours()
  const minutes = date.getMinutes()
  const totalMinutes = hours * 60 + minutes

  // Manhã: 07:00 (420) às 10:00 (600)
  const isMorning = totalMinutes >= 420 && totalMinutes < 600
  // Tarde/Noite: 17:00 (1020) às 20:00 (1200)
  const isEvening = totalMinutes >= 1020 && totalMinutes < 1200

  return isMorning || isEvening
}

/**
 * Analisa a situação completa de rodízio de um caminhão em relação a uma data/hora.
 */
export function checkTruckRodizio(plate: string, date: Date = new Date()): TruckRodizioStatus {
  const lastDigit = getPlateLastDigit(plate)
  const dayInfo = getTodayRodizioInfo(date)

  if (lastDigit === null) {
    return {
      plate,
      lastDigit: null,
      rodizioDayNumber: null,
      rodizioDayName: 'Desconhecido',
      isRodizioToday: false,
      isTruckRestrictedNow: false,
      isGeneralRestrictedNow: false,
      hoursText: dayInfo.truckHoursText,
    }
  }

  const dayRule = DIGIT_TO_DAY[lastDigit]
  const isRodizioToday = !dayInfo.isWeekend && dayRule.dayNumber === dayInfo.dayOfWeek
  const isTruckRestrictedNow = isRodizioToday && isWithinTruckRodizioHours(date)
  const isGeneralRestrictedNow = isRodizioToday && isWithinGeneralRodizioHours(date)

  let warningTitle: string | undefined
  let warningMessage: string | undefined

  if (isRodizioToday) {
    if (isTruckRestrictedNow) {
      warningTitle = `🚨 ALERTA DE RODÍZIO ATIVO AGORA (Final ${lastDigit})`
      warningMessage = `Este caminhão (placa ${plate}, final ${lastDigit}) está em horário e dia de rodízio hoje (${dayInfo.dayName})! Restrição para caminhões na ZMRC ativa das 05h00 às 21h00.`
    } else {
      warningTitle = `⚠️ Atenção: Dia de Rodízio Hoje (Final ${lastDigit})`
      warningMessage = `Este caminhão possui placa final ${lastDigit} e está em dia de rodízio hoje (${dayInfo.dayName}). Restrição na ZMRC de SP das 05h00 às 21h00.`
    }
  }

  return {
    plate,
    lastDigit,
    rodizioDayNumber: dayRule.dayNumber,
    rodizioDayName: dayRule.dayName,
    isRodizioToday,
    isTruckRestrictedNow,
    isGeneralRestrictedNow,
    warningTitle,
    warningMessage,
    hoursText: dayInfo.truckHoursText,
  }
}
