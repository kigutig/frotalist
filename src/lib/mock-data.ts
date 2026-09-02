import type {
  Truck,
  Driver,
  Trip,
  Occurrence,
  Maintenance,
  User,
} from '../types'

// Arquivo limpo — todos os dados são buscados e gravados diretamente no Supabase
export const MOCK_USERS: User[] = []
export const MOCK_TRUCKS: Truck[] = []
export const MOCK_DRIVERS: Driver[] = []
export const MOCK_TRIPS: Trip[] = []
export const MOCK_OCCURRENCES: Occurrence[] = []
export const MOCK_MAINTENANCE: Maintenance[] = []
export const MOCK_CHECKLISTS_BY_DAY: { date: string; departure: number; return: number }[] = []
export const MOCK_OCCURRENCES_BY_CATEGORY: { category: string; count: number; percentage: number }[] = []
